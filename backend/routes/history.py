from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from database import db
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def get_unified_history(item_type: Optional[str] = None, user=Depends(get_current_user)):
    uid = user["id"]
    items = []

    if item_type is None or item_type == "note":
        notes = await db.study_notes.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
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
        plans = await db.study_plans.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for p in plans:
            items.append({
                "type": "plan",
                "id": p["id"],
                "title": p["topic"],
                "subtitle": f"{p['num_days']} days \u00b7 {p['hours_per_day']}h/day",
                "created_at": p["created_at"],
                "preview": {
                    "total_days": p["num_days"],
                    "hours_per_day": p["hours_per_day"],
                    "first_day_topic": p.get("days", [{}])[0].get("topic", "") if p.get("days") else "",
                },
                "data": p,
            })

    if item_type is None or item_type == "practice":
        tests = await db.practice_tests.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
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
        exam_plans = await db.exam_plans.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
        for ep in exam_plans:
            topics_str = ", ".join(ep.get("topics", [])[:3])
            if len(ep.get("topics", [])) > 3:
                topics_str += f" +{len(ep['topics']) - 3} more"
            items.append({
                "type": "exam_plan",
                "id": ep["id"],
                "title": ep["subject"],
                "subtitle": f"Exam: {ep['exam_date'][:10]} \u00b7 {ep['days_until_exam']} days \u00b7 {ep['hours_per_day']}h/day",
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


@router.delete("/history/{item_type}/{item_id}")
async def delete_history_item(item_type: str, item_id: str, user=Depends(get_current_user)):
    collection_map = {
        "note": "study_notes",
        "plan": "study_plans",
        "practice": "practice_tests",
        "exam_plan": "exam_plans",
    }
    coll_name = collection_map.get(item_type)
    if not coll_name:
        raise HTTPException(status_code=400, detail="Invalid item type")
    result = await db[coll_name].delete_one({"id": item_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted"}
