"""
SimpleNotes - Health Check Tests
"""

import pytest
from unittest.mock import patch, MagicMock
import sys

# Mock boto3 before any imports
mock_boto3 = MagicMock()
sys.modules['boto3'] = mock_boto3

# Now import the app
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
    from fastapi.testclient import TestClient
    from app.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "simplenotes-api"
    assert "version" in data

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "SimpleNotes API"
    assert data["status"] == "healthy"
    assert "version" in data
    assert "docs" in data

def test_docs_endpoint():
    """Test OpenAPI docs are accessible"""
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_json():
    """Test OpenAPI JSON schema is accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "paths" in data
    assert "info" in data
    assert data["info"]["title"] == "SimpleNotes API"
