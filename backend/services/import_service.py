"""
Import Service - parsers for CSV, OFX, PDF + normalization + categorization + dedup.

Designed primarily for Nubank Brazilian PT-BR statements but generic enough for
common bank exports.

Public API:
    parse_file(filename, content_bytes) -> {"transactions": [...], "warnings": [...]}

Each transaction follows the normalized schema:
    {
      id, importBatchId (set by route), sourceType,
      transactionDate (ISO date), description, originalDescription,
      amount (float >= 0), direction ("income"|"expense"),
      category, subcategory, accountName, institutionName,
      externalId, confidenceScore (0..1), rawData (str),
      hash (str)  # used for dedup
    }
"""
from __future__ import annotations

import csv
import hashlib
import io
import logging
import re
import unicodedata
import uuid
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)

# ============================================================
# CATEGORY RULES - keyword -> category
# Order matters: more specific first.
# ============================================================
CATEGORY_RULES: List[tuple] = [
    # Pagamento de fatura (cartão de crédito)
    (["pagamento de fatura", "fatura cartao", "fatura do cartao"], "Cartao de Credito"),
    # Investimentos
    (["aplicacao rdb", "resgate rdb", "rendimento do rdb", "rendimento liquido", "aplicacao", "investimento"], "Investimentos"),
    # Receitas explícitas
    (["salario", "folha de pagamento", "pro labore", "13o salario", "decimo terceiro", "rescisao"], "Salario"),
    # Transferências recebidas / saídas
    (["transferencia recebida", "recebida pelo pix", "pix recebido", "reembolso", "estorno"], "Receitas"),
    (["transferencia enviada", "enviada pelo pix"], "Transferencias"),
    # Alimentação
    (["mercearia", "mercado", "supermercado", "supermercados", "atacadao", "atacado", "padaria", "hortifruti",
      "carrefour", "extra", "pao de acucar", "angeloni", "cooper", "ranchobom", "portal", "ulloffo",
      "aromapress maquinas"], "Alimentacao"),
    # Restaurantes / lazer alimentar
    (["restaurante", "lanchonete", "burger", "boteco", "espetaria", "pizzaria", "cafe ", "cafeteria",
      "ifood", "rappi", "uber eats", "ubereats"], "Lazer"),
    # Transporte / combustível
    (["posto fl", "posto ", "combustivel", "gasolina", "etanol", "shell", "ipiranga", "br distribuidora",
      "uber *uber", "uber trip", "uber *trip", "uber ", "99 app", "cabify", "pedagio", "estacionamento"], "Transporte"),
    # Moradia / utilities
    (["aluguel", "condominio", "energia", "eletrica", "cpfl", "enel", "cemig", "celesc",
      "samae", "agua", "sabesp", "sanepar", "casan", "gas natural", "comgas"], "Moradia"),
    # Comunicação
    (["tim", "claro", "vivo", "oi", "telefonica", "telecom", "internet", "unifique", "netcombo"], "Comunicacao"),
    # Saúde
    (["farmacia", "drogaria", "droga raia", "drogasil", "pague menos", "hospital",
      "clinica", "medico", "dentista", "laboratorio", "plano de saude", "unimed", "amil",
      "sulamerica", "hapvida", "consulta", "exame"], "Saude"),
    # Assinaturas
    (["netflix", "spotify", "prime video", "amazon prime", "disney", "hbo", "globoplay", "deezer",
      "apple.com", "icloud", "google storage", "xbox", "playstation", "steam",
      "youtube premium", "paramount", "assinatura"], "Assinaturas"),
    # Esportes / vestuário
    (["esporte moto bike", "academia", "gym", "smart fit"], "Lazer"),
    # Educação
    (["escola", "faculdade", "universidade", "curso", "udemy", "alura", "rocketseat",
      "livro", "livraria", "mensalidade", "material escolar"], "Educacao"),
]

# Words that strongly indicate income direction when amount sign is ambiguous
INCOME_KEYWORDS = [
    "transferencia recebida", "recebida pelo pix", "pix recebido", "reembolso",
    "salario", "estorno", "resgate", "rendimento", "deposito",
]
EXPENSE_KEYWORDS = [
    "compra no debito", "transferencia enviada", "enviada pelo pix",
    "pagamento de fatura", "saque", "aplicacao", "pagamento",
]

PT_MONTHS = {
    "JAN": 1, "FEV": 2, "MAR": 3, "ABR": 4, "MAI": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12,
}

# ============================================================
# HELPERS
# ============================================================
def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _norm(s: str) -> str:
    return _strip_accents((s or "").strip().lower())


def _parse_brl(value_str: str) -> Optional[float]:
    """Parse '1.234,56' or '-1234.56' or '1234.56' -> float. Returns None if not a number."""
    if value_str is None:
        return None
    s = str(value_str).strip()
    if not s:
        return None
    # Already in the form 1234.56 or -1234.56 (no comma)
    if re.fullmatch(r"-?\d+(\.\d+)?", s):
        try:
            return float(s)
        except ValueError:
            return None
    # Brazilian: 1.234,56 (or 1234,56 or 1,5)
    # Remove thousand separators (.) and convert decimal , -> .
    cleaned = s.replace(".", "").replace(",", ".")
    if re.fullmatch(r"-?\d+(\.\d+)?", cleaned):
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _categorize(description: str, direction: str) -> tuple:
    """Returns (category, confidence_score, needs_review)."""
    d = _norm(description)
    for keywords, category in CATEGORY_RULES:
        for kw in keywords:
            if kw in d:
                return (category, 0.85, False)
    # Fallback by direction
    if direction == "income":
        return ("Receitas", 0.5, True)
    return ("Outros", 0.3, True)


def _infer_direction(description: str, amount: float) -> str:
    """When OFX sign is reliable use it. Otherwise inspect keywords."""
    if amount > 0:
        return "income"
    if amount < 0:
        return "expense"
    d = _norm(description)
    if any(k in d for k in INCOME_KEYWORDS):
        return "income"
    if any(k in d for k in EXPENSE_KEYWORDS):
        return "expense"
    return "expense"


def _make_hash(date_iso: str, amount: float, description: str, external_id: Optional[str] = None) -> str:
    """Deterministic hash for dedup."""
    if external_id:
        return hashlib.sha1(f"ext:{external_id}".encode("utf-8")).hexdigest()
    key = f"{date_iso}|{round(abs(amount), 2)}|{_norm(description)[:80]}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def _normalize_record(
    *,
    source_type: str,
    transaction_date: str,
    description: str,
    amount: float,
    direction: Optional[str] = None,
    external_id: Optional[str] = None,
    institution_name: Optional[str] = None,
    raw_data: str = "",
) -> dict:
    desc = (description or "").strip()
    direction = direction or _infer_direction(desc, amount)
    category, conf, needs_review = _categorize(desc, direction)
    amt = round(abs(float(amount)), 2)
    return {
        "id": str(uuid.uuid4()),
        "sourceType": source_type,
        "transactionDate": transaction_date,
        "description": desc[:300],
        "originalDescription": desc,
        "amount": amt,
        "direction": direction,
        "category": category,
        "subcategory": None,
        "accountName": None,
        "institutionName": institution_name,
        "externalId": external_id,
        "confidenceScore": conf,
        "needsReview": needs_review,
        "rawData": raw_data[:500],
        "hash": _make_hash(transaction_date, amt, desc, external_id),
    }


# ============================================================
# CSV PARSER
# ============================================================
CSV_COLUMN_ALIASES = {
    "date": ["data", "date", "dt", "data de lancamento", "data lancamento"],
    "description": ["descricao", "descrição", "historico", "histórico", "description", "memo", "lancamento", "detalhe"],
    "amount": ["valor", "amount", "valor (r$)", "valor r$", "vl", "vlr"],
    "external_id": ["identificador", "id", "fitid"],
    "type": ["tipo", "type"],
}


def _detect_delimiter(sample: str) -> str:
    """Detect csv delimiter."""
    candidates = [",", ";", "\t", "|"]
    counts = {c: sample.count(c) for c in candidates}
    return max(counts, key=counts.get)


def _parse_csv_date(s: str) -> Optional[str]:
    s = (s or "").strip()
    if not s:
        return None
    # 01/10/2024 or 01-10-2024
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_csv(content: bytes) -> dict:
    """Parse a CSV file bytes. Returns {transactions: [...], warnings: [...]}"""
    warnings = []
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1", errors="replace")

    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not text:
        raise ValueError("CSV vazio ou com cabecalho invalido")

    # Auto-detect delimiter using first non-empty line
    first_line = next((ln for ln in text.split("\n") if ln.strip()), "")
    delim = _detect_delimiter(first_line)
    logger.info(f"CSV: delimiter detected = {repr(delim)}")

    reader = csv.reader(io.StringIO(text), delimiter=delim)
    rows = [r for r in reader if any((c or "").strip() for c in r)]
    if len(rows) < 2:
        raise ValueError("CSV vazio ou com apenas cabecalho")

    header = [_norm(c) for c in rows[0]]
    logger.info(f"CSV: header = {header}")

    def find_col(aliases):
        for i, h in enumerate(header):
            if h in aliases:
                return i
        return None

    col_date = find_col(CSV_COLUMN_ALIASES["date"])
    col_desc = find_col(CSV_COLUMN_ALIASES["description"])
    col_amount = find_col(CSV_COLUMN_ALIASES["amount"])
    col_ext = find_col(CSV_COLUMN_ALIASES["external_id"])

    if col_date is None or col_desc is None or col_amount is None:
        raise ValueError(
            f"CSV sem colunas reconheciveis. Cabecalho encontrado: {header}. "
            "Esperado: Data, Descricao, Valor"
        )

    transactions = []
    for i, row in enumerate(rows[1:], start=2):
        if len(row) <= max(col_date, col_desc, col_amount):
            warnings.append(f"Linha {i}: numero de colunas insuficiente, ignorada")
            continue
        date_iso = _parse_csv_date(row[col_date])
        desc = (row[col_desc] or "").strip()
        amount = _parse_brl(row[col_amount])
        ext_id = (row[col_ext].strip() if col_ext is not None and col_ext < len(row) else None) or None

        if not date_iso or not desc or amount is None:
            warnings.append(f"Linha {i}: campos obrigatorios ausentes (data/desc/valor)")
            continue

        transactions.append(_normalize_record(
            source_type="csv",
            transaction_date=date_iso,
            description=desc,
            amount=amount,
            external_id=ext_id,
            institution_name=None,
            raw_data=delim.join(row),
        ))

    logger.info(f"CSV: parsed {len(transactions)} transactions, {len(warnings)} warnings")
    return {"transactions": transactions, "warnings": warnings}


# ============================================================
# OFX PARSER
# ============================================================
def _ofx_extract_tag(block: str, tag: str) -> Optional[str]:
    m = re.search(rf"<{tag}>([^<\n\r]+)", block, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _parse_ofx_date(s: str) -> Optional[str]:
    """Parse 20241001000000[-3:BRT] or 20241001 -> ISO date."""
    if not s:
        return None
    digits = re.match(r"(\d{8})", s.strip())
    if not digits:
        return None
    try:
        return datetime.strptime(digits.group(1), "%Y%m%d").date().isoformat()
    except ValueError:
        return None


def parse_ofx(content: bytes) -> dict:
    warnings = []
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1", errors="replace")

    if "<OFX" not in text.upper():
        raise ValueError("OFX invalido ou sem cabecalho")

    institution = _ofx_extract_tag(text, "ORG") or "Banco"

    # Find every <STMTTRN>...</STMTTRN> block
    blocks = re.findall(r"<STMTTRN>(.*?)</STMTTRN>", text, re.IGNORECASE | re.DOTALL)
    if not blocks:
        # Some OFX (SGML) don't close tags; try greedy split by <STMTTRN>
        loose_blocks = re.split(r"<STMTTRN>", text, flags=re.IGNORECASE)[1:]
        blocks = [b.split("<STMTTRN>")[0] for b in loose_blocks]

    logger.info(f"OFX: found {len(blocks)} STMTTRN blocks, institution={institution}")
    if not blocks:
        raise ValueError("OFX invalido ou sem transacoes")

    transactions = []
    for i, block in enumerate(blocks):
        amount_str = _ofx_extract_tag(block, "TRNAMT")
        date_str = _ofx_extract_tag(block, "DTPOSTED")
        memo = _ofx_extract_tag(block, "MEMO") or _ofx_extract_tag(block, "NAME") or ""
        fitid = _ofx_extract_tag(block, "FITID")
        ttype = (_ofx_extract_tag(block, "TRNTYPE") or "").upper()

        amount = _parse_brl(amount_str) if amount_str else None
        date_iso = _parse_ofx_date(date_str) if date_str else None

        if amount is None or not date_iso or not memo.strip():
            warnings.append(f"OFX bloco {i}: dados incompletos, ignorado")
            continue

        direction = "income" if amount > 0 else "expense"
        if ttype == "CREDIT":
            direction = "income"
        elif ttype == "DEBIT":
            direction = "expense"

        transactions.append(_normalize_record(
            source_type="ofx",
            transaction_date=date_iso,
            description=memo,
            amount=amount,
            direction=direction,
            external_id=fitid,
            institution_name=institution,
            raw_data=block.strip()[:400],
        ))

    logger.info(f"OFX: parsed {len(transactions)} transactions")
    return {"transactions": transactions, "warnings": warnings}


# ============================================================
# PDF PARSER (Nubank PT-BR layout)
# ============================================================
DATE_RE = re.compile(r"^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{4})\b", re.IGNORECASE)
VALUE_AT_END_RE = re.compile(r"([\d.]*\d{1,3},\d{2})\s*$")
TOTAL_ENTRADAS_RE = re.compile(r"Total de entradas", re.IGNORECASE)
TOTAL_SAIDAS_RE = re.compile(r"Total de sa[ií]das", re.IGNORECASE)

# Junk lines we never treat as transactions
IGNORE_PATTERNS = [
    re.compile(r"^Saldo (inicial|final)", re.IGNORECASE),
    re.compile(r"^Rendimento l[ií]quido", re.IGNORECASE),
    re.compile(r"^Movimenta[cç][oõ]es", re.IGNORECASE),
    re.compile(r"^Valores em R\$", re.IGNORECASE),
    re.compile(r"^Tem alguma d[uú]vida", re.IGNORECASE),
    re.compile(r"^Caso a solu[cç][aã]o", re.IGNORECASE),
    re.compile(r"^Extrato gerado", re.IGNORECASE),
    re.compile(r"^CPF\b", re.IGNORECASE),
    re.compile(r"^Ag[eê]ncia", re.IGNORECASE),  # heading line with "Agência" alone (account info)
    re.compile(r"^\d+ de \d+$"),  # page numbers
    re.compile(r"VALORES EM R\$", re.IGNORECASE),
    re.compile(r"^\d{2}\s+DE\s+", re.IGNORECASE),  # "01 DE DEZEMBRO DE 2025 a..."
]


def _extract_pdf_text(content: bytes) -> str:
    """Try pdfplumber first, fallback to PyPDF2."""
    try:
        import pdfplumber  # type: ignore
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join((p.extract_text() or "") for p in pdf.pages)
    except ImportError:
        pass
    except Exception as exc:
        logger.warning(f"pdfplumber failed: {exc}")
    try:
        import PyPDF2  # type: ignore
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as exc:
        logger.error(f"PDF extraction failed: {exc}")
        return ""


def parse_pdf(content: bytes) -> dict:
    warnings = []
    text = _extract_pdf_text(content)
    if not text or not text.strip():
        raise ValueError("PDF nao contem texto extraivel")

    lines = [ln.rstrip() for ln in text.split("\n")]
    logger.info(f"PDF: extracted {len(lines)} lines")

    # State machine
    current_date: Optional[str] = None
    current_direction: Optional[str] = None  # income | expense
    transactions: List[dict] = []
    candidate_count = 0

    def push_with_description(desc: str, amount: float):
        if not current_date or not current_direction:
            return
        nonlocal candidate_count
        candidate_count += 1
        transactions.append(_normalize_record(
            source_type="pdf",
            transaction_date=current_date,
            description=desc,
            amount=amount,
            direction=current_direction,
            institution_name="Nubank",
            raw_data=desc,
        ))

    pending_desc_lines: List[str] = []  # description continuation lines for the last transaction

    def flush_pending_desc():
        """If pending description continuation exists, append to last transaction."""
        if pending_desc_lines and transactions:
            extra = " ".join(pending_desc_lines).strip()
            if extra:
                last = transactions[-1]
                merged = (last["description"] + " " + extra).strip()
                last["description"] = merged[:300]
                last["originalDescription"] = (last["originalDescription"] + " " + extra).strip()
                # Reclassify with full description
                cat, conf, needs = _categorize(merged, last["direction"])
                last["category"] = cat
                last["confidenceScore"] = conf
                last["needsReview"] = needs
                last["hash"] = _make_hash(last["transactionDate"], last["amount"], merged, last["externalId"])
        pending_desc_lines.clear()

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            flush_pending_desc()
            continue

        if any(p.search(line) for p in IGNORE_PATTERNS):
            flush_pending_desc()
            continue

        # Date header? "01 DEZ 2025 Total de entradas + 289,20"
        # or "01 DEZ 2025 Total de saidas - 16,97"
        date_match = DATE_RE.match(line)
        if date_match:
            flush_pending_desc()
            day = int(date_match.group(1))
            month = PT_MONTHS[date_match.group(2).upper()]
            year = int(date_match.group(3))
            try:
                current_date = datetime(year, month, day).date().isoformat()
            except ValueError:
                current_date = None
                continue
            # Remainder might be the section marker
            rest = line[date_match.end():].strip()
            if TOTAL_ENTRADAS_RE.search(rest):
                current_direction = "income"
            elif TOTAL_SAIDAS_RE.search(rest):
                current_direction = "expense"
            else:
                # No section marker; keep current_direction (could be the cont. of a single section)
                current_direction = current_direction or "expense"
            continue

        # Section change within same date: "Total de entradas + ..." / "Total de saidas - ..."
        if TOTAL_ENTRADAS_RE.search(line) and not date_match:
            flush_pending_desc()
            current_direction = "income"
            continue
        if TOTAL_SAIDAS_RE.search(line) and not date_match:
            flush_pending_desc()
            current_direction = "expense"
            continue

        # Skip while we don't have an active date+direction context
        if not current_date or not current_direction:
            continue

        # Does the line END with a BRL value? -> new transaction
        m = VALUE_AT_END_RE.search(line)
        if m:
            flush_pending_desc()
            value_str = m.group(1)
            amount = _parse_brl(value_str)
            if amount is None or amount == 0:
                continue
            description = line[:m.start()].strip()
            if not description:
                continue
            # Skip lines like "R$ 1.615,42" or "+ 289,20" alone (which would have empty description)
            push_with_description(description, amount)
        else:
            # No value at end -> description continuation of last transaction OR noise
            # We only attach if a transaction has been pushed for the current date+section
            if transactions and transactions[-1]["transactionDate"] == current_date:
                pending_desc_lines.append(line)
            # Otherwise ignore (header noise)

    flush_pending_desc()

    logger.info(f"PDF: candidate={candidate_count}, final={len(transactions)}")
    if not transactions:
        raise ValueError("Nao foi possivel identificar transacoes neste layout de PDF")
    return {"transactions": transactions, "warnings": warnings}


# ============================================================
# DEDUPLICATOR
# ============================================================
def dedupe_transactions(parsed: List[dict], existing_hashes: set) -> dict:
    """Mark duplicates within this batch and against existing hashes."""
    seen = set()
    for tx in parsed:
        h = tx["hash"]
        if h in existing_hashes or h in seen:
            tx["duplicate"] = True
            tx["duplicate_reason"] = "Ja existe nas suas transacoes" if h in existing_hashes else "Repetida no proprio arquivo"
        else:
            tx["duplicate"] = False
            tx["duplicate_reason"] = ""
            seen.add(h)
    return {
        "transactions": parsed,
        "duplicates_count": sum(1 for t in parsed if t.get("duplicate")),
    }


# ============================================================
# ENTRY POINT
# ============================================================
def parse_file(filename: str, content: bytes) -> dict:
    """
    Dispatch parsing based on filename extension.

    Raises ValueError with a user-friendly message on failure.
    """
    if not filename:
        raise ValueError("Arquivo nao enviado")
    if not content:
        raise ValueError("Arquivo vazio")

    name = filename.strip().lower()
    size = len(content)
    logger.info(f"Import: file={filename}, size={size} bytes")

    if name.endswith(".csv"):
        return parse_csv(content)
    if name.endswith(".ofx") or name.endswith(".qfx"):
        return parse_ofx(content)
    if name.endswith(".pdf"):
        return parse_pdf(content)
    raise ValueError(f"Formato nao suportado. Aceitos: .csv, .ofx, .pdf (recebido: {name.split('.')[-1] if '.' in name else 'sem extensao'})")
