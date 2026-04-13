"""
Financial Goal routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate, GoalContributionCreate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=List[FinancialGoal])
async def get_goals(request: Request, db=None, user_id: str = None):
    """Get all financial goals for current user"""
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return goals


@router.post("", response_model=FinancialGoal)
async def create_goal(data: FinancialGoalCreate, request: Request, db=None, user_id: str = None):
    """Create a new financial goal"""
    goal = FinancialGoal(user_id=user_id, **data.model_dump())
    doc = goal.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.goals.insert_one(doc)
    return goal


@router.put("/{goal_id}", response_model=FinancialGoal)
async def update_goal(goal_id: str, data: FinancialGoalUpdate, request: Request, db=None, user_id: str = None):
    """Update a financial goal"""
    existing = await db.goals.find_one({"id": goal_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.goals.update_one({"id": goal_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.goals.find_one({"id": goal_id}, {"_id": 0})
    return updated


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, request: Request, db=None, user_id: str = None):
    """Delete a financial goal"""
    result = await db.goals.delete_one({"id": goal_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}


@router.post("/{goal_id}/contribute")
async def contribute_to_goal(goal_id: str, data: GoalContributionCreate, request: Request, db=None, user_id: str = None):
    """Add a contribution (aporte) or withdrawal (saque) to a goal"""
    goal = await db.goals.find_one({"id": goal_id, "user_id": user_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    new_valor = goal["valor_atual"] + data.valor
    if new_valor < 0:
        new_valor = 0
    
    await db.goals.update_one(
        {"id": goal_id, "user_id": user_id},
        {"$set": {"valor_atual": new_valor}}
    )
    
    return {"message": "Contribution added", "valor_atual": new_valor}
