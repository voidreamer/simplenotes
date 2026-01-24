"""
SimpleNotes - Lists Routes
Notes, checklists, and shopping lists management
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Any

from app.utils.auth import get_current_user
from app.utils.database import (
    create_list, get_list, get_lists_by_household,
    update_list, delete_list, add_item_to_list,
    get_household
)

router = APIRouter()

class ListItem(BaseModel):
    """List item model"""
    text: str = Field(..., max_length=500)
    quantity: Optional[int] = Field(1, ge=0, le=10000)
    unit: Optional[str] = Field("", max_length=50)
    category: Optional[str] = Field("", max_length=100)
    note: Optional[str] = Field("", max_length=1000)

class ListCreate(BaseModel):
    """List creation request"""
    household_id: str = Field(..., max_length=100)
    title: str = Field(..., max_length=200)
    type: str = Field("note", pattern="^(note|checklist|shopping)$")
    color: Optional[str] = Field("#6366f1", max_length=20)
    icon: Optional[str] = Field("list", max_length=50)

class ListUpdate(BaseModel):
    """List update request"""
    title: Optional[str] = Field(None, max_length=200)
    items: Optional[List[Any]] = Field(None, max_length=1000)
    content: Optional[str] = Field(None, max_length=50000)  # For note type
    color: Optional[str] = Field(None, max_length=20)
    icon: Optional[str] = Field(None, max_length=50)
    pinned: Optional[bool] = None

class ListResponse(BaseModel):
    """List response model"""
    list_id: str
    household_id: str
    title: str
    type: str
    items: List[Any]
    content: str = ""  # For note type
    created_by: str
    created_at: str
    updated_at: str
    color: str
    icon: str
    pinned: bool

@router.post("/", response_model=ListResponse)
async def create_new_list(data: ListCreate, user: dict = Depends(get_current_user)):
    """Create a new list"""
    # Verify household membership
    household = get_household(data.household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    list_item = create_list(
        household_id=data.household_id,
        user_id=user["user_id"],
        title=data.title,
        list_type=data.type
    )

    # Update with optional fields
    if data.color or data.icon:
        updates = {}
        if data.color:
            updates["color"] = data.color
        if data.icon:
            updates["icon"] = data.icon
        list_item = update_list(list_item["list_id"], data.household_id, updates)

    return ListResponse(**list_item)

@router.get("/household/{household_id}", response_model=List[ListResponse])
async def get_household_lists(household_id: str, user: dict = Depends(get_current_user)):
    """Get all lists for a household"""
    # Verify household membership
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    if user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")

    lists = get_lists_by_household(household_id)

    # Sort: pinned first, then by updated_at
    lists.sort(key=lambda x: (not x.get("pinned", False), x.get("updated_at", "")), reverse=True)

    return [ListResponse(**lst) for lst in lists]

@router.get("/{list_id}", response_model=ListResponse)
async def get_list_details(list_id: str, household_id: str, user: dict = Depends(get_current_user)):
    """Get list details"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    return ListResponse(**list_item)

@router.patch("/{list_id}", response_model=ListResponse)
async def update_list_details(
    list_id: str,
    household_id: str,
    data: ListUpdate,
    user: dict = Depends(get_current_user)
):
    """Update list details"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    updates = {}
    if data.title is not None:
        updates["title"] = data.title
    if data.items is not None:
        updates["items"] = data.items
    if data.content is not None:
        updates["content"] = data.content
    if data.color is not None:
        updates["color"] = data.color
    if data.icon is not None:
        updates["icon"] = data.icon
    if data.pinned is not None:
        updates["pinned"] = data.pinned

    if not updates:
        return ListResponse(**list_item)

    updated = update_list(list_id, household_id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update list")

    return ListResponse(**updated)

@router.delete("/{list_id}")
async def delete_list_route(list_id: str, household_id: str, user: dict = Depends(get_current_user)):
    """Delete a list"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    if not delete_list(list_id, household_id):
        raise HTTPException(status_code=500, detail="Failed to delete list")

    return {"message": "List deleted successfully"}

@router.post("/{list_id}/items", response_model=ListResponse)
async def add_list_item(
    list_id: str,
    household_id: str,
    data: ListItem,
    user: dict = Depends(get_current_user)
):
    """Add item to list"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    item = {
        "text": data.text,
        "quantity": data.quantity,
        "unit": data.unit,
        "category": data.category,
        "note": data.note,
        "added_by": user["user_id"]
    }

    updated = add_item_to_list(list_id, household_id, item)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to add item")

    return ListResponse(**updated)

@router.patch("/{list_id}/items/{item_id}/toggle")
async def toggle_item(
    list_id: str,
    household_id: str,
    item_id: str,
    user: dict = Depends(get_current_user)
):
    """Toggle item checked status"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find and toggle item
    items = list_item.get("items", [])
    for item in items:
        if item.get("id") == item_id:
            item["checked"] = not item.get("checked", False)
            break

    updated = update_list(list_id, household_id, {"items": items})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to toggle item")

    return {"message": "Item toggled", "items": updated.get("items", [])}

class ItemUpdate(BaseModel):
    """Item update request"""
    text: Optional[str] = Field(None, max_length=500)
    quantity: Optional[int] = Field(None, ge=0, le=10000)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    note: Optional[str] = Field(None, max_length=1000)

@router.patch("/{list_id}/items/{item_id}", response_model=ListResponse)
async def update_item(
    list_id: str,
    household_id: str,
    item_id: str,
    data: ItemUpdate,
    user: dict = Depends(get_current_user)
):
    """Update item in list"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find and update item
    items = list_item.get("items", [])
    item_found = False
    for item in items:
        if item.get("id") == item_id:
            item_found = True
            if data.text is not None:
                item["text"] = data.text
            if data.quantity is not None:
                item["quantity"] = data.quantity
            if data.unit is not None:
                item["unit"] = data.unit
            if data.category is not None:
                item["category"] = data.category
            if data.note is not None:
                item["note"] = data.note
            break

    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found")

    updated = update_list(list_id, household_id, {"items": items})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update item")

    return ListResponse(**updated)

@router.delete("/{list_id}/items/{item_id}")
async def delete_item(
    list_id: str,
    household_id: str,
    item_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete item from list"""
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")

    # Verify membership
    household = get_household(household_id)
    if not household or user["user_id"] not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Remove item
    items = [i for i in list_item.get("items", []) if i.get("id") != item_id]

    updated = update_list(list_id, household_id, {"items": items})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to delete item")

    return {"message": "Item deleted"}
