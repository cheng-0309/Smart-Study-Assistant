from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import ConfidenceRating, ConfidenceRatingRequest
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["confidence"])


@router.post("/confidence")
async def rate_confidence(req: ConfidenceRatingRequest, user=Depends(get_current_user)):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    uid = user["id"]
    # Upsert — update if exists, create if not
    existing = await db.confidence_ratings.find_one(
        {"user_id": uid, "note_id": req.note_id}
    )
    if existing:
        await db.confidence_ratings.update_one(
            {"user_id": uid, "note_id": req.note_id},
            {"$set": {"rating": req.rating, "subject": req.subject, "chapter": req.chapter}},
        )
        return {"message": "Rating updated", "rating": req.rating}
    else:
        cr = ConfidenceRating(
            note_id=req.note_id,
            rating=req.rating,
            subject=req.subject,
            chapter=req.chapter,
            user_id=uid,
        )
        doc = cr.model_dump()
        await db.confidence_ratings.insert_one(doc)
        doc.pop("_id", None)
        return {"message": "Rating saved", "rating": req.rating, "data": doc}


@router.get("/confidence")
async def get_all_ratings(user=Depends(get_current_user)):
    ratings = await db.confidence_ratings.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return ratings


@router.get("/confidence/{note_id}")
async def get_note_rating(note_id: str, user=Depends(get_current_user)):
    rating = await db.confidence_ratings.find_one(
        {"user_id": user["id"], "note_id": note_id}, {"_id": 0}
    )
    return rating or {"rating": 0}


@router.get("/confidence/summary/by-subject")
async def get_confidence_by_subject(user=Depends(get_current_user)):
    ratings = await db.confidence_ratings.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(500)

    subject_map = {}
    for r in ratings:
        subj = r.get("subject", "Unknown")
        if subj not in subject_map:
            subject_map[subj] = {"total": 0, "count": 0, "ratings": []}
        subject_map[subj]["total"] += r["rating"]
        subject_map[subj]["count"] += 1
        subject_map[subj]["ratings"].append(r["rating"])

    result = []
    for subj, data in sorted(subject_map.items(), key=lambda x: x[1]["total"] / max(x[1]["count"], 1)):
        avg = round(data["total"] / data["count"], 1)
        result.append({
            "subject": subj,
            "avg_confidence": avg,
            "total_ratings": data["count"],
            "low_count": sum(1 for r in data["ratings"] if r <= 2),
            "high_count": sum(1 for r in data["ratings"] if r >= 4),
        })
    return result
