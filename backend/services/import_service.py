"""
Import Service - Parsers, normalização, categorização e deduplicação
Módulos: csv_parser, ofx_parser, pdf_parser, normalizer, categorizer, deduplicator
"""
import csv
import io
import re
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

# ============================================================
# CATEGORIZATION ENGINE - Palavras-chave por categoria
# ============================================================

CATEGORY_RULES = {
    "Alimentacao": [
        "mercado", "supermercado", "atacadao", "padaria", "restaurante", "lanchonete",
        "ifood", "rappi", "uber eats", "pizzaria", "acougue", "hortifruti", "assai",
        "carrefour", "extra", "pao de acucar", "big", "sams club", "cafe", "bar",
    ],
    "Transporte": [
        "uber", "99", "cabify", "combustivel", "gasolina", "etanol", "posto", "shell",
        "ipiranga", "br distribuidora", "pedagio", "estacionamento", "onibus", "metro",
        "bilhete unico", "sem parar", "conectcar", "veloe", "oficina", "mecanico",
    ],
    "Moradia": [
        "aluguel", "condominio", "energia", "eletrica", "cpfl", "enel", "cemig", "celpe",
        "agua", "sabesp", "sanepar", "gas", "comgas", "iptu", "seguro residencial",
    ],
    "Saude": [
        "farmacia", "drogaria", "droga raia", "drogasil", "pague menos", "hospital",
        "clinica", "medico", "dentista", "laboratorio", "plano de saude", "unimed",
        "amil", "sulamerica", "hapvida", "consulta", "exame",
    ],
    "Lazer": [
        "cinema", "teatro", "show", "ingresso", "parque", "viagem", "hotel", "airbnb",
        "booking", "decolar", "latam", "gol", "azul", "123milhas", "hurb",
    ],
    "Educacao": [
        "escola", "faculdade", "universidade", "curso", "udemy", "alura", "rocketseat",
        "livro", "livraria", "amazon kindle", "mensalidade escolar", "material escolar",
    ],
    "Assinaturas": [
        "netflix", "spotify", "prime", "disney", "hbo", "globoplay", "deezer",
        "apple", "google storage", "icloud", "xbox", "playstation", "steam",
        "youtube premium", "amazon prime", "paramount",
    ],
    "Salario": [
        "salario", "folha", "pagamento", "pro labore", "bonus", "13o", "decimo terceiro",
        "ferias", "participacao nos lucros", "plr", "hora extra", "comissao",
    ],
    "Investimentos": [
        "aplicacao", "resgate", "cdb", "lci", "lca", "tesouro", "fundo", "acao",
        "dividendo", "rendimento", "juros", "poupanca", "nuinvest", "xp", "clear",
        "rico", "btg", "inter invest",
    ],
    "Transferencias": [
        "transferencia", "pix", "ted", "doc", "deposito", "saque", "resgate",
    ],
}

# Confiança mínima para categorização automática
CONFIDENCE_HIGH = 0.85
CONFIDENCE_MEDIUM = 0.5


def categorize_transaction(description: str, amount: float) -> dict:
    """
    Categoriza uma transação com base em palavras-chave.
    Retorna: { category, subcategory, confidence, is_recurring, tags }
    """
    desc_lower = description.lower().strip()
    best_cat = "Outros"
    best_score = 0.0
    matched_keywords = []

    for category, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw in desc_lower:
                # Pontuação baseada no tamanho da keyword (mais específica = melhor)
                score = len(kw) / max(len(desc_lower), 1)
                score = min(score * 3, 1.0)  # Normalizar para 0-1
                if score > best_score:
                    best_score = score
                    best_cat = category
                    matched_keywords = [kw]

    # Determinar se é recorrente (padrões típicos)
    recurring_patterns = [
        "assinatura", "mensalidade", "plano", "netflix", "spotify", "internet",
        "aluguel", "condominio", "seguro", "energia", "agua", "gas",
    ]
    is_recurring = any(p in desc_lower for p in recurring_patterns)

    # Determinar tipo (receita/despesa) pelo valor
    direction = "despesa" if amount < 0 or amount > 0 else "unknown"
    if any(kw in desc_lower for kw in CATEGORY_RULES.get("Salario", [])):
        direction = "receita"

    # Tags automáticas
    tags = []
    if is_recurring:
        tags.append("recorrente")
    if best_score < CONFIDENCE_MEDIUM:
        tags.append("revisar")

    return {
        "category": best_cat,
        "subcategory": None,
        "confidence": round(best_score, 2),
        "is_recurring": is_recurring,
        "direction": direction,
        "tags": tags,
        "matched_keywords": matched_keywords,
    }


# ============================================================
# CSV PARSER
# ============================================================

def parse_csv(content: bytes, filename: str) -> List[dict]:
    """Parse CSV com detecção automática de separador e encoding."""
    # Tentar encodings
    text = None
    for enc in ["utf-8", "latin-1", "cp1252", "iso-8859-1"]:
        try:
            text = content.decode(enc)
            break
        except (UnicodeDecodeError, ValueError):
            continue
    if text is None:
        raise ValueError("Nao foi possivel decodificar o arquivo CSV")

    # Detectar separador
    first_lines = text.split("\n")[:3]
    sample = "\n".join(first_lines)
    sep = ","
    for s in [";", "\t", "|"]:
        if sample.count(s) > sample.count(sep):
            sep = s

    reader = csv.reader(io.StringIO(text), delimiter=sep)
    rows = list(reader)
    if len(rows) < 2:
        raise ValueError("CSV vazio ou com apenas cabecalho")

    # Detectar cabeçalho
    header = [h.strip().lower() for h in rows[0]]

    # Mapeamento flexível de colunas
    col_map = {}
    date_keys = ["data", "date", "dt", "data transacao", "data_transacao", "dtmov", "data mov"]
    desc_keys = ["descricao", "description", "historico", "memo", "desc", "lancamento", "nome"]
    val_keys = ["valor", "value", "amount", "vlr", "quantia"]
    type_keys = ["tipo", "type", "natureza", "dc", "d/c"]
    balance_keys = ["saldo", "balance", "saldo final"]

    for i, h in enumerate(header):
        for key_group, field_name in [(date_keys, "date"), (desc_keys, "description"),
                                       (val_keys, "amount"), (type_keys, "type"),
                                       (balance_keys, "balance")]:
            if h in key_group or any(k in h for k in key_group):
                col_map[field_name] = i
                break

    # Fallback: se não achou, usar posições
    if "date" not in col_map and len(header) >= 1:
        col_map["date"] = 0
    if "description" not in col_map and len(header) >= 2:
        col_map["description"] = 1
    if "amount" not in col_map and len(header) >= 3:
        col_map["amount"] = 2

    transactions = []
    for row_idx, row in enumerate(rows[1:], start=2):
        if not row or all(c.strip() == "" for c in row):
            continue
        try:
            date_str = row[col_map.get("date", 0)].strip() if col_map.get("date") is not None else ""
            desc = row[col_map.get("description", 1)].strip() if col_map.get("description") is not None else ""
            val_str = row[col_map.get("amount", 2)].strip() if col_map.get("amount") is not None else "0"

            # Normalizar valor
            amount = parse_amount(val_str)
            # Normalizar data
            parsed_date = parse_date(date_str)

            if not desc and amount == 0:
                continue

            balance = None
            if "balance" in col_map and col_map["balance"] < len(row):
                try:
                    balance = parse_amount(row[col_map["balance"]].strip())
                except Exception:
                    pass

            transactions.append({
                "date": parsed_date,
                "description": desc,
                "amount": amount,
                "balance": balance,
                "raw_data": {h: row[i] if i < len(row) else "" for i, h in enumerate(header)},
                "row_number": row_idx,
            })
        except Exception:
            continue

    return transactions


# ============================================================
# OFX PARSER
# ============================================================

def parse_ofx(content: bytes, filename: str) -> List[dict]:
    """Parse arquivo OFX."""
    try:
        from ofxparse import OfxParser as OFX
    except ImportError:
        raise ValueError("Biblioteca ofxparse nao instalada")

    try:
        ofx = OFX.parse(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Erro ao interpretar arquivo OFX: {str(e)}")

    transactions = []
    account_name = ""
    institution = ""

    if hasattr(ofx, "account"):
        acct = ofx.account
        account_name = getattr(acct, "account_id", "")
        if hasattr(acct, "institution") and acct.institution:
            institution = getattr(acct.institution, "organization", "")

        for tx in getattr(acct, "statement", {}).transactions if hasattr(acct, "statement") else []:
            date_val = ""
            if hasattr(tx, "date") and tx.date:
                date_val = tx.date.strftime("%Y-%m-%d")

            desc = getattr(tx, "memo", "") or getattr(tx, "payee", "") or getattr(tx, "name", "") or ""
            amount = float(getattr(tx, "amount", 0) or 0)
            tx_id = getattr(tx, "id", "")
            tx_type = getattr(tx, "type", "")

            transactions.append({
                "date": date_val,
                "description": desc.strip(),
                "amount": amount,
                "balance": None,
                "transaction_id": tx_id,
                "transaction_type": tx_type,
                "account_name": account_name,
                "institution": institution,
                "raw_data": {"id": tx_id, "type": tx_type, "memo": desc, "amount": str(amount)},
            })

    return transactions


# ============================================================
# PDF PARSER
# ============================================================

def parse_pdf(content: bytes, filename: str) -> List[dict]:
    """Parse PDF extraindo texto estruturado."""
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        raise ValueError("Biblioteca PyPDF2 nao instalada")

    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Erro ao ler PDF: {str(e)}")

    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + "\n"

    if not all_text.strip():
        raise ValueError("PDF nao contem texto extraivel. OCR nao suportado nesta versao.")

    # Estratégia tolerante: buscar linhas com padrão data + descrição + valor
    lines = all_text.split("\n")
    transactions = []

    # Padrões de data comuns em extratos brasileiros
    date_patterns = [
        r"(\d{2}/\d{2}/\d{4})",
        r"(\d{2}/\d{2}/\d{2})",
        r"(\d{2}-\d{2}-\d{4})",
        r"(\d{4}-\d{2}-\d{2})",
    ]
    # Padrão de valor monetário
    money_pattern = r"[-]?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})"

    for line_num, line in enumerate(lines):
        line = line.strip()
        if len(line) < 10:
            continue

        # Buscar data na linha
        found_date = None
        for dp in date_patterns:
            m = re.search(dp, line)
            if m:
                found_date = m.group(1)
                break

        if not found_date:
            continue

        # Buscar valor(es) na linha
        money_matches = re.findall(money_pattern, line)
        if not money_matches:
            continue

        # O último valor encontrado geralmente é o mais relevante
        val_str = money_matches[-1]
        amount = parse_amount(val_str)

        # Extrair descrição (tudo entre data e valor)
        desc_start = line.index(found_date) + len(found_date)
        desc_end = line.rindex(val_str)
        description = line[desc_start:desc_end].strip()
        description = re.sub(r"[^\w\s/-]", "", description).strip()

        if not description:
            description = f"Transacao PDF linha {line_num + 1}"

        # Detectar sinal negativo
        is_negative = "-" in line[:line.index(val_str) + len(val_str) + 2] if val_str in line else False
        if is_negative and amount > 0:
            amount = -amount

        parsed_date = parse_date(found_date)

        transactions.append({
            "date": parsed_date,
            "description": description,
            "amount": amount,
            "balance": None,
            "raw_data": {"line": line, "line_number": line_num + 1},
        })

    return transactions


# ============================================================
# HELPERS
# ============================================================

def parse_amount(val_str: str) -> float:
    """Converte string de valor para float. Trata formatos BR e US."""
    val_str = val_str.strip()
    val_str = re.sub(r"R\$\s*", "", val_str)
    val_str = val_str.replace(" ", "")

    # Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
    if "," in val_str and "." in val_str:
        if val_str.rindex(",") > val_str.rindex("."):
            # Formato BR: 1.234,56
            val_str = val_str.replace(".", "").replace(",", ".")
        else:
            # Formato US: 1,234.56
            val_str = val_str.replace(",", "")
    elif "," in val_str:
        val_str = val_str.replace(",", ".")

    try:
        return float(val_str)
    except ValueError:
        return 0.0


def parse_date(date_str: str) -> str:
    """Converte vários formatos de data para YYYY-MM-DD."""
    date_str = date_str.strip()
    formats = [
        "%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y",
        "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str


def generate_hash(date: str, description: str, amount: float) -> str:
    """Gera hash para deduplicação."""
    key = f"{date}|{description.lower().strip()}|{amount:.2f}"
    return hashlib.md5(key.encode()).hexdigest()


# ============================================================
# NORMALIZER
# ============================================================

def normalize_transactions(raw_txs: List[dict], source_type: str, batch_id: str) -> List[dict]:
    """Normaliza transações brutas para o formato interno."""
    normalized = []
    for tx in raw_txs:
        amount = tx.get("amount", 0)
        description = tx.get("description", "").strip()
        date = tx.get("date", "")

        # Categorizar
        cat_result = categorize_transaction(description, amount)

        # Determinar direção
        if amount < 0:
            direction = "despesa"
            amount = abs(amount)
        elif amount > 0:
            if cat_result["direction"] == "receita":
                direction = "receita"
            else:
                direction = "despesa"
        else:
            direction = "unknown"

        # Hash para deduplicação
        tx_hash = generate_hash(date, description, amount)

        normalized.append({
            "id": f"imp_{uuid.uuid4().hex[:12]}",
            "source_type": source_type,
            "import_batch_id": batch_id,
            "date": date,
            "description": description,
            "original_description": tx.get("description", ""),
            "amount": amount,
            "direction": direction,
            "balance": tx.get("balance"),
            "account_name": tx.get("account_name", ""),
            "institution": tx.get("institution", ""),
            "category": cat_result["category"],
            "subcategory": cat_result["subcategory"],
            "confidence": cat_result["confidence"],
            "is_recurring": cat_result["is_recurring"],
            "tags": cat_result["tags"],
            "hash": tx_hash,
            "raw_data": tx.get("raw_data", {}),
            "status": "pending",  # pending, duplicate, imported, skipped
        })

    return normalized


# ============================================================
# DEDUPLICATOR
# ============================================================

async def check_duplicates(normalized_txs: List[dict], user_id: str, db) -> List[dict]:
    """Marca transações que já existem no banco."""
    existing = await db.transactions.find(
        {"user_id": user_id},
        {"_id": 0, "data": 1, "descricao": 1, "valor": 1}
    ).to_list(50000)

    existing_hashes = set()
    for tx in existing:
        h = generate_hash(
            tx.get("data", ""),
            tx.get("descricao", ""),
            tx.get("valor", 0)
        )
        existing_hashes.add(h)

    # Verificar duplicatas internas do lote
    batch_hashes = set()
    for tx in normalized_txs:
        if tx["hash"] in existing_hashes:
            tx["status"] = "duplicate"
            tx["duplicate_reason"] = "Ja existe no sistema"
        elif tx["hash"] in batch_hashes:
            tx["status"] = "duplicate"
            tx["duplicate_reason"] = "Duplicado no lote"
        batch_hashes.add(tx["hash"])

    return normalized_txs
