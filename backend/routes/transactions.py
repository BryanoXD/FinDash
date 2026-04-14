"""
Transaction routes for FinDash
With proper business rules for budget tracking
"""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime
from models import Transaction, TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


async def recalculate_budget_spent(categoria_id: str, user_id: str, db):
    """Recalcula gasto via aggregation pipeline"""
    pipeline = [
        {"$match": {"user_id": user_id, "categoria_id": categoria_id, "tipo": "despesa", "pago": True}},
        {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(1)
    total_gasto = result[0]["total"] if result else 0
    
    await db.budgets.update_one(
        {"user_id": user_id, "categoria_id": categoria_id},
        {"$set": {"gasto": total_gasto}}
    )
    
    return total_gasto


@router.get("", response_model=List[Transaction])
async def get_transactions(
    request: Request,
    tipo: Optional[str] = Query(None, description="Filter by tipo: receita or despesa"),
    categoria_id: Optional[str] = Query(None),
    db=None,
    user_id: str = None
):
    """Get all transactions for current user, optionally filtered"""
    query = {"user_id": user_id}
    if tipo:
        query["tipo"] = tipo
    if categoria_id:
        query["categoria_id"] = categoria_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("data", -1).to_list(1000)
    return transactions


@router.post("", response_model=Transaction)
async def create_transaction(data: TransactionCreate, request: Request, db=None, user_id: str = None):
    """
    Create a new transaction
    REGRA: Se for despesa paga, atualiza o orçamento da categoria
    """
    # Get category name
    category = await db.categories.find_one({"id": data.categoria_id, "user_id": user_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    tx_data = data.model_dump()
    tx_data["categoria"] = category["nome"]
    
    transaction = Transaction(user_id=user_id, **tx_data)
    doc = transaction.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.transactions.insert_one(doc)
    
    # Se for despesa paga, recalcula o orçamento
    if transaction.tipo == "despesa" and transaction.pago:
        await recalculate_budget_spent(data.categoria_id, user_id, db)
    
    return transaction


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, data: TransactionUpdate, request: Request, db=None, user_id: str = None):
    """
    Update a transaction
    REGRA: Recalcula orçamentos afetados (categoria antiga e nova)
    """
    existing = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    old_categoria_id = existing.get("categoria_id")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # If category changed, get new category name
    if "categoria_id" in update_data:
        category = await db.categories.find_one({"id": update_data["categoria_id"], "user_id": user_id}, {"_id": 0})
        if category:
            update_data["categoria"] = category["nome"]
    
    if update_data:
        await db.transactions.update_one(
            {"id": transaction_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    # Recalcula orçamentos afetados
    if updated["tipo"] == "despesa":
        await recalculate_budget_spent(updated["categoria_id"], user_id, db)
        # Se mudou de categoria, recalcula a antiga também
        if old_categoria_id and old_categoria_id != updated["categoria_id"]:
            await recalculate_budget_spent(old_categoria_id, user_id, db)
    
    return updated


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str, request: Request, db=None, user_id: str = None):
    """
    Delete a transaction
    REGRA: Recalcula o orçamento da categoria
    """
    existing = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    categoria_id = existing.get("categoria_id")
    tipo = existing.get("tipo")
    
    result = await db.transactions.delete_one({"id": transaction_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Recalcula orçamento se era despesa
    if tipo == "despesa" and categoria_id:
        await recalculate_budget_spent(categoria_id, user_id, db)
    
    return {"message": "Transaction deleted"}


@router.get("/summary")
async def get_transaction_summary(request: Request, db=None, user_id: str = None):
    """Get summary of transactions (receitas, despesas, saldo)"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$tipo", "total": {"$sum": "$valor"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(10)
    totals = {r["_id"]: r["total"] for r in result}
    receitas = totals.get("receita", 0)
    despesas = totals.get("despesa", 0)
    
    return {
        "receitas": receitas,
        "despesas": despesas,
        "saldo": receitas - despesas
    }


@router.patch("/{transaction_id}/toggle-paid")
async def toggle_transaction_paid(transaction_id: str, request: Request, db=None, user_id: str = None):
    """
    Toggle the paid status of a transaction
    REGRA: Ao mudar status, recalcula o orçamento
    """
    existing = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    new_pago = not existing.get("pago", True)
    
    await db.transactions.update_one(
        {"id": transaction_id, "user_id": user_id},
        {"$set": {"pago": new_pago}}
    )
    
    # Recalcula orçamento se for despesa
    if existing["tipo"] == "despesa":
        await recalculate_budget_spent(existing["categoria_id"], user_id, db)
    
    return {"message": f"Transaction marked as {'paid' if new_pago else 'pending'}", "pago": new_pago}
