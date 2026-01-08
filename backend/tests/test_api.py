"""
SimpleNotes - API Tests
Unit tests for API endpoints with mocked dependencies
"""

import pytest
from unittest.mock import patch, MagicMock
import sys

# Mock boto3 before any imports
mock_boto3 = MagicMock()
sys.modules['boto3'] = mock_boto3

# Environment setup
env_vars = {
    'ENVIRONMENT': 'test',
    'AWS_REGION': 'ca-central-1',
    'USERS_TABLE': 'test-users',
    'HOUSEHOLDS_TABLE': 'test-households',
    'LISTS_TABLE': 'test-lists',
    'INVITES_TABLE': 'test-invites',
    'COGNITO_USER_POOL_ID': 'test-pool-id',
    'COGNITO_CLIENT_ID': 'test-client-id',
    'COGNITO_REGION': 'ca-central-1',
}

with patch.dict('os.environ', env_vars):
    from fastapi.testclient import TestClient
    from app.main import app

client = TestClient(app)

# Mock user for auth
mock_current_user = {
    'user_id': 'test-user-id',
    'email': 'test@example.com',
    'name': 'Test User',
    'picture': '',
    'email_verified': True
}

class TestAuthEndpoints:
    """Test authentication endpoints"""

    @patch('app.routes.auth.get_current_user')
    @patch('app.routes.auth.get_user_by_id')
    @patch('app.routes.auth.create_user')
    @patch('app.routes.auth.get_invites_by_email')
    @patch('app.routes.auth.send_welcome_email')
    def test_register_new_user(
        self,
        mock_welcome,
        mock_invites,
        mock_create,
        mock_get_user,
        mock_auth
    ):
        """Test registering a new user"""
        mock_auth.return_value = mock_current_user
        mock_get_user.return_value = None  # User doesn't exist
        mock_invites.return_value = []
        mock_welcome.return_value = True

        new_user = {
            **mock_current_user,
            'households': [],
            'created_at': '2024-01-01T00:00:00'
        }
        mock_create.return_value = new_user

        response = client.post(
            "/api/auth/register",
            json={"name": "Test User"},
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"

    @patch('app.routes.auth.get_current_user')
    @patch('app.routes.auth.get_user_by_id')
    def test_get_current_user(self, mock_get_user, mock_auth):
        """Test getting current user profile"""
        mock_auth.return_value = mock_current_user
        mock_get_user.return_value = {
            **mock_current_user,
            'households': [],
            'created_at': '2024-01-01T00:00:00'
        }

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-id"


class TestHouseholdEndpoints:
    """Test household endpoints"""

    @patch('app.routes.households.get_current_user')
    @patch('app.routes.households.create_household')
    def test_create_household(self, mock_create, mock_auth):
        """Test creating a new household"""
        mock_auth.return_value = mock_current_user
        mock_create.return_value = {
            'household_id': 'new-household-id',
            'name': 'My Household',
            'owner_id': 'test-user-id',
            'members': ['test-user-id'],
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }

        response = client.post(
            "/api/households/",
            json={"name": "My Household"},
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "My Household"
        assert data["owner_id"] == "test-user-id"

    @patch('app.routes.households.get_current_user')
    @patch('app.routes.households.get_user_households')
    def test_get_households(self, mock_get, mock_auth):
        """Test getting user's households"""
        mock_auth.return_value = mock_current_user
        mock_get.return_value = [
            {
                'household_id': 'household-1',
                'name': 'Home',
                'owner_id': 'test-user-id',
                'members': ['test-user-id'],
                'created_at': '2024-01-01T00:00:00',
                'updated_at': '2024-01-01T00:00:00'
            }
        ]

        response = client.get(
            "/api/households/",
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Home"


class TestListEndpoints:
    """Test list endpoints"""

    @patch('app.routes.lists.get_current_user')
    @patch('app.routes.lists.get_household')
    @patch('app.routes.lists.create_list')
    @patch('app.routes.lists.update_list')
    def test_create_list(self, mock_update, mock_create, mock_household, mock_auth):
        """Test creating a new list"""
        mock_auth.return_value = mock_current_user
        mock_household.return_value = {
            'household_id': 'test-household-id',
            'members': ['test-user-id']
        }

        new_list = {
            'list_id': 'new-list-id',
            'household_id': 'test-household-id',
            'title': 'Groceries',
            'type': 'shopping',
            'items': [],
            'created_by': 'test-user-id',
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00',
            'color': '#6366f1',
            'icon': 'shopping-cart',
            'pinned': False
        }
        mock_create.return_value = new_list
        mock_update.return_value = new_list

        response = client.post(
            "/api/lists/",
            json={
                "household_id": "test-household-id",
                "title": "Groceries",
                "type": "shopping"
            },
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Groceries"
        assert data["type"] == "shopping"

    @patch('app.routes.lists.get_current_user')
    @patch('app.routes.lists.get_household')
    @patch('app.routes.lists.get_lists_by_household')
    def test_get_household_lists(self, mock_lists, mock_household, mock_auth):
        """Test getting lists for a household"""
        mock_auth.return_value = mock_current_user
        mock_household.return_value = {
            'household_id': 'test-household-id',
            'members': ['test-user-id']
        }
        mock_lists.return_value = [
            {
                'list_id': 'list-1',
                'household_id': 'test-household-id',
                'title': 'Shopping',
                'type': 'shopping',
                'items': [{'id': 'item-1', 'text': 'Milk', 'checked': False}],
                'created_by': 'test-user-id',
                'created_at': '2024-01-01T00:00:00',
                'updated_at': '2024-01-01T00:00:00',
                'color': '#6366f1',
                'icon': 'shopping-cart',
                'pinned': True
            }
        ]

        response = client.get(
            "/api/lists/household/test-household-id",
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Shopping"
        assert len(data[0]["items"]) == 1


class TestInviteEndpoints:
    """Test invite endpoints"""

    def test_get_invite_details_not_found(self):
        """Test getting invite that doesn't exist"""
        with patch('app.routes.invites.get_invite') as mock_get:
            mock_get.return_value = None

            response = client.get("/api/invites/nonexistent-id")

            assert response.status_code == 404

    @patch('app.routes.invites.get_invite')
    @patch('app.routes.invites.get_household')
    @patch('app.routes.invites.get_user_by_id')
    def test_get_invite_details(self, mock_user, mock_household, mock_invite):
        """Test getting valid invite details"""
        mock_invite.return_value = {
            'invite_id': 'test-invite-id',
            'household_id': 'test-household-id',
            'email': 'invited@example.com',
            'invited_by': 'test-user-id',
            'status': 'pending',
            'created_at': '2024-01-01T00:00:00',
            'expires_at': 9999999999
        }
        mock_household.return_value = {'name': 'Test Household'}
        mock_user.return_value = {'name': 'Inviter Name'}

        response = client.get("/api/invites/test-invite-id")

        assert response.status_code == 200
        data = response.json()
        assert data["household_name"] == "Test Household"
        assert data["inviter_name"] == "Inviter Name"
