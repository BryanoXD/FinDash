"""
Seed data for new users
Creates initial categories, tags, and sample data
"""
from datetime import datetime, timezone
from models import generate_id


async def seed_user_data(user_id: str, db):
    """
    Create initial data for a new user
    """
    # Check if user already has data
    existing_categories = await db.categories.find_one({"user_id": user_id})
    if existing_categories:
        return  # User already has data

    now = datetime.now(timezone.utc).isoformat()

    # ============== CATEGORIES ==============
    categories = [
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Salário", "cor": "#22c55e", "tipo": "receita", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Freelance", "cor": "#06b6d4", "tipo": "receita", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Investimentos", "cor": "#8b5cf6", "tipo": "receita", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Outros", "cor": "#6366f1", "tipo": "ambos", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Alimentação", "cor": "#f59e0b", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Transporte", "cor": "#3b82f6", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Moradia", "cor": "#ef4444", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Saúde", "cor": "#ec4899", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Educação", "cor": "#14b8a6", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Lazer", "cor": "#f97316", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Compras", "cor": "#a855f7", "tipo": "despesa", "created_at": now},
        {"id": generate_id("cat_"), "user_id": user_id, "nome": "Serviços", "cor": "#64748b", "tipo": "despesa", "created_at": now},
    ]
    await db.categories.insert_many(categories)

    # ============== TAGS ==============
    tags = [
        {"id": generate_id("tag_"), "user_id": user_id, "nome": "Recorrente", "cor": "#6366f1", "created_at": now},
        {"id": generate_id("tag_"), "user_id": user_id, "nome": "Essencial", "cor": "#22c55e", "created_at": now},
        {"id": generate_id("tag_"), "user_id": user_id, "nome": "Supérfluo", "cor": "#f59e0b", "created_at": now},
        {"id": generate_id("tag_"), "user_id": user_id, "nome": "Parcelado", "cor": "#ef4444", "created_at": now},
    ]
    await db.tags.insert_many(tags)

    # Get category IDs for transactions
    cat_salario = categories[0]["id"]
    cat_alimentacao = categories[4]["id"]
    cat_transporte = categories[5]["id"]
    cat_moradia = categories[6]["id"]
    cat_lazer = categories[9]["id"]

    # ============== SAMPLE TRANSACTIONS ==============
    transactions = [
        {
            "id": generate_id("tx_"), "user_id": user_id,
            "descricao": "Salário", "categoria": "Salário", "categoria_id": cat_salario,
            "valor": 8500.00, "tipo": "receita", "data": "2025-02-01",
            "metodo": "Transferência", "tags": [], "recorrente": True, "pago": True,
            "detalhado": False, "itens": [], "created_at": now
        },
        {
            "id": generate_id("tx_"), "user_id": user_id,
            "descricao": "Aluguel", "categoria": "Moradia", "categoria_id": cat_moradia,
            "valor": 2200.00, "tipo": "despesa", "data": "2025-02-05",
            "metodo": "Débito", "tags": [], "recorrente": True, "pago": True,
            "detalhado": False, "itens": [], "created_at": now
        },
        {
            "id": generate_id("tx_"), "user_id": user_id,
            "descricao": "Supermercado", "categoria": "Alimentação", "categoria_id": cat_alimentacao,
            "valor": 850.00, "tipo": "despesa", "data": "2025-02-10",
            "metodo": "Cartão", "tags": [], "recorrente": False, "pago": True,
            "detalhado": True, "itens": [
                {"nome": "Carnes", "valor": 250},
                {"nome": "Frutas", "valor": 80},
                {"nome": "Laticínios", "valor": 120},
                {"nome": "Outros", "valor": 400}
            ], "created_at": now
        },
        {
            "id": generate_id("tx_"), "user_id": user_id,
            "descricao": "Combustível", "categoria": "Transporte", "categoria_id": cat_transporte,
            "valor": 350.00, "tipo": "despesa", "data": "2025-02-08",
            "metodo": "Cartão", "tags": [], "recorrente": False, "pago": True,
            "detalhado": False, "itens": [], "created_at": now
        },
        {
            "id": generate_id("tx_"), "user_id": user_id,
            "descricao": "Cinema", "categoria": "Lazer", "categoria_id": cat_lazer,
            "valor": 120.00, "tipo": "despesa", "data": "2025-02-12",
            "metodo": "Cartão", "tags": [], "recorrente": False, "pago": True,
            "detalhado": False, "itens": [], "created_at": now
        },
    ]
    await db.transactions.insert_many(transactions)

    # ============== BANK ACCOUNTS ==============
    accounts = [
        {
            "id": generate_id("acc_"), "user_id": user_id,
            "nome": "Nubank", "tipo": "Conta Corrente", "saldo": 5420.50,
            "cor": "#8b5cf6", "agencia": "0001", "conta": "1234567-8", "created_at": now
        },
        {
            "id": generate_id("acc_"), "user_id": user_id,
            "nome": "Inter", "tipo": "Conta Corrente", "saldo": 3250.00,
            "cor": "#f97316", "agencia": "0001", "conta": "9876543-2", "created_at": now
        },
    ]
    await db.accounts.insert_many(accounts)

    # ============== CREDIT CARDS ==============
    cards = [
        {
            "id": generate_id("card_"), "user_id": user_id,
            "nome": "Nubank Platinum", "numero": "**** 4532", "bandeira": "Mastercard",
            "limite": 15000.00, "usado": 2340.00, "vencimento": "15",
            "cor": "from-purple-600 to-purple-800", "banco_id": accounts[0]["id"],
            "fatura_atual": 2340.00, "created_at": now
        },
        {
            "id": generate_id("card_"), "user_id": user_id,
            "nome": "Inter Gold", "numero": "**** 8876", "bandeira": "Mastercard",
            "limite": 8000.00, "usado": 1200.00, "vencimento": "10",
            "cor": "from-orange-500 to-orange-700", "banco_id": accounts[1]["id"],
            "fatura_atual": 1200.00, "created_at": now
        },
    ]
    await db.cards.insert_many(cards)

    # ============== CARD INSTALLMENTS ==============
    installments = [
        {
            "id": generate_id("inst_"), "user_id": user_id, "card_id": cards[0]["id"],
            "descricao": "Shopee - Eletrônicos", "valor_parcela": 199.90, "parcela_atual": 2,
            "total_parcelas": 6, "valor_total": 1199.40, "data": "2025-02-15", "pago": False, "created_at": now
        },
        {
            "id": generate_id("inst_"), "user_id": user_id, "card_id": cards[0]["id"],
            "descricao": "Spotify Premium", "valor_parcela": 21.90, "parcela_atual": 1,
            "total_parcelas": 1, "valor_total": 21.90, "data": "2025-02-15", "pago": False, "created_at": now
        },
    ]
    await db.installments.insert_many(installments)

    # ============== INVESTMENTS ==============
    investments = [
        {
            "id": generate_id("inv_"), "user_id": user_id,
            "nome": "Tesouro Selic 2029", "tipo": "Renda Fixa", "valor": 15000.00,
            "rendimento": 13.25, "variacao": 0.8, "banco_id": accounts[0]["id"], "created_at": now
        },
        {
            "id": generate_id("inv_"), "user_id": user_id,
            "nome": "IVVB11", "tipo": "ETF", "valor": 8500.00,
            "rendimento": 0, "variacao": 2.3, "banco_id": accounts[1]["id"], "created_at": now
        },
        {
            "id": generate_id("inv_"), "user_id": user_id,
            "nome": "Bitcoin", "tipo": "Crypto", "valor": 5000.00,
            "rendimento": 0, "variacao": 15.7, "banco_id": accounts[0]["id"], "created_at": now
        },
    ]
    await db.investments.insert_many(investments)

    # ============== BUDGETS ==============
    budgets = [
        {"id": generate_id("budget_"), "user_id": user_id, "categoria_id": cat_alimentacao, "categoria": "Alimentação", "limite": 1200.00, "gasto": 850.00, "created_at": now},
        {"id": generate_id("budget_"), "user_id": user_id, "categoria_id": cat_transporte, "categoria": "Transporte", "limite": 500.00, "gasto": 350.00, "created_at": now},
        {"id": generate_id("budget_"), "user_id": user_id, "categoria_id": cat_moradia, "categoria": "Moradia", "limite": 2500.00, "gasto": 2200.00, "created_at": now},
        {"id": generate_id("budget_"), "user_id": user_id, "categoria_id": cat_lazer, "categoria": "Lazer", "limite": 300.00, "gasto": 120.00, "created_at": now},
    ]
    await db.budgets.insert_many(budgets)

    # ============== FINANCIAL GOALS ==============
    goals = [
        {
            "id": generate_id("goal_"), "user_id": user_id,
            "nome": "Reserva de Emergência", "valor_atual": 12500.00, "valor_meta": 25000.00,
            "prazo": "2025-12-31", "icone": "Shield", "created_at": now
        },
        {
            "id": generate_id("goal_"), "user_id": user_id,
            "nome": "Viagem Europa", "valor_atual": 8000.00, "valor_meta": 20000.00,
            "prazo": "2026-06-30", "icone": "Target", "created_at": now
        },
    ]
    await db.goals.insert_many(goals)

    return True
