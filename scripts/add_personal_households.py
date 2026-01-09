#!/usr/bin/env python3
"""
Add Personal household for existing users who don't have one.
Run this script to migrate existing users.
"""

import boto3
from botocore.exceptions import ClientError
import uuid
from datetime import datetime
import os

# Set up AWS credentials if needed
# os.environ['AWS_REGION'] = 'ca-central-1'

REGION = os.environ.get('AWS_REGION', 'ca-central-1')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'staging')

USERS_TABLE = f"simplenotes-{ENVIRONMENT}-users"
HOUSEHOLDS_TABLE = f"simplenotes-{ENVIRONMENT}-households"

dynamodb = boto3.resource('dynamodb', region_name=REGION)

def get_all_users():
    """Get all users from the database"""
    table = dynamodb.Table(USERS_TABLE)
    users = []

    response = table.scan()
    users.extend(response.get('Items', []))

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        users.extend(response.get('Items', []))

    return users

def get_household(household_id):
    """Get household by ID"""
    table = dynamodb.Table(HOUSEHOLDS_TABLE)
    try:
        response = table.get_item(Key={"household_id": household_id})
        return response.get("Item")
    except ClientError:
        return None

def create_household(owner_id, name):
    """Create a new household"""
    table = dynamodb.Table(HOUSEHOLDS_TABLE)
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
    return household

def add_household_to_user(user_id, household_id):
    """Add household ID to user's households list"""
    table = dynamodb.Table(USERS_TABLE)
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
    except ClientError as e:
        print(f"Error adding household to user: {e}")
        return False

def user_has_personal_household(user):
    """Check if user already has a Personal household"""
    households = user.get('households', [])
    for hh_id in households:
        household = get_household(hh_id)
        if household and household.get('name') == 'Personal':
            # Check if it's a single-member household owned by this user
            if household.get('owner_id') == user['user_id']:
                return True
    return False

def main():
    print(f"Adding Personal households for users in {ENVIRONMENT} environment...")
    print(f"Using tables: {USERS_TABLE}, {HOUSEHOLDS_TABLE}")
    print()

    users = get_all_users()
    print(f"Found {len(users)} users")

    added_count = 0
    skipped_count = 0

    for user in users:
        user_id = user['user_id']
        email = user.get('email', 'unknown')

        if user_has_personal_household(user):
            print(f"  SKIP: {email} - already has Personal household")
            skipped_count += 1
        else:
            print(f"  ADD: {email} - creating Personal household...")
            household = create_household(user_id, "Personal")
            add_household_to_user(user_id, household['household_id'])
            print(f"       Created household {household['household_id']}")
            added_count += 1

    print()
    print(f"Done! Added {added_count} Personal households, skipped {skipped_count} users.")

if __name__ == "__main__":
    main()
