from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from database import db
from models import PomodoroSession, PomodoroSessionRequest
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["pomodoro"])


@router.post("/pomodoro/sessions")
async def save_pomodoro_session(req: PomodoroSessionRequest, user=Depends(get_current_user)):
    session = PomodoroSession(
        subject=req.subject,
        topic=req.topic,
        duration_minutes=req.duration_minutes,
        break_minutes=req.break_minutes,
        completed=req.completed,
        user_id=user["id"],
    )
    doc = session.model_dump()
    await db.pomodoro_sessions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/pomodoro/sessions")
async def get_pomodoro_sessions(user=Depends(get_current_user)):
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return sessions


@router.get("/pomodoro/stats")
async def get_pomodoro_stats(user=Depends(get_current_user)):
    uid = user["id"]
    all_sessions = await db.pomodoro_sessions.find(
        {"user_id": uid, "completed": True}, {"_id": 0}
    ).to_list(1000)

    total_minutes = sum(s.get("duration_minutes", 0) for s in all_sessions)
    total_sessions = len(all_sessions)

    # Today's stats
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_sessions = [s for s in all_sessions if s.get("created_at", "")[:10] == today]
    today_minutes = sum(s.get("duration_minutes", 0) for s in today_sessions)

    # This week
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    week_sessions = [s for s in all_sessions if s.get("created_at", "")[:10] >= week_start]
    week_minutes = sum(s.get("duration_minutes", 0) for s in week_sessions)

    # Subject breakdown
    subject_map = {}
    for s in all_sessions:
        subj = s.get("subject", "Unknown")
        if subj not in subject_map:
            subject_map[subj] = {"sessions": 0, "minutes": 0}
        subject_map[subj]["sessions"] += 1
        subject_map[subj]["minutes"] += s.get("duration_minutes", 0)

    # Daily breakdown (last 14 days)
    daily = {}
    for i in range(14):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily[d] = 0
    for s in all_sessions:
        day = s.get("created_at", "")[:10]
        if day in daily:
            daily[day] += s.get("duration_minutes", 0)

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "today_sessions": len(today_sessions),
        "today_minutes": today_minutes,
        "week_sessions": len(week_sessions),
        "week_minutes": week_minutes,
        "subject_breakdown": [{"subject": k, **v} for k, v in sorted(subject_map.items(), key=lambda x: -x[1]["minutes"])],
        "daily_breakdown": [{"date": k, "minutes": v} for k, v in sorted(daily.items())],
    }
