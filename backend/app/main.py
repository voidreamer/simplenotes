"""
SimpleNotes - FastAPI Backend
Main application entry point with Mangum adapter for AWS Lambda
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routes import auth, users, households, lists, invites, health, keys
from app.utils.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"SimpleNotes API starting in {settings.ENVIRONMENT} mode")
    yield
    # Shutdown
    print("SimpleNotes API shutting down")

# Create FastAPI app
app = FastAPI(
    title="SimpleNotes API",
    description="Shareable notes, checklists, and shopping lists for households",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "dev" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "dev" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT == "dev" else None
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if set
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(households.router, prefix="/api/households", tags=["Households"])
app.include_router(lists.router, prefix="/api/lists", tags=["Lists"])
app.include_router(invites.router, prefix="/api/invites", tags=["Invites"])
app.include_router(keys.router, prefix="/api/keys", tags=["Encryption"])

# Mangum handler for AWS Lambda
handler = Mangum(app, lifespan="off")

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "SimpleNotes API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs"
    }
