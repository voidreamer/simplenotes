"""
SimpleNotes - Encryption Key Routes
Handle user key storage and household key management for E2E encryption
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

from app.utils.auth import get_current_user
from app.utils.database import (
    get_user_by_id, update_user, get_household,
    get_user_keys, update_user_keys,
    get_household_wrapped_keys, update_household_wrapped_keys
)

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class UserKeySetup(BaseModel):
    """Request to set up user encryption keys"""
    public_key: str           # Base64-encoded SPKI public key
    encrypted_private_key: str  # Base64-encoded encrypted private key (JSON)
    salt: str                 # Base64-encoded salt for key derivation
    version: int = 1


class UserKeyResponse(BaseModel):
    """Response containing user's encryption keys"""
    public_key: str
    encrypted_private_key: str
    salt: str
    version: int
    has_keys: bool = True


class UserKeyStatus(BaseModel):
    """Status of user's encryption setup"""
    has_encryption_setup: bool
    public_key: Optional[str] = None


class HouseholdKeyUpdate(BaseModel):
    """Request to update household wrapped keys"""
    wrapped_keys: Dict[str, str]  # user_id -> Base64 wrapped key


class HouseholdKeyResponse(BaseModel):
    """Response containing household key for current user"""
    household_id: str
    wrapped_key: Optional[str] = None
    has_key: bool = False


class MemberKeyWrap(BaseModel):
    """Request to add wrapped key for a new member"""
    user_id: str
    wrapped_key: str


# ============================================
# User Key Endpoints
# ============================================

@router.post("/user", response_model=UserKeyResponse)
async def setup_user_keys(data: UserKeySetup, user: dict = Depends(get_current_user)):
    """
    Set up encryption keys for a user.
    Called during initial encryption setup.
    Stores the public key and encrypted private key.
    """
    db_user = get_user_by_id(user["user_id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has keys
    existing_keys = get_user_keys(user["user_id"])
    if existing_keys and existing_keys.get("public_key"):
        raise HTTPException(
            status_code=400,
            detail="Encryption already set up. Use recovery to reset."
        )

    # Store keys
    key_data = {
        "public_key": data.public_key,
        "encrypted_private_key": data.encrypted_private_key,
        "private_key_salt": data.salt,
        "encryption_version": data.version
    }

    success = update_user_keys(user["user_id"], key_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to store encryption keys")

    return UserKeyResponse(
        public_key=data.public_key,
        encrypted_private_key=data.encrypted_private_key,
        salt=data.salt,
        version=data.version,
        has_keys=True
    )


@router.get("/user", response_model=UserKeyResponse)
async def get_user_encryption_keys(user: dict = Depends(get_current_user)):
    """
    Get user's encryption keys.
    Returns the encrypted private key that needs to be decrypted client-side.
    """
    keys = get_user_keys(user["user_id"])

    if not keys or not keys.get("public_key"):
        raise HTTPException(status_code=404, detail="Encryption not set up")

    return UserKeyResponse(
        public_key=keys["public_key"],
        encrypted_private_key=keys["encrypted_private_key"],
        salt=keys["private_key_salt"],
        version=keys.get("encryption_version", 1),
        has_keys=True
    )


@router.get("/user/status", response_model=UserKeyStatus)
async def get_user_key_status(user: dict = Depends(get_current_user)):
    """
    Check if user has encryption set up.
    Used to determine if we need to show setup UI.
    """
    keys = get_user_keys(user["user_id"])
    has_setup = bool(keys and keys.get("public_key"))

    return UserKeyStatus(
        has_encryption_setup=has_setup,
        public_key=keys.get("public_key") if has_setup else None
    )


@router.get("/user/{user_id}/public", response_model=dict)
async def get_user_public_key(user_id: str, user: dict = Depends(get_current_user)):
    """
    Get another user's public key.
    Used when sharing household keys with new members.
    """
    target_user = get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    keys = get_user_keys(user_id)
    if not keys or not keys.get("public_key"):
        raise HTTPException(
            status_code=404,
            detail="User has not set up encryption"
        )

    return {
        "user_id": user_id,
        "public_key": keys["public_key"]
    }


# ============================================
# Household Key Endpoints
# ============================================

@router.get("/household/{household_id}", response_model=HouseholdKeyResponse)
async def get_household_key(household_id: str, user: dict = Depends(get_current_user)):
    """
    Get the wrapped household key for the current user.
    The key is wrapped with the user's public key and must be
    unwrapped client-side with their private key.
    """
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Check membership
    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    # Get wrapped keys
    wrapped_keys = get_household_wrapped_keys(household_id)
    user_wrapped_key = wrapped_keys.get(user["user_id"]) if wrapped_keys else None

    return HouseholdKeyResponse(
        household_id=household_id,
        wrapped_key=user_wrapped_key,
        has_key=bool(user_wrapped_key)
    )


@router.post("/household/{household_id}", response_model=dict)
async def set_household_keys(
    household_id: str,
    data: HouseholdKeyUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Set or update wrapped household keys.
    Used when creating a new household or adding members.
    Only the household owner can update keys.
    """
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Only owner can set keys
    if household["owner_id"] != user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the household owner can manage encryption keys"
        )

    # Validate that all user_ids are members
    members = household.get("members", [])
    for uid in data.wrapped_keys.keys():
        if uid not in members:
            raise HTTPException(
                status_code=400,
                detail=f"User {uid} is not a member of this household"
            )

    success = update_household_wrapped_keys(household_id, data.wrapped_keys)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update household keys")

    return {"message": "Household keys updated successfully"}


@router.post("/household/{household_id}/member", response_model=dict)
async def add_member_key(
    household_id: str,
    data: MemberKeyWrap,
    user: dict = Depends(get_current_user)
):
    """
    Add a wrapped key for a new household member.
    Called after a user accepts an invite.
    Only the household owner (or existing member with key) can add keys.
    """
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Check if caller is a member with access
    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    # Check if target user is a member
    if data.user_id not in household.get("members", []):
        raise HTTPException(
            status_code=400,
            detail="Target user is not a member of this household"
        )

    # Get existing wrapped keys
    existing_keys = get_household_wrapped_keys(household_id) or {}

    # Verify caller has a key (can share)
    if user["user_id"] not in existing_keys:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this household's encryption key"
        )

    # Add new member's key
    existing_keys[data.user_id] = data.wrapped_key
    success = update_household_wrapped_keys(household_id, existing_keys)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to add member key")

    return {"message": "Member key added successfully"}


@router.delete("/household/{household_id}/member/{member_id}")
async def remove_member_key(
    household_id: str,
    member_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Remove a member's wrapped key (when they leave the household).
    Only the household owner can remove keys.
    """
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Only owner can remove keys
    if household["owner_id"] != user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the household owner can remove encryption keys"
        )

    # Get and update wrapped keys
    existing_keys = get_household_wrapped_keys(household_id) or {}

    if member_id in existing_keys:
        del existing_keys[member_id]
        success = update_household_wrapped_keys(household_id, existing_keys)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to remove member key")

    return {"message": "Member key removed successfully"}
