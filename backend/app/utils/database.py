"""
SimpleNotes - DynamoDB Client
Database operations for all tables
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.utils.config import settings

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)

def get_table(table_name: str):
    """Get DynamoDB table reference"""
    return dynamodb.Table(table_name)

# ============================================
# User Operations
# ============================================

def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    table = get_table(settings.USERS_TABLE)
    try:
        response = table.get_item(Key={"user_id": user_id})
        return response.get("Item")
    except ClientError:
        return None

def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email using GSI"""
    table = get_table(settings.USERS_TABLE)
    try:
        response = table.query(
            IndexName="email-index",
            KeyConditionExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        items = response.get("Items", [])
        return items[0] if items else None
    except ClientError:
        return None

def create_user(user_id: str, email: str, name: str, picture: str = "") -> Dict:
    """Create a new user"""
    table = get_table(settings.USERS_TABLE)
    now = datetime.utcnow().isoformat()

    user = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "households": [],
        "created_at": now,
        "updated_at": now
    }

    table.put_item(Item=user)
    return user

def update_user(user_id: str, updates: Dict) -> Optional[Dict]:
    """Update user attributes"""
    table = get_table(settings.USERS_TABLE)
    updates["updated_at"] = datetime.utcnow().isoformat()

    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
    expr_names = {f"#{k}": k for k in updates.keys()}
    expr_values = {f":{k}": v for k, v in updates.items()}

    try:
        response = table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    except ClientError:
        return None

def add_household_to_user(user_id: str, household_id: str) -> bool:
    """Add household ID to user's households list (prevents duplicates)"""
    # First check if user already has this household
    user = get_user_by_id(user_id)
    if user and household_id in user.get("households", []):
        return True  # Already a member, no need to add

    table = get_table(settings.USERS_TABLE)
    try:
        table.update_item(
            Key={"user_id": user_id},
            UpdateExpression="SET households = list_append(if_not_exists(households, :empty), :h), updated_at = :now",
            ExpressionAttributeValues={
                ":h": [household_id],
                ":empty": [],
                ":now": datetime.utcnow().isoformat()
            }
        )
        return True
    except ClientError:
        return False

# ============================================
# Household Operations
# ============================================

def create_household(owner_id: str, name: str) -> Dict:
    """Create a new household"""
    table = get_table(settings.HOUSEHOLDS_TABLE)
    household_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    household = {
        "household_id": household_id,
        "name": name,
        "owner_id": owner_id,
        "members": [owner_id],
        "created_at": now,
        "updated_at": now
    }

    table.put_item(Item=household)
    add_household_to_user(owner_id, household_id)
    return household

def get_household(household_id: str) -> Optional[Dict]:
    """Get household by ID"""
    table = get_table(settings.HOUSEHOLDS_TABLE)
    try:
        response = table.get_item(Key={"household_id": household_id})
        return response.get("Item")
    except ClientError:
        return None

def get_user_households(user_id: str) -> List[Dict]:
    """Get all households for a user"""
    user = get_user_by_id(user_id)
    if not user or not user.get("households"):
        return []

    households = []
    for hh_id in user["households"]:
        hh = get_household(hh_id)
        if hh:
            households.append(hh)
    return households

def add_member_to_household(household_id: str, user_id: str) -> bool:
    """Add a member to household (prevents duplicates)"""
    # First check if user is already a member
    household = get_household(household_id)
    if household and user_id in household.get("members", []):
        return True  # Already a member, no need to add

    table = get_table(settings.HOUSEHOLDS_TABLE)
    try:
        table.update_item(
            Key={"household_id": household_id},
            UpdateExpression="SET members = list_append(if_not_exists(members, :empty), :m), updated_at = :now",
            ExpressionAttributeValues={
                ":m": [user_id],
                ":empty": [],
                ":now": datetime.utcnow().isoformat()
            }
        )
        add_household_to_user(user_id, household_id)
        return True
    except ClientError:
        return False

def update_household(household_id: str, updates: Dict) -> Optional[Dict]:
    """Update household attributes"""
    table = get_table(settings.HOUSEHOLDS_TABLE)
    updates["updated_at"] = datetime.utcnow().isoformat()

    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
    expr_names = {f"#{k}": k for k in updates.keys()}
    expr_values = {f":{k}": v for k, v in updates.items()}

    try:
        response = table.update_item(
            Key={"household_id": household_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    except ClientError:
        return None

def delete_household(household_id: str) -> bool:
    """Delete a household"""
    table = get_table(settings.HOUSEHOLDS_TABLE)
    try:
        table.delete_item(Key={"household_id": household_id})
        return True
    except ClientError:
        return False

# ============================================
# List Operations
# ============================================

def create_list(household_id: str, user_id: str, title: str, list_type: str = "note") -> Dict:
    """Create a new list"""
    table = get_table(settings.LISTS_TABLE)
    list_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    list_item = {
        "list_id": list_id,
        "household_id": household_id,
        "title": title,
        "type": list_type,  # note, checklist, shopping
        "items": [],
        "content": "",  # Rich text content for notes
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
        "color": "#6366f1",  # Default indigo
        "icon": "list",
        "pinned": False
    }

    table.put_item(Item=list_item)
    return list_item

def get_list(list_id: str, household_id: str) -> Optional[Dict]:
    """Get list by ID"""
    table = get_table(settings.LISTS_TABLE)
    try:
        response = table.get_item(Key={"list_id": list_id, "household_id": household_id})
        return response.get("Item")
    except ClientError:
        return None

def get_lists_by_household(household_id: str) -> List[Dict]:
    """Get all lists for a household"""
    table = get_table(settings.LISTS_TABLE)
    try:
        response = table.query(
            IndexName="household-index",
            KeyConditionExpression="household_id = :hid",
            ExpressionAttributeValues={":hid": household_id}
        )
        return response.get("Items", [])
    except ClientError:
        return []

def update_list(list_id: str, household_id: str, updates: Dict) -> Optional[Dict]:
    """Update list attributes"""
    table = get_table(settings.LISTS_TABLE)
    updates["updated_at"] = datetime.utcnow().isoformat()

    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
    expr_names = {f"#{k}": k for k in updates.keys()}
    expr_values = {f":{k}": v for k, v in updates.items()}

    try:
        response = table.update_item(
            Key={"list_id": list_id, "household_id": household_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    except ClientError:
        return None

def delete_list(list_id: str, household_id: str) -> bool:
    """Delete a list"""
    table = get_table(settings.LISTS_TABLE)
    try:
        table.delete_item(Key={"list_id": list_id, "household_id": household_id})
        return True
    except ClientError:
        return False

def add_item_to_list(list_id: str, household_id: str, item: Dict) -> Optional[Dict]:
    """Add an item to a list"""
    table = get_table(settings.LISTS_TABLE)
    item["id"] = str(uuid.uuid4())
    item["created_at"] = datetime.utcnow().isoformat()
    item["checked"] = False

    try:
        response = table.update_item(
            Key={"list_id": list_id, "household_id": household_id},
            UpdateExpression="SET #items = list_append(if_not_exists(#items, :empty), :item), updated_at = :now",
            ExpressionAttributeNames={
                "#items": "items"
            },
            ExpressionAttributeValues={
                ":item": [item],
                ":empty": [],
                ":now": datetime.utcnow().isoformat()
            },
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    except ClientError as e:
        print(f"Error adding item to list: {e}")
        return None

# ============================================
# Invite Operations
# ============================================

def create_invite(household_id: str, email: str, invited_by: str) -> Dict:
    """Create a household invite"""
    table = get_table(settings.INVITES_TABLE)
    invite_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Expires in 7 days
    from datetime import timedelta
    expires_at = int((datetime.utcnow() + timedelta(days=7)).timestamp())

    invite = {
        "invite_id": invite_id,
        "household_id": household_id,
        "email": email,
        "invited_by": invited_by,
        "status": "pending",
        "created_at": now,
        "expires_at": expires_at
    }

    table.put_item(Item=invite)
    return invite

def get_invite(invite_id: str) -> Optional[Dict]:
    """Get invite by ID"""
    table = get_table(settings.INVITES_TABLE)
    try:
        response = table.get_item(Key={"invite_id": invite_id})
        return response.get("Item")
    except ClientError:
        return None

def get_invites_by_email(email: str) -> List[Dict]:
    """Get all pending invites for an email"""
    table = get_table(settings.INVITES_TABLE)
    try:
        response = table.query(
            IndexName="email-index",
            KeyConditionExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        return [i for i in response.get("Items", []) if i.get("status") == "pending"]
    except ClientError:
        return []

def accept_invite(invite_id: str, user_id: str) -> bool:
    """Accept an invite"""
    invite = get_invite(invite_id)
    if not invite or invite.get("status") != "pending":
        return False

    # Add user to household
    add_member_to_household(invite["household_id"], user_id)

    # Update invite status
    table = get_table(settings.INVITES_TABLE)
    try:
        table.update_item(
            Key={"invite_id": invite_id},
            UpdateExpression="SET #s = :status",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": "accepted"}
        )
        return True
    except ClientError:
        return False

def delete_invite(invite_id: str) -> bool:
    """Delete an invite"""
    table = get_table(settings.INVITES_TABLE)
    try:
        table.delete_item(Key={"invite_id": invite_id})
        return True
    except ClientError:
        return False
