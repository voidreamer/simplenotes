"""
SimpleNotes - Supabase Authentication
JWT validation and user info extraction
"""

from jose import jwt, JWTError
from typing import Optional, Dict
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.config import settings

security = HTTPBearer()

def verify_token(token: str) -> Optional[Dict]:
    """Verify Supabase JWT token and return claims"""
    try:
        claims = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
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

    # Extract user info from Supabase claims
    user_metadata = claims.get("user_metadata", {})
    user = {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": user_metadata.get("name", user_metadata.get("full_name", "")),
        "picture": user_metadata.get("avatar_url", user_metadata.get("picture", "")),
        "email_verified": claims.get("email_confirmed_at") is not None
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
