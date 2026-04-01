from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Models ---

class FormulaItem(BaseModel):
    formula: str
    meaning: str

class NoteContent(BaseModel):
    key_concepts: List[str] = []
    formulas: List[FormulaItem] = []
    explanation: str = ""
    quick_revision: List[str] = []

class StudyNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    chapter: str
    content: NoteContent
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GenerateRequest(BaseModel):
    subject: str
    chapter: str

# --- AI Generation ---

SYSTEM_PROMPT = """You are a study assistant that generates structured study notes. When given a subject and chapter, generate notes in the following JSON format ONLY:
{
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "formulas": [{"formula": "formula_text", "meaning": "short meaning"}],
  "explanation": "Simple and easy-to-understand explanation in max 150 words",
  "quick_revision": ["point1", "point2", "point3", "point4", "point5"]
}

Rules:
- key_concepts: 5-7 clear bullet points
- formulas: Include formulas with short meaning. If not applicable for the subject, return empty array []
- explanation: Simple, easy-to-understand, max 150 words
- quick_revision: Exactly 5 one-line revision points
- Keep language simple
- Avoid long paragraphs
- Be concise and structured
- Do not add unnecessary information
- Return ONLY valid JSON, no markdown code blocks, no extra text"""

async def generate_notes_with_ai(subject: str, chapter: str) -> NoteContent:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=f"Generate structured study notes for:\nSubject: {subject}\nChapter: {chapter}"
    )

    response = await chat.send_message(user_message)
    logger.info(f"AI Response: {response[:200]}...")

    # Parse JSON from response
    try:
        # Clean response - remove markdown code blocks if present
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return NoteContent(**parsed)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Raw response: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Study Notes Generator API"}

@api_router.post("/notes/generate", response_model=StudyNote)
async def generate_notes(req: GenerateRequest):
    content = await generate_notes_with_ai(req.subject, req.chapter)
    note = StudyNote(
        subject=req.subject,
        chapter=req.chapter,
        content=content
    )
    doc = note.model_dump()
    await db.study_notes.insert_one(doc)
    return note

@api_router.get("/notes", response_model=List[StudyNote])
async def get_all_notes():
    notes = await db.study_notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notes

@api_router.get("/notes/{note_id}", response_model=StudyNote)
async def get_note(note_id: str):
    note = await db.study_notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    result = await db.study_notes.delete_one({"id": note_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# Include router and middleware
app.include_router(api_router)

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
