from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import os
import logging

# Load env FIRST — before any module that reads env vars
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Import routers AFTER env is loaded
from routes.auth_routes import router as auth_router
from routes.notes import router as notes_router
from routes.planner import router as planner_router
from routes.practice import router as practice_router
from routes.history import router as history_router
from routes.analytics import router as analytics_router
from routes.goals import router as goals_router
from routes.pomodoro import router as pomodoro_router
from routes.bookmarks import router as bookmarks_router
from routes.confidence import router as confidence_router
from database import client

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="StudyForge API", version="2.0.0")
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait before generating more content."},
    )

# --- Public root ---
@app.get("/api")
async def root():
    return {"message": "StudyForge API v2.0"}

# --- Include all routers ---
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(planner_router)
app.include_router(practice_router)
app.include_router(history_router)
app.include_router(analytics_router)
app.include_router(goals_router)
app.include_router(pomodoro_router)
app.include_router(bookmarks_router)
app.include_router(confidence_router)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
