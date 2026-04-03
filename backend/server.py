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
from datetime import datetime, timezone, timedelta
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

class ContentSection(BaseModel):
    heading: str
    points: List[str] = []

class FormulaItem(BaseModel):
    formula: str
    meaning: str

class NoteContent(BaseModel):
    title: str = ""
    introduction: str = ""
    main_content: List[ContentSection] = []
    examples: List[str] = []
    key_points: List[str] = []
    summary: str = ""

class StudyNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    chapter: str
    difficulty: str = "medium"
    note_type: str = "detailed"
    content: NoteContent
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GenerateRequest(BaseModel):
    subject: str
    chapter: str
    difficulty: str = "medium"
    note_type: str = "detailed"

# --- Planner Models ---

class PlannerDay(BaseModel):
    day: int
    topic: str
    tasks: List[str] = []
    duration_hours: float = 0

class StudyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    hours_per_day: float
    num_days: int
    days: List[PlannerDay] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlannerRequest(BaseModel):
    topic: str
    hours_per_day: float
    num_days: int = 7

# --- Practice Test Models ---

class MCQOption(BaseModel):
    label: str
    text: str

class MCQuestion(BaseModel):
    question: str
    options: List[MCQOption] = []
    correct_answer: str
    explanation: str = ""

class PracticeTest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    chapter: str
    num_questions: int
    questions: List[MCQuestion] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PracticeRequest(BaseModel):
    subject: str
    chapter: str
    num_questions: int = 5

# --- Exam Planner Models ---

class ExamPlanDay(BaseModel):
    day: int
    date: str = ""
    topics: List[str] = []
    tasks: List[str] = []
    duration_hours: float = 0
    priority: str = "medium"

class ExamPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    topics: List[str]
    exam_date: str
    hours_per_day: float
    days_until_exam: int
    days: List[ExamPlanDay] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExamPlanRequest(BaseModel):
    subject: str
    topics: List[str]
    exam_date: str
    hours_per_day: float

# --- AI Generation ---

SYSTEM_PROMPT = """You are a study assistant that generates structured study notes. Generate notes in the following JSON format ONLY:
{
  "title": "Topic Name",
  "introduction": "2-3 line introduction to the topic",
  "main_content": [
    {
      "heading": "Section Heading",
      "points": ["Clear bullet point 1", "Clear bullet point 2", "Clear bullet point 3"]
    }
  ],
  "examples": ["Example 1 with explanation", "Example 2 with explanation"],
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "summary": "2-3 line summary of the topic"
}

Rules:
- title: The topic name as a clear heading
- introduction: 2-3 concise sentences introducing the topic
- main_content: 2-5 sections with clear headings and 2-5 bullet points each
- examples: 1-4 practical examples (if applicable to the subject, otherwise empty array [])
- key_points: MANDATORY. Must contain 5-10 short, exam-relevant bullet points highlighting the most important ideas
- summary: 2-3 concise sentences wrapping up the topic
- Keep language simple and readable
- Use clear headings and short bullet points
- No long paragraphs
- Return ONLY valid JSON, no markdown code blocks, no extra text"""

def build_notes_user_prompt(subject: str, chapter: str, difficulty: str, note_type: str) -> str:
    difficulty_guidance = {
        "easy": "Use simple language, basic concepts only, beginner-friendly explanations. Avoid advanced terminology.",
        "medium": "Balanced explanation with some examples. Cover core concepts with moderate depth.",
        "hard": "Include deeper concepts, advanced explanations, edge cases, and nuanced details."
    }
    type_guidance = {
        "quick_revision": "Keep notes short and crisp. Use bullet points only. Minimize explanations. Focus on quick recall.",
        "detailed": "Provide full explanations with examples. Cover the topic comprehensively with clear structure.",
        "exam_focused": "Focus on important concepts likely to appear in exams, key formulas, common question patterns, and frequently tested ideas."
    }

    diff_text = difficulty_guidance.get(difficulty, difficulty_guidance["medium"])
    type_text = type_guidance.get(note_type, type_guidance["detailed"])

    return f"""Generate structured study notes for:
Subject: {subject}
Topic: {chapter}

Difficulty: {difficulty.upper()}
→ {diff_text}

Note Type: {note_type.replace('_', ' ').title()}
→ {type_text}

Remember: key_points section is MANDATORY with at least 5 bullet points."""

async def generate_notes_with_ai(subject: str, chapter: str, difficulty: str = "medium", note_type: str = "detailed") -> NoteContent:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=build_notes_user_prompt(subject, chapter, difficulty, note_type)
    )

    response = await chat.send_message(user_message)
    logger.info(f"AI Response: {response[:200]}...")

    # Parse JSON from response
    try:
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


PLANNER_SYSTEM_PROMPT = """You are a study planner assistant. When given a topic, hours per day, and number of days, create a detailed day-by-day study plan. Return ONLY valid JSON in this format:
{
  "days": [
    {
      "day": 1,
      "topic": "Subtopic or focus area for this day",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "duration_hours": 2.0
    }
  ]
}

Rules:
- Each day should have 2-4 specific tasks
- Tasks should be actionable (Read, Practice, Solve, Review, Summarize)
- duration_hours per day should roughly match the hours_per_day requested
- Progress logically from basics to advanced topics
- Include review/revision days
- Keep language simple and motivating
- Return ONLY valid JSON, no markdown code blocks"""

async def generate_planner_with_ai(topic: str, hours_per_day: float, num_days: int) -> List[PlannerDay]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=PLANNER_SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=f"Create a {num_days}-day study plan for:\nTopic: {topic}\nHours per day: {hours_per_day}"
    )

    response = await chat.send_message(user_message)
    logger.info(f"Planner AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [PlannerDay(**d) for d in parsed["days"]]
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse planner response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


PRACTICE_SYSTEM_PROMPT = """You are a test generator for students. When given a subject, chapter, and number of questions, generate multiple choice questions. Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "What is ...?",
      "options": [
        {"label": "A", "text": "Option text"},
        {"label": "B", "text": "Option text"},
        {"label": "C", "text": "Option text"},
        {"label": "D", "text": "Option text"}
      ],
      "correct_answer": "A",
      "explanation": "Brief explanation why A is correct"
    }
  ]
}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- correct_answer must be one of A, B, C, D
- Include a mix of easy, medium, and hard questions
- Explanations should be brief (1-2 sentences)
- Questions should test understanding, not just memorization
- Include some tricky/puzzle-like questions
- Keep language simple
- Return ONLY valid JSON, no markdown code blocks"""

async def generate_practice_with_ai(subject: str, chapter: str, num_questions: int) -> List[MCQuestion]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=PRACTICE_SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=f"Generate {num_questions} MCQ practice questions for:\nSubject: {subject}\nChapter: {chapter}"
    )

    response = await chat.send_message(user_message)
    logger.info(f"Practice AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [MCQuestion(**q) for q in parsed["questions"]]
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse practice response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


EXAM_PLANNER_SYSTEM_PROMPT = """You are an exam preparation planner. Given a subject, list of topics, number of days until the exam, and study hours per day, create a detailed day-by-day exam preparation schedule.

Return ONLY valid JSON in this format:
{
  "days": [
    {
      "day": 1,
      "topics": ["Topic A - Subtopic"],
      "tasks": ["Read chapter X", "Solve 10 problems on Y", "Make summary notes"],
      "duration_hours": 3.0,
      "priority": "high"
    }
  ]
}

Rules:
- Distribute ALL provided topics across the available days
- Earlier days: focus on learning new topics (priority: "high" or "medium")
- Middle days: practice and problem-solving (priority: "medium")
- Final 20-30% of days: dedicated to revision and mock tests (priority: "high")
- Each day should have 2-5 actionable tasks
- duration_hours per day should match the hours_per_day requested
- priority must be one of: "high", "medium", "low"
- Heavier/harder topics should get more days
- Include at least 1-2 full revision days near the end
- Keep tasks actionable: Read, Practice, Solve, Memorize, Revise, Test
- Return ONLY valid JSON, no markdown code blocks"""

async def generate_exam_plan_with_ai(subject: str, topics: List[str], days_until_exam: int, hours_per_day: float) -> List[ExamPlanDay]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=EXAM_PLANNER_SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    topics_str = "\n".join(f"- {t}" for t in topics)
    user_message = UserMessage(
        text=f"Create an exam preparation schedule:\nSubject: {subject}\nTopics to cover:\n{topics_str}\nDays until exam: {days_until_exam}\nStudy hours per day: {hours_per_day}"
    )

    response = await chat.send_message(user_message)
    logger.info(f"Exam Planner AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [ExamPlanDay(**d) for d in parsed["days"]]
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse exam planner response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Study Notes Generator API"}

@api_router.post("/notes/generate", response_model=StudyNote)
async def generate_notes(req: GenerateRequest):
    valid_difficulties = ["easy", "medium", "hard"]
    valid_note_types = ["quick_revision", "detailed", "exam_focused"]
    difficulty = req.difficulty if req.difficulty in valid_difficulties else "medium"
    note_type = req.note_type if req.note_type in valid_note_types else "detailed"

    content = await generate_notes_with_ai(req.subject, req.chapter, difficulty, note_type)
    note = StudyNote(
        subject=req.subject,
        chapter=req.chapter,
        difficulty=difficulty,
        note_type=note_type,
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

# --- Planner Routes ---

@api_router.post("/planner/generate", response_model=StudyPlan)
async def generate_planner(req: PlannerRequest):
    days = await generate_planner_with_ai(req.topic, req.hours_per_day, req.num_days)
    plan = StudyPlan(
        topic=req.topic,
        hours_per_day=req.hours_per_day,
        num_days=req.num_days,
        days=days
    )
    doc = plan.model_dump()
    await db.study_plans.insert_one(doc)
    return plan

@api_router.get("/planners", response_model=List[StudyPlan])
async def get_all_planners():
    plans = await db.study_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return plans

@api_router.delete("/planners/{plan_id}")
async def delete_planner(plan_id: str):
    result = await db.study_plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deleted"}

# --- Exam Planner Routes ---

@api_router.post("/planner/exam/generate", response_model=ExamPlan)
async def generate_exam_plan(req: ExamPlanRequest):
    try:
        exam_date = datetime.fromisoformat(req.exam_date.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            exam_date = datetime.strptime(req.exam_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid exam date format")

    today = datetime.now(timezone.utc).date()
    days_until_exam = (exam_date - today).days
    if days_until_exam < 1:
        raise HTTPException(status_code=400, detail="Exam date must be in the future")
    if not req.topics or len(req.topics) == 0:
        raise HTTPException(status_code=400, detail="At least one topic is required")

    days = await generate_exam_plan_with_ai(req.subject, req.topics, days_until_exam, req.hours_per_day)

    # Add actual dates to days
    for day in days:
        day_date = today + timedelta(days=day.day)
        day.date = day_date.isoformat()

    plan = ExamPlan(
        subject=req.subject,
        topics=req.topics,
        exam_date=req.exam_date,
        hours_per_day=req.hours_per_day,
        days_until_exam=days_until_exam,
        days=days
    )
    doc = plan.model_dump()
    await db.exam_plans.insert_one(doc)
    return plan

@api_router.get("/exam-planners", response_model=List[ExamPlan])
async def get_all_exam_planners():
    plans = await db.exam_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return plans

@api_router.delete("/exam-planners/{plan_id}")
async def delete_exam_planner(plan_id: str):
    result = await db.exam_plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam plan not found")
    return {"message": "Exam plan deleted"}

# --- Practice Routes ---

@api_router.post("/practice/generate", response_model=PracticeTest)
async def generate_practice(req: PracticeRequest):
    questions = await generate_practice_with_ai(req.subject, req.chapter, req.num_questions)
    test = PracticeTest(
        subject=req.subject,
        chapter=req.chapter,
        num_questions=req.num_questions,
        questions=questions
    )
    doc = test.model_dump()
    await db.practice_tests.insert_one(doc)
    return test

@api_router.get("/practices", response_model=List[PracticeTest])
async def get_all_practices():
    tests = await db.practice_tests.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return tests

@api_router.delete("/practices/{test_id}")
async def delete_practice(test_id: str):
    result = await db.practice_tests.delete_one({"id": test_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"message": "Test deleted"}

# --- History Routes ---

@api_router.get("/history")
async def get_unified_history(item_type: Optional[str] = None):
    items = []

    if item_type is None or item_type == "note":
        notes = await db.study_notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for n in notes:
            items.append({
                "type": "note",
                "id": n["id"],
                "title": n["chapter"],
                "subtitle": n["subject"],
                "created_at": n["created_at"],
                "preview": {
                    "difficulty": n.get("difficulty", "medium"),
                    "note_type": n.get("note_type", "detailed"),
                    "key_points_count": len(n.get("content", {}).get("key_points", [])),
                    "introduction_snippet": (n.get("content", {}).get("introduction", ""))[:120],
                    "sections_count": len(n.get("content", {}).get("main_content", [])),
                },
                "data": n,
            })

    if item_type is None or item_type == "plan":
        plans = await db.study_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for p in plans:
            items.append({
                "type": "plan",
                "id": p["id"],
                "title": p["topic"],
                "subtitle": f"{p['num_days']} days · {p['hours_per_day']}h/day",
                "created_at": p["created_at"],
                "preview": {
                    "total_days": p["num_days"],
                    "hours_per_day": p["hours_per_day"],
                    "first_day_topic": p.get("days", [{}])[0].get("topic", "") if p.get("days") else "",
                },
                "data": p,
            })

    if item_type is None or item_type == "practice":
        tests = await db.practice_tests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for t in tests:
            items.append({
                "type": "practice",
                "id": t["id"],
                "title": t["chapter"],
                "subtitle": t["subject"],
                "created_at": t["created_at"],
                "preview": {
                    "num_questions": t["num_questions"],
                    "first_question": t.get("questions", [{}])[0].get("question", "") if t.get("questions") else "",
                },
                "data": t,
            })

    if item_type is None or item_type == "exam_plan":
        exam_plans = await db.exam_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for ep in exam_plans:
            topics_str = ", ".join(ep.get("topics", [])[:3])
            if len(ep.get("topics", [])) > 3:
                topics_str += f" +{len(ep['topics']) - 3} more"
            items.append({
                "type": "exam_plan",
                "id": ep["id"],
                "title": ep["subject"],
                "subtitle": f"Exam: {ep['exam_date'][:10]} · {ep['days_until_exam']} days · {ep['hours_per_day']}h/day",
                "created_at": ep["created_at"],
                "preview": {
                    "days_until_exam": ep["days_until_exam"],
                    "hours_per_day": ep["hours_per_day"],
                    "topics_count": len(ep.get("topics", [])),
                    "topics_summary": topics_str,
                    "total_days": len(ep.get("days", [])),
                },
                "data": ep,
            })

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items

@api_router.delete("/history/{item_type}/{item_id}")
async def delete_history_item(item_type: str, item_id: str):
    collection_map = {
        "note": "study_notes",
        "plan": "study_plans",
        "practice": "practice_tests",
        "exam_plan": "exam_plans",
    }
    coll_name = collection_map.get(item_type)
    if not coll_name:
        raise HTTPException(status_code=400, detail="Invalid item type")
    result = await db[coll_name].delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted"}

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
