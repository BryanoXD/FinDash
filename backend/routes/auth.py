"""
Authentication routes for FinDash
Using Emergent Google OAuth
"""
from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import httpx
import uuid
import os
from models import User, UserSession
from seed import seed_user_data

router = APIRouter(prefix="/auth", tags=["auth"])

# Emergent Auth endpoint from env
EMERGENT_AUTH_URL = os.environ['EMERGENT_AUTH_URL']


def get_session_token_from_request(request: Request) -> str | None:
    """Extract session token from cookie or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Fallback to Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    return None


@router.post("/session")
async def create_session(request: Request, response: Response, db=None):
    """
    Exchange session_id from Emergent Auth for a session token
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")
    
    email = user_data.get("email")
    name = user_data.get("name")
    picture = user_data.get("picture")
    session_token = user_data.get("session_token")
    
    if not email or not session_token:
        raise HTTPException(status_code=400, detail="Invalid auth response")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture
        )
        user_doc = user.model_dump()
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        await db.users.insert_one(user_doc)
        
        # Seed initial data for new user
        await seed_user_data(user_id, db)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    session_doc = session.model_dump()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    # Snapshot user's session_version so we can revoke later by bumping it on the user
    user_for_sv = await db.users.find_one({"user_id": user_id}, {"_id": 0, "session_version": 1})
    session_doc["session_version"] = int((user_for_sv or {}).get("session_version", 0) or 0)
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get user data to return
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user_doc,
        "message": "Session created successfully"
    }


@router.get("/me")
async def get_current_user(request: Request, db=None):
    """Get current authenticated user"""
    session_token = get_session_token_from_request(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_doc


@router.post("/logout")
async def logout(request: Request, response: Response, db=None):
    """Logout and clear session"""
    session_token = get_session_token_from_request(request)
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}


async def get_current_user_id(request: Request, db) -> str:
    """Helper to get current user ID from request - raises HTTPException if not authenticated"""
    session_token = get_session_token_from_request(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    # Validate session_version against the user (revocation on password change / admin)
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Sessao invalida: usuario nao encontrado")
    if user_doc.get("ativo", True) is False:
        raise HTTPException(status_code=401, detail="Conta desativada")
    user_sv = int(user_doc.get("session_version", 0) or 0)
    session_sv = int(session_doc.get("session_version", 0) or 0)
    if user_sv != session_sv:
        raise HTTPException(status_code=401, detail="Sua sessao foi encerrada por seguranca. Faca login novamente.")

    return session_doc["user_id"]


@router.get("/session")
async def validate_session(request: Request, db=None):
    """Lightweight session validation endpoint used by the frontend guard."""
    user_id = await get_current_user_id(request, db)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "session_version": 0})
    return {"valid": True, "user_id": user_id, "user": user}
