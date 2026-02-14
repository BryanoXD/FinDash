"""
Tag routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import Tag, TagCreate, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=List[Tag])
async def get_tags(request: Request, db=None, user_id: str = None):
    """Get all tags for current user"""
    tags = await db.tags.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return tags


@router.post("", response_model=Tag)
async def create_tag(data: TagCreate, request: Request, db=None, user_id: str = None):
    """Create a new tag"""
    tag = Tag(user_id=user_id, **data.model_dump())
    doc = tag.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tags.insert_one(doc)
    return tag


@router.put("/{tag_id}", response_model=Tag)
async def update_tag(tag_id: str, data: TagUpdate, request: Request, db=None, user_id: str = None):
    """Update a tag"""
    existing = await db.tags.find_one({"id": tag_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.tags.update_one({"id": tag_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.tags.find_one({"id": tag_id}, {"_id": 0})
    return updated


@router.delete("/{tag_id}")
async def delete_tag(tag_id: str, request: Request, db=None, user_id: str = None):
    """Delete a tag"""
    result = await db.tags.delete_one({"id": tag_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted"}
