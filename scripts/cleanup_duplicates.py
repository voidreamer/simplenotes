#!/usr/bin/env python3
"""
Cleanup script to remove duplicate members/households for a specific email
"""

import boto3
import sys

# Configuration
REGION = "ca-central-1"
ENV = "staging"  # Change to "dev" if needed

USERS_TABLE = f"simplenotes-{ENV}-users"
HOUSEHOLDS_TABLE = f"simplenotes-{ENV}-households"

dynamodb = boto3.resource("dynamodb", region_name=REGION)


def get_user_by_email(email: str):
    """Get user by email using GSI"""
    table = dynamodb.Table(USERS_TABLE)
    response = table.query(
        IndexName="email-index",
        KeyConditionExpression="email = :email",
        ExpressionAttributeValues={":email": email}
    )
    items = response.get("Items", [])
    return items[0] if items else None


def get_household(household_id: str):
    """Get household by ID"""
    table = dynamodb.Table(HOUSEHOLDS_TABLE)
    response = table.get_item(Key={"household_id": household_id})
    return response.get("Item")


def remove_duplicate_households_from_user(user_id: str, households: list):
    """Remove duplicate household IDs from user's list"""
    unique_households = list(dict.fromkeys(households))  # Preserves order

    if len(unique_households) == len(households):
        print(f"  No duplicate households found for user")
        return households

    print(f"  Found {len(households) - len(unique_households)} duplicate household(s)")
    print(f"  Before: {households}")
    print(f"  After:  {unique_households}")

    table = dynamodb.Table(USERS_TABLE)
    table.update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET households = :h",
        ExpressionAttributeValues={":h": unique_households}
    )
    print(f"  ✓ Updated user's households list")
    return unique_households


def remove_duplicate_members_from_household(household_id: str, members: list):
    """Remove duplicate member IDs from household's list"""
    unique_members = list(dict.fromkeys(members))  # Preserves order

    if len(unique_members) == len(members):
        print(f"  No duplicate members found in household {household_id}")
        return members

    print(f"  Found {len(members) - len(unique_members)} duplicate member(s) in household {household_id}")
    print(f"  Before: {members}")
    print(f"  After:  {unique_members}")

    table = dynamodb.Table(HOUSEHOLDS_TABLE)
    table.update_item(
        Key={"household_id": household_id},
        UpdateExpression="SET members = :m",
        ExpressionAttributeValues={":m": unique_members}
    )
    print(f"  ✓ Updated household's members list")
    return unique_members


def cleanup_user(email: str):
    """Clean up duplicates for a user by email"""
    print(f"\n{'='*60}")
    print(f"Cleaning up duplicates for: {email}")
    print(f"Environment: {ENV}")
    print(f"{'='*60}\n")

    # Get user
    user = get_user_by_email(email)
    if not user:
        print(f"❌ User not found with email: {email}")
        return

    user_id = user["user_id"]
    print(f"Found user: {user.get('name', 'Unknown')} (ID: {user_id})")

    # Clean up user's households list
    households = user.get("households", [])
    print(f"\nUser's households: {len(households)} entries")
    unique_households = remove_duplicate_households_from_user(user_id, households)

    # Clean up each household's members list
    print(f"\nChecking {len(unique_households)} household(s) for duplicate members...")
    for hh_id in unique_households:
        household = get_household(hh_id)
        if household:
            print(f"\nHousehold: {household.get('name', 'Unknown')} ({hh_id})")
            members = household.get("members", [])
            remove_duplicate_members_from_household(hh_id, members)
        else:
            print(f"\n⚠️  Household {hh_id} not found (orphan reference)")

    print(f"\n{'='*60}")
    print("✓ Cleanup complete!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python cleanup_duplicates.py <email>")
        print("Example: python cleanup_duplicates.py alejomax@gmail.com")
        sys.exit(1)

    email = sys.argv[1]
    cleanup_user(email)
