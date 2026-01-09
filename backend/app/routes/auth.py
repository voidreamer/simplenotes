"""
SimpleNotes - Authentication Routes
Handle user registration and token validation
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.utils.auth import get_current_user
from app.utils.database import (
    get_user_by_id, get_user_by_email, create_user,
    get_invites_by_email, accept_invite, create_household
)
from app.utils.email import send_welcome_email

router = APIRouter()

class UserCreate(BaseModel):
    """User creation request"""
    name: str
    picture: Optional[str] = ""

class UserResponse(BaseModel):
    """User response model"""
    user_id: str
    email: str
    name: str
    picture: str
    households: list
    created_at: str

@router.post("/register", response_model=UserResponse)
async def register_user(data: UserCreate, user: dict = Depends(get_current_user)):
    """
    Register a new user or return existing user.
    Called after Cognito authentication to sync user data.
    """
    existing = get_user_by_id(user["user_id"])
    if existing:
        return UserResponse(**existing)

    # Create new user
    new_user = create_user(
        user_id=user["user_id"],
        email=user["email"],
        name=data.name or user.get("name", ""),
        picture=data.picture or user.get("picture", "")
    )

    # Auto-create personal household for new users
    personal_household = create_household(
        owner_id=user["user_id"],
        name="Personal"
    )

    # Refresh user to include the new household
    new_user = get_user_by_id(user["user_id"])

    # Check for pending invites
    invites = get_invites_by_email(user["email"])
    for invite in invites:
        accept_invite(invite["invite_id"], user["user_id"])

    # Send welcome email
    send_welcome_email(user["email"], new_user["name"])

    return UserResponse(**new_user)

@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    db_user = get_user_by_id(user["user_id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    return UserResponse(**db_user)

@router.post("/validate")
async def validate_token(user: dict = Depends(get_current_user)):
    """Validate JWT token and return user info"""
    return {
        "valid": True,
        "user_id": user["user_id"],
        "email": user["email"]
    }
