"""
Investment routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import (
    Investment, InvestmentCreate, InvestmentUpdate,
    InvestmentContribution, InvestmentContributionCreate
)

router = APIRouter(prefix="/investments", tags=["investments"])


@router.get("", response_model=List[Investment])
async def get_investments(request: Request, db=None, user_id: str = None):
    """Get all investments for current user"""
    investments = await db.investments.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Batch: buscar todos os bancos de uma vez
    banco_ids = [i["banco_id"] for i in investments if i.get("banco_id")]
    account_map = {}
    if banco_ids:
        accounts = await db.accounts.find({"id": {"$in": banco_ids}}, {"_id": 0}).to_list(1000)
        account_map = {a["id"]: a for a in accounts}
    
    for inv in investments:
        inv["banco_nome"] = account_map.get(inv.get("banco_id"), {}).get("nome") if inv.get("banco_id") else None
    
    return investments


@router.post("", response_model=Investment)
async def create_investment(data: InvestmentCreate, request: Request, db=None, user_id: str = None):
    """Create a new investment"""
    investment = Investment(user_id=user_id, **data.model_dump())
    doc = investment.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.investments.insert_one(doc)
    return investment


@router.put("/{investment_id}", response_model=Investment)
async def update_investment(investment_id: str, data: InvestmentUpdate, request: Request, db=None, user_id: str = None):
    """Update an investment"""
    existing = await db.investments.find_one({"id": investment_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.investments.update_one({"id": investment_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    return updated


@router.delete("/{investment_id}")
async def delete_investment(investment_id: str, request: Request, db=None, user_id: str = None):
    """Delete an investment"""
    result = await db.investments.delete_one({"id": investment_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Investment not found")
    # Also delete related contributions
    await db.contributions.delete_many({"investimento_id": investment_id, "user_id": user_id})
    return {"message": "Investment deleted"}


@router.get("/total")
async def get_total_invested(request: Request, db=None, user_id: str = None):
    """Get total invested amount"""
    investments = await db.investments.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total = sum(inv["valor"] for inv in investments)
    return {"total": total}


# ============== CONTRIBUTIONS ==============
@router.get("/{investment_id}/contributions", response_model=List[InvestmentContribution])
async def get_contributions(investment_id: str, request: Request, db=None, user_id: str = None):
    """Get all contributions for an investment"""
    contributions = await db.contributions.find(
        {"investimento_id": investment_id, "user_id": user_id},
        {"_id": 0}
    ).sort("data", -1).to_list(1000)
    return contributions


@router.post("/contributions", response_model=InvestmentContribution)
async def create_contribution(data: InvestmentContributionCreate, request: Request, db=None, user_id: str = None):
    """Create a new contribution (aporte or resgate)"""
    # Verify investment exists
    investment = await db.investments.find_one({"id": data.investimento_id, "user_id": user_id}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=400, detail="Investment not found")
    
    contribution = InvestmentContribution(user_id=user_id, **data.model_dump())
    doc = contribution.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contributions.insert_one(doc)
    
    # Update investment value
    delta = data.valor if data.tipo == "aporte" else -data.valor
    await db.investments.update_one(
        {"id": data.investimento_id, "user_id": user_id},
        {"$inc": {"valor": delta}}
    )
    
    return contribution


@router.get("/contributions/all", response_model=List[InvestmentContribution])
async def get_all_contributions(request: Request, db=None, user_id: str = None):
    """Get all contributions for current user"""
    contributions = await db.contributions.find({"user_id": user_id}, {"_id": 0}).sort("data", -1).to_list(1000)
    return contributions
