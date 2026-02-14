"""
Category routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import Category, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[Category])
async def get_categories(request: Request, db=None, user_id: str = None):
    """Get all categories for current user"""
    categories = await db.categories.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    return categories


@router.post("", response_model=Category)
async def create_category(data: CategoryCreate, request: Request, db=None, user_id: str = None):
    """Create a new category"""
    category = Category(user_id=user_id, **data.model_dump())
    doc = category.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.categories.insert_one(doc)
    return category


@router.put("/{category_id}", response_model=Category)
async def update_category(category_id: str, data: CategoryUpdate, request: Request, db=None, user_id: str = None):
    """Update a category"""
    existing = await db.categories.find_one({"id": category_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.categories.update_one(
            {"id": category_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return updated


@router.delete("/{category_id}")
async def delete_category(category_id: str, request: Request, db=None, user_id: str = None):
    """Delete a category"""
    result = await db.categories.delete_one({"id": category_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}
