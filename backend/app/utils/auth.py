"""
SimpleNotes - Cognito Authentication
JWT validation and user info extraction
"""

import httpx
from jose import jwt, JWTError
from jose.utils import base64url_decode
from functools import lru_cache
from typing import Optional, Dict
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.config import settings

security = HTTPBearer()

@lru_cache(maxsize=1)
def get_cognito_keys():
    """Fetch and cache Cognito public keys"""
    url = f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    try:
        response = httpx.get(url, timeout=10)
        response.raise_for_status()
        return response.json()["keys"]
    except Exception as e:
        print(f"Failed to fetch Cognito keys: {e}")
        return []

def get_public_key(token: str):
    """Get the public key that matches the token's kid"""
    try:
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")
    except JWTError:
        return None

    keys = get_cognito_keys()
    for key in keys:
        if key.get("kid") == kid:
            return key
    return None

def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return claims"""
    key = get_public_key(token)
    if not key:
        return None

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID,
            issuer=f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"
        )
        return claims
    except JWTError as e:
        print(f"Token verification failed: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """Dependency to get current authenticated user from JWT"""
    token = credentials.credentials

    claims = verify_token(token)
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Extract user info from claims
    user = {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name", claims.get("cognito:username", "")),
        "picture": claims.get("picture", ""),
        "email_verified": claims.get("email_verified", False)
    }

    return user

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[Dict]:
    """Dependency to optionally get current user (doesn't fail if no auth)"""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
