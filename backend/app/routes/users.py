"""
SimpleNotes - User Routes
User profile management
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.utils.auth import get_current_user
from app.utils.database import get_user_by_id, update_user

router = APIRouter()

class UserUpdate(BaseModel):
    """User update request"""
    name: Optional[str] = None
    picture: Optional[str] = None

class UserResponse(BaseModel):
    """User response model"""
    user_id: str
    email: str
    name: str
    picture: str
    households: list
    created_at: str
    updated_at: str

@router.get("/profile", response_model=UserResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    db_user = get_user_by_id(user["user_id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**db_user)

@router.patch("/profile", response_model=UserResponse)
async def update_profile(data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update user profile"""
    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.picture is not None:
        updates["picture"] = data.picture

    if not updates:
        db_user = get_user_by_id(user["user_id"])
        return UserResponse(**db_user)

    updated = update_user(user["user_id"], updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return UserResponse(**updated)
