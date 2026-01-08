"""
SimpleNotes - Test Configuration
Pytest fixtures and mocks for testing
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Mock boto3 before importing the app
with patch.dict('os.environ', {
    'ENVIRONMENT': 'test',
    'AWS_REGION': 'ca-central-1',
    'USERS_TABLE': 'test-users',
    'HOUSEHOLDS_TABLE': 'test-households',
    'LISTS_TABLE': 'test-lists',
    'INVITES_TABLE': 'test-invites',
    'COGNITO_USER_POOL_ID': 'test-pool-id',
    'COGNITO_CLIENT_ID': 'test-client-id',
    'COGNITO_REGION': 'ca-central-1',
}):
    pass

@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB operations"""
    with patch('app.utils.database.dynamodb') as mock:
        yield mock

@pytest.fixture
def mock_auth():
    """Mock authentication"""
    with patch('app.utils.auth.verify_token') as mock:
        mock.return_value = {
            'sub': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'email_verified': True
        }
        yield mock

@pytest.fixture
def mock_user():
    """Mock user data"""
    return {
        'user_id': 'test-user-id',
        'email': 'test@example.com',
        'name': 'Test User',
        'picture': '',
        'households': [],
        'created_at': '2024-01-01T00:00:00',
        'updated_at': '2024-01-01T00:00:00'
    }

@pytest.fixture
def mock_household():
    """Mock household data"""
    return {
        'household_id': 'test-household-id',
        'name': 'Test Household',
        'owner_id': 'test-user-id',
        'members': ['test-user-id'],
        'created_at': '2024-01-01T00:00:00',
        'updated_at': '2024-01-01T00:00:00'
    }

@pytest.fixture
def mock_list():
    """Mock list data"""
    return {
        'list_id': 'test-list-id',
        'household_id': 'test-household-id',
        'title': 'Test Shopping List',
        'type': 'shopping',
        'items': [],
        'created_by': 'test-user-id',
        'created_at': '2024-01-01T00:00:00',
        'updated_at': '2024-01-01T00:00:00',
        'color': '#6366f1',
        'icon': 'shopping-cart',
        'pinned': False
    }

@pytest.fixture
def auth_header():
    """Authorization header for authenticated requests"""
    return {'Authorization': 'Bearer test-token'}
