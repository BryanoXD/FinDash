"""
Budget routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import Budget, BudgetCreate, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=List[Budget])
async def get_budgets(request: Request, db=None, user_id: str = None):
    """Get all budgets for current user"""
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return budgets


@router.post("", response_model=Budget)
async def create_budget(data: BudgetCreate, request: Request, db=None, user_id: str = None):
    """Create a new budget"""
    # Get category name
    category = await db.categories.find_one({"id": data.categoria_id, "user_id": user_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    # Check if budget already exists for this category
    existing = await db.budgets.find_one({"categoria_id": data.categoria_id, "user_id": user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this category")
    
    budget_data = data.model_dump()
    budget_data["categoria"] = category["nome"]
    
    budget = Budget(user_id=user_id, **budget_data)
    doc = budget.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.budgets.insert_one(doc)
    return budget


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, data: BudgetUpdate, request: Request, db=None, user_id: str = None):
    """Update a budget"""
    existing = await db.budgets.find_one({"id": budget_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # If category changed, get new category name
    if "categoria_id" in update_data:
        category = await db.categories.find_one({"id": update_data["categoria_id"], "user_id": user_id}, {"_id": 0})
        if category:
            update_data["categoria"] = category["nome"]
    
    if update_data:
        await db.budgets.update_one({"id": budget_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    return updated


@router.delete("/{budget_id}")
async def delete_budget(budget_id: str, request: Request, db=None, user_id: str = None):
    """Delete a budget"""
    result = await db.budgets.delete_one({"id": budget_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}


@router.get("/summary")
async def get_budget_summary(request: Request, db=None, user_id: str = None):
    """Get budget summary"""
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    total_limite = sum(b["limite"] for b in budgets)
    total_gasto = sum(b["gasto"] for b in budgets)
    
    return {
        "total_limite": total_limite,
        "total_gasto": total_gasto,
        "percentual": (total_gasto / total_limite * 100) if total_limite > 0 else 0
    }
