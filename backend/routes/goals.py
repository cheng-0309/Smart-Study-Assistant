from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone, timedelta
from database import db
from models import StudyGoal, StudyGoalRequest
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["goals"])


def get_period_range(period: str, start_date: str, end_date: str = ""):
    now = datetime.now(timezone.utc)
    if period == "weekly":
        start = now - timedelta(days=now.weekday())  # Monday
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=7)
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (start.month % 12) + 1
        next_year = start.year + (1 if next_month == 1 else 0)
        end = start.replace(year=next_year, month=next_month)
    else:  # custom
        try:
            start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            start = now - timedelta(days=7)
        try:
            end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            end = now + timedelta(days=7)
    return start.isoformat(), end.isoformat()


async def compute_goal_progress(goal: dict, uid: str) -> float:
    start_iso, end_iso = get_period_range(goal["period"], goal.get("start_date", ""), goal.get("end_date", ""))
    date_filter = {"user_id": uid, "created_at": {"$gte": start_iso, "$lte": end_iso}}
    subject = goal.get("subject", "")

    goal_type = goal["goal_type"]

    if goal_type == "notes_count":
        filt = {**date_filter}
        if subject:
            filt["subject"] = {"$regex": subject, "$options": "i"}
        return await db.study_notes.count_documents(filt)

    elif goal_type == "quiz_count":
        filt = {**date_filter}
        if subject:
            filt["subject"] = {"$regex": subject, "$options": "i"}
        return await db.practice_tests.count_documents(filt)

    elif goal_type == "quiz_score_avg":
        filt = {**date_filter}
        if subject:
            filt["subject"] = {"$regex": subject, "$options": "i"}
        scores = await db.quiz_scores.find(filt, {"_id": 0, "score_pct": 1}).to_list(500)
        if not scores:
            return 0
        return round(sum(s["score_pct"] for s in scores) / len(scores), 1)

    elif goal_type == "study_days":
        all_dates = set()
        for coll in ["study_notes", "study_plans", "exam_plans", "practice_tests"]:
            docs = await db[coll].find(date_filter, {"_id": 0, "created_at": 1}).to_list(500)
            for d in docs:
                all_dates.add(d["created_at"][:10])
        return len(all_dates)

    elif goal_type == "plans_count":
        filt = {**date_filter}
        plans = await db.study_plans.count_documents(filt)
        exam_plans = await db.exam_plans.count_documents(filt)
        return plans + exam_plans

    elif goal_type == "pomodoro_minutes":
        filt = {**date_filter, "completed": True}
        if subject:
            filt["subject"] = {"$regex": subject, "$options": "i"}
        sessions = await db.pomodoro_sessions.find(filt, {"_id": 0, "duration_minutes": 1}).to_list(500)
        return sum(s.get("duration_minutes", 0) for s in sessions)

    return 0


@router.post("/goals")
async def create_goal(req: StudyGoalRequest, user=Depends(get_current_user)):
    valid_types = ["notes_count", "quiz_count", "quiz_score_avg", "study_days", "plans_count", "pomodoro_minutes"]
    if req.goal_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid goal type. Must be one of: {valid_types}")
    if req.target_value <= 0:
        raise HTTPException(status_code=400, detail="Target value must be positive")

    now = datetime.now(timezone.utc)
    if req.period == "weekly":
        start = now - timedelta(days=now.weekday())
        end = start + timedelta(days=7)
    elif req.period == "monthly":
        start = now.replace(day=1)
        next_month = (start.month % 12) + 1
        next_year = start.year + (1 if next_month == 1 else 0)
        end = start.replace(year=next_year, month=next_month)
    else:
        start = now
        try:
            end = datetime.fromisoformat(req.end_date.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            end = now + timedelta(days=7)

    goal = StudyGoal(
        title=req.title,
        goal_type=req.goal_type,
        target_value=req.target_value,
        subject=req.subject,
        period=req.period,
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        user_id=user["id"],
    )
    doc = goal.model_dump()
    await db.study_goals.insert_one(doc)
    doc.pop("_id", None)

    # Compute initial progress
    doc["current_value"] = await compute_goal_progress(doc, user["id"])
    if doc["current_value"] >= doc["target_value"]:
        doc["status"] = "completed"
        await db.study_goals.update_one({"id": doc["id"]}, {"$set": {"status": "completed", "current_value": doc["current_value"]}})

    return doc


@router.get("/goals")
async def get_goals(user=Depends(get_current_user)):
    goals = await db.study_goals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

    now = datetime.now(timezone.utc)
    result = []
    for g in goals:
        # Auto-compute progress
        g["current_value"] = await compute_goal_progress(g, user["id"])

        # Check expiry
        end_date = g.get("end_date", "")
        if end_date and g["status"] == "active":
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                if now > end_dt:
                    g["status"] = "expired"
                    await db.study_goals.update_one({"id": g["id"]}, {"$set": {"status": "expired"}})
            except (ValueError, AttributeError):
                pass

        # Check completion
        if g["status"] == "active" and g["current_value"] >= g["target_value"]:
            g["status"] = "completed"
            await db.study_goals.update_one({"id": g["id"]}, {"$set": {"status": "completed", "current_value": g["current_value"]}})

        await db.study_goals.update_one({"id": g["id"]}, {"$set": {"current_value": g["current_value"]}})
        result.append(g)
    return result


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    result = await db.study_goals.delete_one({"id": goal_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}
