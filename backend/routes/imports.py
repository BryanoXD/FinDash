"""
Import Routes - Upload, preview, confirm import
"""
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from datetime import datetime, timezone
import uuid

from services.import_service import (
    parse_csv, parse_ofx, parse_pdf,
    normalize_transactions, check_duplicates, categorize_transaction
)

router = APIRouter(prefix="/import", tags=["import"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".csv", ".ofx", ".pdf"}


@router.post("/upload")
async def upload_and_parse(file: UploadFile = File(...), request: Request = None, db=None, user_id: str = None):
    """Upload file, parse, normalize, categorize and check duplicates."""
    # Validar extensão
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Formato nao suportado: {ext}. Use CSV, OFX ou PDF.")

    # Ler conteúdo
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Maximo 10MB.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    # Gerar batch ID
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"

    # Parse de acordo com o tipo
    try:
        if ext == ".csv":
            raw_txs = parse_csv(content, filename)
        elif ext == ".ofx":
            raw_txs = parse_ofx(content, filename)
        elif ext == ".pdf":
            raw_txs = parse_pdf(content, filename)
        else:
            raise ValueError("Formato nao suportado")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

    if not raw_txs:
        raise HTTPException(status_code=400, detail="Nenhuma transacao encontrada no arquivo.")

    # Normalizar
    normalized = normalize_transactions(raw_txs, ext.replace(".", ""), batch_id)

    # Verificar duplicatas
    normalized = await check_duplicates(normalized, user_id, db)

    # Salvar batch no DB para persistir o estado
    batch_doc = {
        "id": batch_id,
        "user_id": user_id,
        "file_name": filename,
        "file_type": ext,
        "file_size": len(content),
        "total_rows_read": len(raw_txs),
        "total_normalized": len(normalized),
        "total_duplicates": sum(1 for t in normalized if t["status"] == "duplicate"),
        "status": "preview",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "transactions": normalized,
    }
    await db.import_batches.insert_one(batch_doc)

    # Retornar preview (sem _id e sem raw_data para economia)
    preview = []
    for t in normalized:
        preview.append({
            "id": t["id"],
            "date": t["date"],
            "description": t["description"],
            "amount": t["amount"],
            "direction": t["direction"],
            "category": t["category"],
            "confidence": t["confidence"],
            "is_recurring": t["is_recurring"],
            "status": t["status"],
            "duplicate_reason": t.get("duplicate_reason", ""),
            "tags": t["tags"],
        })

    return {
        "batch_id": batch_id,
        "file_name": filename,
        "file_type": ext,
        "total_rows": len(normalized),
        "total_duplicates": batch_doc["total_duplicates"],
        "transactions": preview,
    }


@router.post("/confirm")
async def confirm_import(request: Request, db=None, user_id: str = None):
    """Confirm import - save selected transactions to the system."""
    body = await request.json()
    batch_id = body.get("batch_id")
    selected_ids = body.get("selected_ids", [])  # IDs to import
    edits = body.get("edits", {})  # {id: {category, direction, description}} user edits

    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id obrigatorio")

    # Buscar batch
    batch = await db.import_batches.find_one(
        {"id": batch_id, "user_id": user_id}, {"_id": 0}
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Lote de importacao nao encontrado")

    # Buscar categorias do usuário
    categories = await db.categories.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    cat_by_name = {c["nome"]: c for c in categories}

    imported_count = 0
    errors = 0

    for tx in batch.get("transactions", []):
        if tx["id"] not in selected_ids:
            continue

        # Aplicar edições do usuário
        if tx["id"] in edits:
            user_edit = edits[tx["id"]]
            if "category" in user_edit:
                tx["category"] = user_edit["category"]
            if "direction" in user_edit:
                tx["direction"] = user_edit["direction"]
            if "description" in user_edit:
                tx["description"] = user_edit["description"]

        # Encontrar ou criar categoria
        cat_name = tx.get("category", "Outros")
        tipo = tx.get("direction", "despesa")
        if tipo == "unknown":
            tipo = "despesa"

        cat = cat_by_name.get(cat_name)
        cat_id = cat["id"] if cat else ""

        # Se categoria não existe, criar
        if not cat_id:
            from models import Category
            new_cat = Category(
                user_id=user_id,
                nome=cat_name,
                tipo="ambos",
                cor="#6366f1",
            )
            doc = new_cat.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.categories.insert_one(doc)
            cat_id = new_cat.id
            cat_by_name[cat_name] = {"id": cat_id, "nome": cat_name}

        # Criar transação no formato do sistema
        try:
            from models import Transaction
            new_tx = Transaction(
                user_id=user_id,
                descricao=tx["description"],
                categoria=cat_name,
                categoria_id=cat_id,
                valor=tx["amount"],
                tipo=tipo,
                data=tx["date"],
                pago=True,
                recorrente=tx.get("is_recurring", False),
                metodo="Importado",
            )
            doc = new_tx.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            doc["import_batch_id"] = batch_id
            await db.transactions.insert_one(doc)
            imported_count += 1
        except Exception:
            errors += 1

    # Atualizar batch status
    await db.import_batches.update_one(
        {"id": batch_id, "user_id": user_id},
        {"$set": {
            "status": "completed",
            "total_imported": imported_count,
            "total_errors": errors,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    # Recalcular orçamentos afetados
    from routes.transactions import recalculate_budget_spent
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    for b in budgets:
        await recalculate_budget_spent(b["categoria_id"], user_id, db)

    return {
        "message": f"{imported_count} transacoes importadas com sucesso",
        "imported": imported_count,
        "errors": errors,
        "batch_id": batch_id,
    }


@router.get("/history")
async def get_import_history(request: Request, db=None, user_id: str = None):
    """Get import history for user."""
    batches = await db.import_batches.find(
        {"user_id": user_id},
        {"_id": 0, "transactions": 0}
    ).sort("created_at", -1).to_list(50)
    return batches
