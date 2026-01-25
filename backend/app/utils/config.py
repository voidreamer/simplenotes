"""
SimpleNotes - Configuration Settings
Environment variables and app configuration
"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Environment
    ENVIRONMENT: str = "dev"

    # AWS
    AWS_REGION: str = "ca-central-1"

    # DynamoDB Tables
    USERS_TABLE: str = "simplenotes-dev-users"
    HOUSEHOLDS_TABLE: str = "simplenotes-dev-households"
    LISTS_TABLE: str = "simplenotes-dev-lists"
    INVITES_TABLE: str = "simplenotes-dev-invites"

    # S3
    ATTACHMENTS_BUCKET: str = ""

    # Supabase Auth
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Email
    SES_EMAIL: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

settings = get_settings()
