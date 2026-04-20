from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


# --- Auth Models ---

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str


# --- Notes Models ---

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
    user_id: str = ""
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
    user_id: str = ""
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
    user_id: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuizScoreRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_id: str
    subject: str
    chapter: str
    total_gradable: int
    correct: int
    total_subjective: int = 0
    attempted_subjective: int = 0
    score_pct: float = 0
    user_id: str = ""
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
    user_id: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExamPlanRequest(BaseModel):
    subject: str
    topics: List[str]
    exam_date: str
    hours_per_day: float
