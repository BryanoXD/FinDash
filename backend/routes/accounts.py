"""
Bank Account routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import BankAccount, BankAccountCreate, BankAccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[BankAccount])
async def get_accounts(request: Request, db=None, user_id: str = None):
    """Get all bank accounts for current user"""
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return accounts


@router.post("", response_model=BankAccount)
async def create_account(data: BankAccountCreate, request: Request, db=None, user_id: str = None):
    """Create a new bank account"""
    account = BankAccount(user_id=user_id, **data.model_dump())
    doc = account.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.accounts.insert_one(doc)
    return account


@router.put("/{account_id}", response_model=BankAccount)
async def update_account(account_id: str, data: BankAccountUpdate, request: Request, db=None, user_id: str = None):
    """Update a bank account"""
    existing = await db.accounts.find_one({"id": account_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.accounts.update_one({"id": account_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    return updated


@router.delete("/{account_id}")
async def delete_account(account_id: str, request: Request, db=None, user_id: str = None):
    """Delete a bank account"""
    result = await db.accounts.delete_one({"id": account_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}
