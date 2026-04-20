from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime, timezone
from database import db
from models import UserRegisterRequest, UserLoginRequest, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from fastapi import Depends
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(req: UserRegisterRequest):
    # Validate input
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    email = req.email.strip().lower()

    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": req.name.strip() or email.split("@")[0],
        "password_hash": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    logger.info(f"User registered: {email}")

    token = create_access_token(user_id, email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "name": user_doc["name"],
            "created_at": user_doc["created_at"],
        },
    }


@router.post("/login")
async def login(req: UserLoginRequest):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "created_at": user.get("created_at", ""),
        },
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc
