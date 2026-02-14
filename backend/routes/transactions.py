"""
Transaction routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from models import Transaction, TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


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
    """Create a new transaction"""
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
    
    # Update budget spent if it's a despesa
    if transaction.tipo == "despesa" and transaction.pago:
        await db.budgets.update_one(
            {"user_id": user_id, "categoria_id": data.categoria_id},
            {"$inc": {"gasto": transaction.valor}}
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, data: TransactionUpdate, request: Request, db=None, user_id: str = None):
    """Update a transaction"""
    existing = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
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
    return updated


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str, request: Request, db=None, user_id: str = None):
    """Delete a transaction"""
    result = await db.transactions.delete_one({"id": transaction_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}


@router.get("/summary")
async def get_transaction_summary(request: Request, db=None, user_id: str = None):
    """Get summary of transactions (receitas, despesas, saldo)"""
    # Get all transactions
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    
    receitas = sum(t["valor"] for t in transactions if t["tipo"] == "receita")
    despesas = sum(t["valor"] for t in transactions if t["tipo"] == "despesa")
    
    return {
        "receitas": receitas,
        "despesas": despesas,
        "saldo": receitas - despesas
    }
