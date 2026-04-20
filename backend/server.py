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
    note_type: str = "detailed"
    content: NoteContent
    tags: List[str] = []
    share_id: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NoteUpdateRequest(BaseModel):
    subject: Optional[str] = None
    chapter: Optional[str] = None
    note_type: Optional[str] = None
    content: Optional[NoteContent] = None
    tags: Optional[List[str]] = None

class GenerateRequest(BaseModel):
    subject: str
    chapter: str
    note_type: str = "detailed"

# --- Planner Models ---

class PlannerDay(BaseModel):
    day: int
    topic: str
    tasks: List[str] = []
    duration_hours: float = 0
    goal: str = ""

class StudyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    hours_per_day: float
    num_days: int
    days: List[PlannerDay] = []
    plain_text: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlannerRequest(BaseModel):
    topic: str
    hours_per_day: float
    num_days: int = 7

# --- Practice Test Models ---

class MCQOption(BaseModel):
    label: str
    text: str

class BaseQuestion(BaseModel):
    id: str = ""
    question_type: str = "mcq"
    topic: str = ""
    difficulty: str = "medium"
    marks: int = 1
    question: str
    explanation: str = ""
    options: List[MCQOption] = []
    correct_answer: str = ""
    model_answer: str = ""
    key_points: List[str] = []

class PracticeTest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    chapter: str
    num_questions: int
    question_type: str = "mixed"
    questions: List[BaseQuestion] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuizScoreRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_id: str
    subject: str
    chapter: str
    total_gradable: int
    correct: int
    total_subjective: int
    attempted_subjective: int
    score_pct: float = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuizScoreRequest(BaseModel):
    test_id: str
    subject: str
    chapter: str
    total_gradable: int
    correct: int
    total_subjective: int = 0
    attempted_subjective: int = 0

class PracticeRequest(BaseModel):
    subject: str
    chapter: str
    num_questions: int = 5
    question_type: str = "mixed"
    difficulty: str = "mixed"

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
- main_content: 2-5 sections with clear headings and 2-5 bullet points each. IMPORTANT: The entire main_content section must NOT exceed 1800 words total.
- examples: 1-4 practical examples (if applicable to the subject, otherwise empty array [])
- key_points: MANDATORY. Must contain 5-10 short, exam-relevant bullet points highlighting the most important ideas
- summary: 2-3 concise sentences wrapping up the topic
- Keep language simple and readable
- Use clear headings and short bullet points
- No long paragraphs
- Return ONLY valid JSON, no markdown code blocks, no extra text"""

def build_notes_user_prompt(subject: str, chapter: str, note_type: str) -> str:
    type_guidance = {
        "quick_revision": "Keep notes short and concise. Use bullet points. Minimal explanation. Focus on fast understanding and quick recall.",
        "detailed": "Provide full explanations with examples. Cover the topic comprehensively with clear structure, concepts, and examples.",
        "exam_focused": "Focus on important concepts likely to appear in exams, key formulas, common question patterns, likely questions, and flashcard-style points."
    }

    type_text = type_guidance.get(note_type, type_guidance["detailed"])

    return f"""Generate structured study notes for:
Subject: {subject}
Topic: {chapter}

Note Type: {note_type.replace('_', ' ').title()}
→ {type_text}

Remember: key_points section is MANDATORY with at least 5 bullet points."""

async def generate_notes_with_ai(subject: str, chapter: str, note_type: str = "detailed") -> NoteContent:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=build_notes_user_prompt(subject, chapter, note_type)
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
        content = NoteContent(**parsed)

        # Enforce 1800 word limit on main_content
        total_words = 0
        trimmed_sections = []
        for section in content.main_content:
            section_words = sum(len(p.split()) for p in section.points)
            section_words += len(section.heading.split())
            if total_words + section_words > 1800:
                remaining = 1800 - total_words
                if remaining > 20:
                    trimmed_points = []
                    for p in section.points:
                        pw = len(p.split())
                        if total_words + pw <= 1800:
                            trimmed_points.append(p)
                            total_words += pw
                        else:
                            break
                    if trimmed_points:
                        section.points = trimmed_points
                        trimmed_sections.append(section)
                break
            total_words += section_words
            trimmed_sections.append(section)
        content.main_content = trimmed_sections

        return content
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
      "duration_hours": 2.0,
      "goal": "Clear one-line goal for the day"
    }
  ]
}

Rules:
- Each day must have a clear goal (one sentence describing the day's objective)
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


def format_plan_plain_text(days: List[PlannerDay]) -> str:
    lines = []
    for day in days:
        lines.append(f"=== Day {day.day} ===")
        lines.append(f"Topic: {day.topic}")
        lines.append(f"Time: {day.duration_hours} hrs")
        lines.append("")
        lines.append("Tasks:")
        for task in day.tasks:
            lines.append(f"* {task}")
        lines.append("")
        lines.append(f"Goal: {day.goal}")
        lines.append("")
    return "\n".join(lines).strip()


PRACTICE_SYSTEM_PROMPT = """You are a test generator for students. Generate questions of the specified types. Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "id": "q1",
      "question_type": "mcq",
      "topic": "Specific sub-topic being tested",
      "difficulty": "easy",
      "marks": 1,
      "question": "What is ...?",
      "options": [
        {"label": "A", "text": "Option text"},
        {"label": "B", "text": "Option text"},
        {"label": "C", "text": "Option text"},
        {"label": "D", "text": "Option text"}
      ],
      "correct_answer": "A",
      "explanation": "Brief explanation",
      "key_points": ["Important concept 1", "Important concept 2"]
    },
    {
      "id": "q2",
      "question_type": "true_false",
      "topic": "Specific sub-topic being tested",
      "difficulty": "medium",
      "marks": 1,
      "question": "Statement to evaluate as true or false",
      "options": [],
      "correct_answer": "True",
      "explanation": "Brief explanation",
      "key_points": ["Key concept 1", "Key concept 2"]
    },
    {
      "id": "q3",
      "question_type": "numerical",
      "topic": "Specific sub-topic being tested",
      "difficulty": "hard",
      "marks": 1,
      "question": "Calculate the value of ...",
      "options": [],
      "correct_answer": "42",
      "explanation": "Step-by-step solution",
      "key_points": ["Formula used", "Key step"]
    },
    {
      "id": "q4",
      "question_type": "short_answer",
      "topic": "Specific sub-topic being tested",
      "difficulty": "medium",
      "marks": 2,
      "question": "Briefly explain ...",
      "options": [],
      "correct_answer": "",
      "model_answer": "A concise 2-3 sentence answer",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "id": "q5",
      "question_type": "long_answer",
      "topic": "Specific sub-topic being tested",
      "difficulty": "hard",
      "marks": 4,
      "question": "Discuss in detail ...",
      "options": [],
      "correct_answer": "",
      "model_answer": "A detailed model answer covering all aspects",
      "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
    }
  ]
}

Rules:
- Each question MUST have a unique "id" (q1, q2, q3...)
- Each question MUST have a "topic" field with the specific sub-topic being tested
- Each question MUST have a "difficulty" field: "easy", "medium", or "hard" (vary across questions)
- Each question MUST have a "marks" field: 1 for mcq/true_false/numerical, 2 for short_answer, 4 for long_answer
- Each question MUST have a non-empty "key_points" array with at least 2 items
- question_type must be one of: mcq, true_false, numerical, short_answer, long_answer
- MCQ: exactly 4 options (A,B,C,D), correct_answer is A/B/C/D
- True/False: correct_answer is "True" or "False", options array empty
- Numerical: correct_answer is the numeric answer as string, options array empty
- Short Answer: provide model_answer (2-3 sentences) and 3+ key_points, correct_answer empty
- Long Answer: provide model_answer (detailed) and 4+ key_points, correct_answer empty
- All types must include explanation
- Questions should test understanding, not just memorization
- Return ONLY valid JSON, no markdown code blocks"""

def build_practice_prompt(subject: str, chapter: str, num_questions: int, question_type: str, difficulty: str = "mixed") -> str:
    diff_instruction = ""
    if difficulty in ("easy", "medium", "hard"):
        diff_instruction = f"\nDifficulty: ALL questions must be \"{difficulty}\" difficulty level."
    else:
        diff_instruction = "\nDifficulty: Vary difficulty across easy, medium, and hard."

    if question_type == "mixed":
        mcq_count = max(1, round(num_questions * 0.4))
        tf_count = max(1, round(num_questions * 0.2))
        num_count = max(1, round(num_questions * 0.2))
        sa_count = num_questions - mcq_count - tf_count - num_count
        if sa_count < 1:
            sa_count = 1
            mcq_count = num_questions - tf_count - num_count - sa_count
        return (
            f"Generate exactly {num_questions} practice questions for:\n"
            f"Subject: {subject}\nChapter: {chapter}\n{diff_instruction}\n\n"
            f"Distribution:\n"
            f"- {mcq_count} MCQ questions (question_type: mcq)\n"
            f"- {tf_count} True/False questions (question_type: true_false)\n"
            f"- {num_count} Numerical questions (question_type: numerical)\n"
            f"- {sa_count} Short Answer questions (question_type: short_answer)"
        )

    type_map = {
        "mcq": "MCQ (multiple choice with 4 options)",
        "true_false": "True/False",
        "numerical": "Numerical (integer answer)",
        "short_answer": "Short Answer (2-3 sentence response)",
        "long_answer": "Long Answer (detailed response)",
    }
    type_label = type_map.get(question_type, question_type)
    return (
        f"Generate exactly {num_questions} {type_label} questions for:\n"
        f"Subject: {subject}\nChapter: {chapter}\n{diff_instruction}\n\n"
        f"All questions must have question_type: \"{question_type}\""
    )

async def generate_practice_with_ai(subject: str, chapter: str, num_questions: int, question_type: str = "mixed", difficulty: str = "mixed") -> List[BaseQuestion]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=PRACTICE_SYSTEM_PROMPT
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=build_practice_prompt(subject, chapter, num_questions, question_type, difficulty)
    )

    response = await chat.send_message(user_message)
    logger.info(f"Practice AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        questions = []
        for i, q in enumerate(parsed["questions"]):
            if not q.get("id"):
                q["id"] = f"q{i + 1}"
            if not q.get("topic"):
                q["topic"] = chapter
            if q.get("difficulty") not in ("easy", "medium", "hard"):
                q["difficulty"] = "medium"
            if not isinstance(q.get("marks"), int) or q["marks"] < 1:
                marks_map = {"short_answer": 2, "long_answer": 4}
                q["marks"] = marks_map.get(q.get("question_type", ""), 1)
            if not q.get("key_points"):
                q["key_points"] = [f"Key concept from: {q.get('question', '')[:60]}"]
            questions.append(BaseQuestion(**q))
        return questions
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
    valid_note_types = ["quick_revision", "detailed", "exam_focused"]
    note_type = req.note_type if req.note_type in valid_note_types else "detailed"

    content = await generate_notes_with_ai(req.subject, req.chapter, note_type)
    note = StudyNote(
        subject=req.subject,
        chapter=req.chapter,
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

@api_router.get("/notes/search")
async def search_notes(q: str = ""):
    """Search notes by subject, chapter, or note_type"""
    if not q.strip():
        notes = await db.study_notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
        return notes
    query = {
        "$or": [
            {"subject": {"$regex": q, "$options": "i"}},
            {"chapter": {"$regex": q, "$options": "i"}},
            {"note_type": {"$regex": q, "$options": "i"}},
        ]
    }
    notes = await db.study_notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
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

@api_router.put("/notes/{note_id}", response_model=StudyNote)
async def update_note(note_id: str, req: NoteUpdateRequest):
    update_fields = {}
    if req.subject is not None:
        update_fields["subject"] = req.subject
    if req.chapter is not None:
        update_fields["chapter"] = req.chapter
    if req.note_type is not None:
        update_fields["note_type"] = req.note_type
    if req.content is not None:
        update_fields["content"] = req.content.model_dump()
    if req.tags is not None:
        update_fields["tags"] = req.tags
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.study_notes.update_one({"id": note_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    updated = await db.study_notes.find_one({"id": note_id}, {"_id": 0})
    return updated

@api_router.post("/notes/{note_id}/share")
async def share_note(note_id: str):
    note = await db.study_notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    share_id = note.get("share_id")
    if not share_id:
        share_id = str(uuid.uuid4())[:8]
        await db.study_notes.update_one({"id": note_id}, {"$set": {"share_id": share_id}})
    return {"share_id": share_id}

@api_router.get("/shared/{share_id}")
async def get_shared_note(share_id: str):
    note = await db.study_notes.find_one({"share_id": share_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Shared note not found")
    return note

@api_router.post("/notes/{note_id}/flashcards")
async def generate_flashcards(note_id: str):
    note = await db.study_notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    content = note.get("content", {})
    cards = []
    # Generate from key_points
    for i, kp in enumerate(content.get("key_points", [])):
        cards.append({"id": f"fc-{i+1}", "front": f"What is the significance of: {kp[:80]}...?" if len(kp) > 80 else f"Explain: {kp}", "back": kp})
    # Generate from main_content sections
    for si, section in enumerate(content.get("main_content", [])):
        heading = section.get("heading", "")
        points = section.get("points", [])
        if heading and points:
            cards.append({"id": f"fc-s{si+1}", "front": f"What are the key points about {heading}?", "back": " | ".join(points[:3])})

    if not cards:
        # Fallback: use AI
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if api_key:
            chat = LlmChat(api_key=api_key, session_id=str(uuid.uuid4()),
                system_message="Generate flashcards from study notes. Return ONLY valid JSON: {\"cards\": [{\"front\": \"question\", \"back\": \"answer\"}]}. Generate 5-10 cards."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            summary = f"Subject: {note.get('subject')}, Topic: {note.get('chapter')}\nIntro: {content.get('introduction', '')[:200]}\nKey Points: {', '.join(content.get('key_points', [])[:5])}"
            resp = await chat.send_message(UserMessage(text=f"Generate flashcards from these notes:\n{summary}"))
            try:
                cleaned = resp.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
                parsed = json.loads(cleaned)
                cards = [{"id": f"fc-ai-{i+1}", "front": c["front"], "back": c["back"]} for i, c in enumerate(parsed.get("cards", []))]
            except Exception:
                pass

    return {"note_id": note_id, "subject": note.get("subject"), "chapter": note.get("chapter"), "cards": cards}

@api_router.get("/tags")
async def get_all_tags():
    notes = await db.study_notes.find({"tags": {"$exists": True, "$ne": []}}, {"_id": 0, "tags": 1}).to_list(500)
    all_tags = set()
    for n in notes:
        for t in n.get("tags", []):
            all_tags.add(t)
    return sorted(all_tags)

# --- Planner Routes ---

@api_router.post("/planner/generate", response_model=StudyPlan)
async def generate_planner(req: PlannerRequest):
    days = await generate_planner_with_ai(req.topic, req.hours_per_day, req.num_days)
    plan = StudyPlan(
        topic=req.topic,
        hours_per_day=req.hours_per_day,
        num_days=req.num_days,
        days=days,
        plain_text=format_plan_plain_text(days)
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
    valid_types = ["mixed", "mcq", "true_false", "numerical", "short_answer", "long_answer"]
    q_type = req.question_type if req.question_type in valid_types else "mixed"
    diff = req.difficulty if req.difficulty in ("easy", "medium", "hard", "mixed") else "mixed"
    questions = await generate_practice_with_ai(req.subject, req.chapter, req.num_questions, q_type, diff)
    test = PracticeTest(
        subject=req.subject,
        chapter=req.chapter,
        num_questions=req.num_questions,
        question_type=q_type,
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

# --- Quiz Score Routes ---

@api_router.post("/quiz-scores")
async def save_quiz_score(req: QuizScoreRequest):
    pct = round((req.correct / req.total_gradable) * 100, 1) if req.total_gradable > 0 else 0
    record = QuizScoreRecord(
        test_id=req.test_id,
        subject=req.subject,
        chapter=req.chapter,
        total_gradable=req.total_gradable,
        correct=req.correct,
        total_subjective=req.total_subjective,
        attempted_subjective=req.attempted_subjective,
        score_pct=pct,
    )
    doc = record.model_dump()
    await db.quiz_scores.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/quiz-scores")
async def get_quiz_scores():
    scores = await db.quiz_scores.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return scores

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
                    "question_type": t.get("question_type", "mcq"),
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

# --- Analytics Routes ---

@api_router.get("/analytics")
async def get_analytics():
    notes_count = await db.study_notes.count_documents({})
    plans_count = await db.study_plans.count_documents({})
    exam_plans_count = await db.exam_plans.count_documents({})
    practice_count = await db.practice_tests.count_documents({})

    # Subject breakdown for notes
    notes_cursor = db.study_notes.find({}, {"_id": 0, "subject": 1, "note_type": 1, "created_at": 1})
    notes_list = await notes_cursor.to_list(500)
    subject_counts = {}
    note_type_counts = {}
    for n in notes_list:
        subj = n.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1
        nt = n.get("note_type", "detailed")
        note_type_counts[nt] = note_type_counts.get(nt, 0) + 1

    # Quiz stats
    tests_cursor = db.practice_tests.find({}, {"_id": 0, "num_questions": 1, "question_type": 1, "subject": 1})
    tests_list = await tests_cursor.to_list(500)
    total_questions = sum(t.get("num_questions", 0) for t in tests_list)
    quiz_type_counts = {}
    for t in tests_list:
        qt = t.get("question_type", "mcq")
        quiz_type_counts[qt] = quiz_type_counts.get(qt, 0) + 1
        subj = t.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1

    # Activity timeline (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    activity = {}
    for coll_name, label in [("study_notes", "notes"), ("study_plans", "plans"), ("exam_plans", "exam_plans"), ("practice_tests", "quizzes")]:
        cursor = db[coll_name].find(
            {"created_at": {"$gte": thirty_days_ago}},
            {"_id": 0, "created_at": 1}
        )
        docs = await cursor.to_list(500)
        for d in docs:
            day = d["created_at"][:10]
            if day not in activity:
                activity[day] = {"date": day, "notes": 0, "plans": 0, "exam_plans": 0, "quizzes": 0}
            activity[day][label] += 1

    activity_list = sorted(activity.values(), key=lambda x: x["date"])

    # Quiz score analytics
    scores_cursor = db.quiz_scores.find({}, {"_id": 0})
    scores_list = await scores_cursor.to_list(500)

    avg_accuracy = 0
    subject_scores = {}
    score_trend = []

    if scores_list:
        total_pct = sum(s.get("score_pct", 0) for s in scores_list)
        avg_accuracy = round(total_pct / len(scores_list), 1)

        # Per-subject accuracy
        for s in scores_list:
            subj = s.get("subject", "Unknown")
            if subj not in subject_scores:
                subject_scores[subj] = {"total_pct": 0, "count": 0, "total_correct": 0, "total_gradable": 0}
            subject_scores[subj]["total_pct"] += s.get("score_pct", 0)
            subject_scores[subj]["count"] += 1
            subject_scores[subj]["total_correct"] += s.get("correct", 0)
            subject_scores[subj]["total_gradable"] += s.get("total_gradable", 0)

        # Score trend (by date)
        trend_map = {}
        for s in scores_list:
            day = s["created_at"][:10]
            if day not in trend_map:
                trend_map[day] = {"date": day, "total_pct": 0, "count": 0}
            trend_map[day]["total_pct"] += s.get("score_pct", 0)
            trend_map[day]["count"] += 1
        score_trend = [{"date": v["date"], "avg_score": round(v["total_pct"] / v["count"], 1)} for v in sorted(trend_map.values(), key=lambda x: x["date"])]

    subject_accuracy = [
        {"subject": k, "avg_score": round(v["total_pct"] / v["count"], 1), "quizzes": v["count"], "correct": v["total_correct"], "total": v["total_gradable"]}
        for k, v in sorted(subject_scores.items(), key=lambda x: -(x[1]["total_pct"] / x[1]["count"]))
    ]

    return {
        "totals": {
            "notes": notes_count,
            "plans": plans_count,
            "exam_plans": exam_plans_count,
            "quizzes": practice_count,
            "total_questions": total_questions,
        },
        "subject_breakdown": [{"subject": k, "count": v} for k, v in sorted(subject_counts.items(), key=lambda x: -x[1])],
        "note_type_breakdown": [{"type": k, "count": v} for k, v in note_type_counts.items()],
        "quiz_type_breakdown": [{"type": k, "count": v} for k, v in quiz_type_counts.items()],
        "activity_timeline": activity_list,
        "quiz_scores": {
            "avg_accuracy": avg_accuracy,
            "total_attempts": len(scores_list),
            "subject_accuracy": subject_accuracy,
            "score_trend": score_trend,
        },
        "streaks": await compute_streaks(),
    }

async def compute_streaks():
    all_dates = set()
    for coll_name in ["study_notes", "study_plans", "exam_plans", "practice_tests", "quiz_scores"]:
        cursor = db[coll_name].find({}, {"_id": 0, "created_at": 1})
        docs = await cursor.to_list(2000)
        for d in docs:
            ca = d.get("created_at", "")
            if ca:
                all_dates.add(ca[:10])

    if not all_dates:
        return {"current_streak": 0, "longest_streak": 0, "total_active_days": 0, "weekly_heatmap": []}

    sorted_dates = sorted(all_dates)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    # Current streak (counting back from today or yesterday)
    current_streak = 0
    check_date = datetime.now(timezone.utc).date()
    if today not in all_dates and yesterday not in all_dates:
        current_streak = 0
    else:
        while True:
            ds = check_date.strftime("%Y-%m-%d")
            if ds in all_dates:
                current_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

    # Longest streak
    longest = 0
    streak = 0
    prev = None
    for ds in sorted_dates:
        d = datetime.strptime(ds, "%Y-%m-%d").date()
        if prev and (d - prev).days == 1:
            streak += 1
        else:
            streak = 1
        longest = max(longest, streak)
        prev = d

    # Weekly heatmap (last 7 weeks = 49 days)
    heatmap = []
    base = datetime.now(timezone.utc).date()
    # Count activity per day for heatmap
    activity_counts = {}
    for coll_name in ["study_notes", "study_plans", "exam_plans", "practice_tests"]:
        cutoff = (base - timedelta(days=48)).isoformat()
        cursor = db[coll_name].find({"created_at": {"$gte": cutoff}}, {"_id": 0, "created_at": 1})
        docs = await cursor.to_list(500)
        for d in docs:
            day = d["created_at"][:10]
            activity_counts[day] = activity_counts.get(day, 0) + 1

    for i in range(48, -1, -1):
        d = base - timedelta(days=i)
        ds = d.strftime("%Y-%m-%d")
        heatmap.append({
            "date": ds,
            "weekday": d.weekday(),
            "count": activity_counts.get(ds, 0),
        })

    return {
        "current_streak": current_streak,
        "longest_streak": longest,
        "total_active_days": len(all_dates),
        "weekly_heatmap": heatmap,
    }

@api_router.get("/analytics/export")
async def export_analytics_report():
    """Generate a text-based analytics report."""
    # Reuse analytics data
    notes_count = await db.study_notes.count_documents({})
    plans_count = await db.study_plans.count_documents({})
    exam_plans_count = await db.exam_plans.count_documents({})
    practice_count = await db.practice_tests.count_documents({})

    tests_cursor = db.practice_tests.find({}, {"_id": 0, "num_questions": 1})
    tests_list = await tests_cursor.to_list(500)
    total_questions = sum(t.get("num_questions", 0) for t in tests_list)

    scores_cursor = db.quiz_scores.find({}, {"_id": 0, "subject": 1, "score_pct": 1, "correct": 1, "total_gradable": 1})
    scores_list = await scores_cursor.to_list(500)
    avg_acc = round(sum(s["score_pct"] for s in scores_list) / len(scores_list), 1) if scores_list else 0

    streaks = await compute_streaks()

    # Subject breakdown
    notes_cursor = db.study_notes.find({}, {"_id": 0, "subject": 1})
    notes_list = await notes_cursor.to_list(500)
    subject_counts = {}
    for n in notes_list:
        subj = n.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1

    # Build report
    now = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    report = f"STUDYFORGE ANALYTICS REPORT\n{'=' * 50}\nGenerated: {now}\n{'=' * 50}\n\n"

    report += "OVERVIEW\n" + "-" * 30 + "\n"
    report += f"  Notes Generated:     {notes_count}\n"
    report += f"  Study Plans:         {plans_count}\n"
    report += f"  Exam Plans:          {exam_plans_count}\n"
    report += f"  Practice Quizzes:    {practice_count}\n"
    report += f"  Total Questions:     {total_questions}\n\n"

    report += "STUDY STREAKS\n" + "-" * 30 + "\n"
    report += f"  Current Streak:      {streaks['current_streak']} day(s)\n"
    report += f"  Longest Streak:      {streaks['longest_streak']} day(s)\n"
    report += f"  Total Active Days:   {streaks['total_active_days']}\n\n"

    if scores_list:
        report += "QUIZ PERFORMANCE\n" + "-" * 30 + "\n"
        report += f"  Average Accuracy:    {avg_acc}%\n"
        report += f"  Total Attempts:      {len(scores_list)}\n"
        subj_scores = {}
        for s in scores_list:
            subj = s.get("subject", "Unknown")
            if subj not in subj_scores:
                subj_scores[subj] = {"total": 0, "correct": 0, "count": 0}
            subj_scores[subj]["total"] += s.get("total_gradable", 0)
            subj_scores[subj]["correct"] += s.get("correct", 0)
            subj_scores[subj]["count"] += 1
        report += "\n  By Subject:\n"
        for subj, v in sorted(subj_scores.items(), key=lambda x: -(x[1]["correct"] / max(x[1]["total"], 1))):
            pct = round((v["correct"] / max(v["total"], 1)) * 100, 1)
            report += f"    {subj}: {pct}% ({v['correct']}/{v['total']}) - {v['count']} quiz(zes)\n"
        report += "\n"

    if subject_counts:
        report += "TOP SUBJECTS\n" + "-" * 30 + "\n"
        for subj, count in sorted(subject_counts.items(), key=lambda x: -x[1])[:10]:
            report += f"  {subj}: {count} note(s)\n"
        report += "\n"

    report += "-" * 50 + "\nStudyForge - AI-powered study tools\n"

    return {"report": report}

@api_router.get("/analytics/recommendations")
async def get_study_recommendations():
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        return {"recommendations": []}

    # Gather context
    scores_cursor = db.quiz_scores.find({}, {"_id": 0, "subject": 1, "chapter": 1, "score_pct": 1, "created_at": 1})
    scores = await scores_cursor.to_list(100)

    notes_cursor = db.study_notes.find({}, {"_id": 0, "subject": 1, "chapter": 1, "created_at": 1})
    notes = await notes_cursor.to_list(100)

    streaks = await compute_streaks()

    # Build context summary
    context = f"Current streak: {streaks['current_streak']} days. Longest: {streaks['longest_streak']}. Active days: {streaks['total_active_days']}.\n"

    if scores:
        subj_scores = {}
        for s in scores:
            subj = s.get("subject", "Unknown")
            if subj not in subj_scores:
                subj_scores[subj] = []
            subj_scores[subj].append(s["score_pct"])
        context += "Quiz scores by subject:\n"
        for subj, pcts in subj_scores.items():
            avg = round(sum(pcts) / len(pcts), 1)
            context += f"  {subj}: avg {avg}% ({len(pcts)} quizzes)\n"

    if notes:
        subj_dates = {}
        for n in notes:
            subj = n.get("subject", "Unknown")
            subj_dates[subj] = n["created_at"][:10]
        context += "Last note date by subject:\n"
        for subj, d in sorted(subj_dates.items(), key=lambda x: x[1]):
            context += f"  {subj}: last studied {d}\n"

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message="You are a study coach. Given study analytics, generate 3-5 concise, actionable study recommendations. Return ONLY valid JSON: {\"recommendations\": [{\"type\": \"weakness|strength|reminder|motivation\", \"title\": \"Short title\", \"message\": \"Actionable advice in 1-2 sentences\"}]}. Types: weakness=low scores, strength=high scores, reminder=not studied recently, motivation=streak/consistency."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        response = await chat.send_message(UserMessage(text=f"Generate study recommendations based on this data:\n{context}"))
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return {"recommendations": parsed.get("recommendations", [])}
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        return {"recommendations": []}

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
