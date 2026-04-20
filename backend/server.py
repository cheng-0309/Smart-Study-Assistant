from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
from database import client

app = FastAPI(title="StudyForge API", version="2.0.0")

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
