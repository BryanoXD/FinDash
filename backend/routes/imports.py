"""
Import Routes - upload, preview, confirm.

Accepts JSON {filename, file_base64} (preferred for K8s ingress) or multipart.

Flow:
    POST /api/import/upload   -> parse + dedupe + preview, store batch metadata
    POST /api/import/confirm  -> persist accepted transactions
    GET  /api/import/history  -> list past batches
"""
from __future__ import annotations

import base64
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from services.import_service import parse_file, dedupe_transactions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTS = {".csv", ".ofx", ".qfx", ".pdf"}


def _ext(filename: str) -> str:
    name = (filename or "").strip().lower()
    if "." not in name:
        return ""
    return "." + name.rsplit(".", 1)[-1]


async def _read_payload(request: Request) -> tuple:
    """Extract (filename, content_bytes) from either JSON base64 or multipart."""
    content_type = (request.headers.get("content-type") or "").lower()
    if "application/json" in content_type:
        body = await request.json()
        filename = (body.get("filename") or "").strip()
        b64 = body.get("file_base64") or body.get("content") or ""
        if not filename:
            raise HTTPException(status_code=400, detail="Arquivo nao enviado (campo 'filename' ausente)")
        if not b64:
            raise HTTPException(status_code=400, detail="Arquivo nao enviado (campo 'file_base64' ausente)")
        try:
            content = base64.b64decode(b64, validate=False)
        except Exception:
            raise HTTPException(status_code=400, detail="Falha ao decodificar base64 do arquivo")
        return filename, content

    # Multipart fallback
    form = await request.form()
    f = form.get("file")
    if f is None or not hasattr(f, "read"):
        raise HTTPException(status_code=400, detail="Arquivo nao enviado")
    filename = f.filename or ""
    content = await f.read()
    return filename, content


@router.post("/upload")
async def upload_and_parse(request: Request, db=None, user_id: str = None):
    """Upload + parse + dedupe + preview (no DB writes for transactions)."""
    filename, content = await _read_payload(request)

    ext = _ext(filename)
    logger.info(f"Import upload: file={filename}, ext={ext}, size={len(content)}")

    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato nao suportado. Aceitos: CSV, OFX, PDF (recebido: {ext or 'sem extensao'})",
        )
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Maximo 10MB.")

    try:
        result = parse_file(filename, content)
    except ValueError as e:
        logger.warning(f"Import parse failed for {filename}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected parser error: {e}")
        raise HTTPException(status_code=500, detail="Erro inesperado ao processar arquivo")

    parsed = result["transactions"]
    if not parsed:
        raise HTTPException(status_code=400, detail="Nenhuma transacao valida encontrada no arquivo")

    # Build existing hashes set to detect duplicates against DB
    existing_hashes = set()
    if db is not None and user_id:
        cursor = db.transactions.find(
            {"user_id": user_id, "import_hash": {"$exists": True}},
            {"_id": 0, "import_hash": 1},
        )
        async for row in cursor:
            if row.get("import_hash"):
                existing_hashes.add(row["import_hash"])

    dedup = dedupe_transactions(parsed, existing_hashes)

    # Save batch metadata so /confirm can validate
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    if db is not None and user_id:
        await db.import_batches.insert_one({
            "id": batch_id,
            "user_id": user_id,
            "file_name": filename,
            "source_type": ext.lstrip("."),
            "total_parsed": len(parsed),
            "duplicates_count": dedup["duplicates_count"],
            "warnings": result.get("warnings", []),
            "transactions": dedup["transactions"],  # full preview persisted
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {
        "batch_id": batch_id,
        "file_name": filename,
        "source_type": ext.lstrip("."),
        "total_parsed": len(parsed),
        "duplicates_count": dedup["duplicates_count"],
        "warnings": result.get("warnings", []),
        "transactions": dedup["transactions"],
    }


@router.post("/confirm")
async def confirm_import(request: Request, db=None, user_id: str = None):
    """Persist accepted transactions into the user's `transactions` collection."""
    body = await request.json()
    batch_id = body.get("batch_id")
    accepted_ids = set(body.get("accepted_ids") or [])
    overrides = body.get("overrides") or {}  # {preview_id: {"category": "...", "categoria_id": "..."}}

    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id obrigatorio")
    if not accepted_ids:
        raise HTTPException(status_code=400, detail="Selecione pelo menos uma transacao para importar")

    batch = await db.import_batches.find_one({"id": batch_id, "user_id": user_id}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Lote de importacao nao encontrado")
    if batch.get("status") == "confirmed":
        raise HTTPException(status_code=400, detail="Lote ja foi importado")

    # Load user categories to map name -> id (lazy match by lowercase name)
    user_cats = await db.categories.find({"user_id": user_id}, {"_id": 0}).to_list(500)
    cat_by_norm = {(c.get("nome") or "").strip().lower(): c for c in user_cats}

    created = 0
    errors = []
    docs_to_insert = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for tx in batch.get("transactions", []):
        if tx["id"] not in accepted_ids:
            continue
        if tx.get("duplicate"):
            continue

        override = overrides.get(tx["id"]) or {}
        cat_name = override.get("category") or tx.get("category") or "Outros"
        cat_id = override.get("categoria_id")
        if not cat_id:
            match = cat_by_norm.get(cat_name.strip().lower())
            cat_id = match.get("id") if match else "uncategorized"

        direction = tx.get("direction", "expense")
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "descricao": (tx.get("description") or "")[:200],
            "categoria": cat_name,
            "categoria_id": cat_id or "uncategorized",
            "valor": float(tx.get("amount") or 0),
            "tipo": "receita" if direction == "income" else "despesa",
            "data": tx.get("transactionDate"),
            "data_vencimento": tx.get("transactionDate"),
            "metodo": "outros",
            "tags": ["importado"],
            "recorrente": False,
            "pago": True,
            "detalhado": False,
            "itens": [],
            "import_batch_id": batch_id,
            "import_hash": tx.get("hash"),
            "import_source": tx.get("sourceType"),
            "import_external_id": tx.get("externalId"),
            "created_at": now_iso,
        }
        docs_to_insert.append(doc)

    if docs_to_insert:
        try:
            await db.transactions.insert_many(docs_to_insert)
            created = len(docs_to_insert)
        except Exception as exc:
            logger.exception("Failed inserting imported transactions")
            raise HTTPException(status_code=500, detail=f"Erro ao salvar transacoes importadas: {exc}")

    await db.import_batches.update_one(
        {"id": batch_id, "user_id": user_id},
        {"$set": {
            "status": "confirmed",
            "imported_count": created,
            "confirmed_at": now_iso,
        }},
    )

    return {
        "message": "Importacao concluida",
        "batch_id": batch_id,
        "imported": created,
        "errors": errors,
    }


@router.get("/history")
async def get_history(request: Request, db=None, user_id: str = None):
    cursor = db.import_batches.find(
        {"user_id": user_id},
        {"_id": 0, "transactions": 0},
    ).sort("created_at", -1).limit(50)
    return await cursor.to_list(50)
