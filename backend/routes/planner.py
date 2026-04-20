from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone, timedelta
from database import db
from models import StudyPlan, PlannerRequest, ExamPlan, ExamPlanRequest, ExamPlanDay
from ai_service import generate_planner_with_ai, format_plan_plain_text, generate_exam_plan_with_ai
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["planner"])


# --- Regular Planner ---

@router.post("/planner/generate", response_model=StudyPlan)
async def generate_planner(req: PlannerRequest, user=Depends(get_current_user)):
    days = await generate_planner_with_ai(req.topic, req.hours_per_day, req.num_days)
    plan = StudyPlan(
        topic=req.topic,
        hours_per_day=req.hours_per_day,
        num_days=req.num_days,
        days=days,
        plain_text=format_plan_plain_text(days),
        user_id=user["id"],
    )
    doc = plan.model_dump()
    await db.study_plans.insert_one(doc)
    return plan


@router.get("/planners", response_model=List[StudyPlan])
async def get_all_planners(user=Depends(get_current_user)):
    plans = await db.study_plans.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return plans


@router.delete("/planners/{plan_id}")
async def delete_planner(plan_id: str, user=Depends(get_current_user)):
    result = await db.study_plans.delete_one({"id": plan_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deleted"}


# --- Exam Planner ---

@router.post("/planner/exam/generate", response_model=ExamPlan)
async def generate_exam_plan(req: ExamPlanRequest, user=Depends(get_current_user)):
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

    for day in days:
        day_date = today + timedelta(days=day.day)
        day.date = day_date.isoformat()

    plan = ExamPlan(
        subject=req.subject,
        topics=req.topics,
        exam_date=req.exam_date,
        hours_per_day=req.hours_per_day,
        days_until_exam=days_until_exam,
        days=days,
        user_id=user["id"],
    )
    doc = plan.model_dump()
    await db.exam_plans.insert_one(doc)
    return plan


@router.get("/exam-planners", response_model=List[ExamPlan])
async def get_all_exam_planners(user=Depends(get_current_user)):
    plans = await db.exam_plans.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return plans


@router.delete("/exam-planners/{plan_id}")
async def delete_exam_planner(plan_id: str, user=Depends(get_current_user)):
    result = await db.exam_plans.delete_one({"id": plan_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam plan not found")
    return {"message": "Exam plan deleted"}
