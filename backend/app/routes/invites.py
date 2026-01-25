"""
SimpleNotes - Invite Routes
Household invitation management with email notifications
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import List

from app.utils.auth import get_current_user
from app.utils.database import (
    create_invite, get_invite, get_invites_by_email,
    accept_invite, delete_invite, get_household, get_user_by_id
)
from app.utils.email import send_invite_email
from app.utils.config import settings

router = APIRouter()

class InviteCreate(BaseModel):
    """Invite creation request"""
    household_id: str = Field(..., max_length=100)
    email: EmailStr

class InviteResponse(BaseModel):
    """Invite response model"""
    invite_id: str
    household_id: str
    email: str
    invited_by: str
    status: str
    created_at: str
    expires_at: int

class InviteWithDetails(BaseModel):
    """Invite with household details"""
    invite_id: str
    household_id: str
    household_name: str
    email: str
    inviter_name: str
    status: str
    created_at: str

@router.post("/", response_model=InviteResponse)
async def create_new_invite(data: InviteCreate, user: dict = Depends(get_current_user)):
    """Create and send a household invite"""
    # Verify household ownership/membership
    household = get_household(data.household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    # Check if user is already a member
    from app.utils.database import get_user_by_email
    existing_user = get_user_by_email(data.email)
    if existing_user and existing_user["user_id"] in household.get("members", []):
        raise HTTPException(status_code=400, detail="User is already a member of this household")

    # Check if there's already a pending invite for this email and household
    existing_invites = get_invites_by_email(data.email)
    for inv in existing_invites:
        if inv["household_id"] == data.household_id and inv.get("status") == "pending":
            raise HTTPException(status_code=400, detail="An invite has already been sent to this email")

    # Create invite
    invite = create_invite(data.household_id, data.email, user["user_id"])

    # Get inviter name
    inviter = get_user_by_id(user["user_id"])
    inviter_name = inviter.get("name", user["email"]) if inviter else user["email"]

    # Send invite email
    invite_link = f"{settings.FRONTEND_URL}/invite/{invite['invite_id']}"
    send_invite_email(
        to_email=data.email,
        inviter_name=inviter_name,
        household_name=household["name"],
        invite_link=invite_link
    )

    return InviteResponse(**invite)

@router.get("/pending", response_model=List[InviteWithDetails])
async def get_pending_invites(user: dict = Depends(get_current_user)):
    """Get all pending invites for current user"""
    invites = get_invites_by_email(user["email"])

    result = []
    for invite in invites:
        household = get_household(invite["household_id"])
        inviter = get_user_by_id(invite["invited_by"])

        if household:
            result.append(InviteWithDetails(
                invite_id=invite["invite_id"],
                household_id=invite["household_id"],
                household_name=household["name"],
                email=invite["email"],
                inviter_name=inviter.get("name", "") if inviter else "Unknown",
                status=invite["status"],
                created_at=invite["created_at"]
            ))

    return result

@router.get("/{invite_id}")
async def get_invite_details(invite_id: str):
    """Get invite details (public endpoint for invite page)"""
    invite = get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")

    if invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invite has already been used")

    household = get_household(invite["household_id"])
    inviter = get_user_by_id(invite["invited_by"])

    return {
        "invite_id": invite["invite_id"],
        "household_name": household["name"] if household else "Unknown",
        "inviter_name": inviter.get("name", "Someone") if inviter else "Someone",
        "status": invite["status"]
    }

@router.post("/{invite_id}/accept")
async def accept_invite_route(invite_id: str, user: dict = Depends(get_current_user)):
    """Accept a household invite"""
    invite = get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")

    if invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invite has already been used")

    # Verify email matches
    if invite["email"].lower() != user["email"].lower():
        raise HTTPException(status_code=403, detail="This invite was sent to a different email address")

    if not accept_invite(invite_id, user["user_id"]):
        raise HTTPException(status_code=500, detail="Failed to accept invite")

    household = get_household(invite["household_id"])

    return {
        "message": "Invite accepted successfully",
        "household_id": invite["household_id"],
        "household_name": household["name"] if household else "Unknown"
    }

@router.post("/{invite_id}/decline")
async def decline_invite(invite_id: str, user: dict = Depends(get_current_user)):
    """Decline a household invite"""
    invite = get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite["email"].lower() != user["email"].lower():
        raise HTTPException(status_code=403, detail="Not authorized")

    if not delete_invite(invite_id):
        raise HTTPException(status_code=500, detail="Failed to decline invite")

    return {"message": "Invite declined"}

@router.delete("/{invite_id}")
async def cancel_invite(invite_id: str, user: dict = Depends(get_current_user)):
    """Cancel an invite (inviter only)"""
    invite = get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite["invited_by"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the inviter can cancel this invite")

    if not delete_invite(invite_id):
        raise HTTPException(status_code=500, detail="Failed to cancel invite")

    return {"message": "Invite cancelled"}
