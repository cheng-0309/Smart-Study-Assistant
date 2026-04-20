from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import PracticeTest, PracticeRequest, QuizScoreRecord, QuizScoreRequest
from ai_service import generate_practice_with_ai
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["practice"])


@router.post("/practice/generate", response_model=PracticeTest)
async def generate_practice(req: PracticeRequest, user=Depends(get_current_user)):
    valid_types = ["mixed", "mcq", "true_false", "numerical", "short_answer", "long_answer"]
    q_type = req.question_type if req.question_type in valid_types else "mixed"
    diff = req.difficulty if req.difficulty in ("easy", "medium", "hard", "mixed") else "mixed"
    questions = await generate_practice_with_ai(req.subject, req.chapter, req.num_questions, q_type, diff)
    test = PracticeTest(
        subject=req.subject,
        chapter=req.chapter,
        num_questions=req.num_questions,
        question_type=q_type,
        questions=questions,
        user_id=user["id"],
    )
    doc = test.model_dump()
    await db.practice_tests.insert_one(doc)
    return test


@router.get("/practices", response_model=List[PracticeTest])
async def get_all_practices(user=Depends(get_current_user)):
    tests = await db.practice_tests.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return tests


@router.delete("/practices/{test_id}")
async def delete_practice(test_id: str, user=Depends(get_current_user)):
    result = await db.practice_tests.delete_one({"id": test_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"message": "Test deleted"}


# --- Quiz Score Routes ---

@router.post("/quiz-scores")
async def save_quiz_score(req: QuizScoreRequest, user=Depends(get_current_user)):
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
        user_id=user["id"],
    )
    doc = record.model_dump()
    await db.quiz_scores.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/quiz-scores")
async def get_quiz_scores(user=Depends(get_current_user)):
    scores = await db.quiz_scores.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return scores
