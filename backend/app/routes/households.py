"""
SimpleNotes - Household Routes
Household management and membership
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.utils.auth import get_current_user
from app.utils.database import (
    create_household, get_household, get_user_households,
    update_household, delete_household, add_member_to_household,
    get_user_by_id
)

router = APIRouter()

class HouseholdCreate(BaseModel):
    """Household creation request"""
    name: str = Field(..., min_length=1, max_length=100)

class HouseholdUpdate(BaseModel):
    """Household update request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)

class HouseholdResponse(BaseModel):
    """Household response model"""
    household_id: str
    name: str
    owner_id: str
    members: List[str]
    created_at: str
    updated_at: str

class HouseholdWithMembers(BaseModel):
    """Household with member details"""
    household_id: str
    name: str
    owner_id: str
    members: List[dict]
    created_at: str
    updated_at: str

@router.post("/", response_model=HouseholdResponse)
async def create_new_household(data: HouseholdCreate, user: dict = Depends(get_current_user)):
    """Create a new household"""
    household = create_household(user["user_id"], data.name)
    return HouseholdResponse(**household)

@router.get("/", response_model=List[HouseholdResponse])
async def get_my_households(user: dict = Depends(get_current_user)):
    """Get all households for current user"""
    households = get_user_households(user["user_id"])
    return [HouseholdResponse(**h) for h in households]

@router.get("/{household_id}", response_model=HouseholdWithMembers)
async def get_household_details(household_id: str, user: dict = Depends(get_current_user)):
    """Get household details with member info"""
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Check membership
    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    # Get member details
    members = []
    for member_id in household.get("members", []):
        member = get_user_by_id(member_id)
        if member:
            members.append({
                "user_id": member["user_id"],
                "name": member["name"],
                "email": member["email"],
                "picture": member.get("picture", "")
            })

    return HouseholdWithMembers(
        household_id=household["household_id"],
        name=household["name"],
        owner_id=household["owner_id"],
        members=members,
        created_at=household["created_at"],
        updated_at=household["updated_at"]
    )

@router.patch("/{household_id}", response_model=HouseholdResponse)
async def update_household_details(
    household_id: str,
    data: HouseholdUpdate,
    user: dict = Depends(get_current_user)
):
    """Update household details (owner only)"""
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if household["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can update household")

    updates = {}
    if data.name is not None:
        updates["name"] = data.name

    if not updates:
        return HouseholdResponse(**household)

    updated = update_household(household_id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update household")

    return HouseholdResponse(**updated)

@router.delete("/{household_id}")
async def delete_household_route(household_id: str, user: dict = Depends(get_current_user)):
    """Delete a household (owner only)"""
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if household["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can delete household")

    if not delete_household(household_id):
        raise HTTPException(status_code=500, detail="Failed to delete household")

    return {"message": "Household deleted successfully"}

@router.post("/{household_id}/leave")
async def leave_household(household_id: str, user: dict = Depends(get_current_user)):
    """Leave a household (members only, not owner)"""
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    if household["owner_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Owner cannot leave household. Transfer ownership or delete it.")

    # Remove user from members
    members = [m for m in household["members"] if m != user["user_id"]]
    update_household(household_id, {"members": members})

    # Remove household from user
    db_user = get_user_by_id(user["user_id"])
    if db_user:
        households = [h for h in db_user.get("households", []) if h != household_id]
        from app.utils.database import update_user
        update_user(user["user_id"], {"households": households})

    return {"message": "Left household successfully"}
