from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from database import db
from models import StudyNote, NoteContent, GenerateRequest, NoteUpdateRequest
from ai_service import generate_notes_with_ai, generate_flashcards_ai
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["notes"])


@router.post("/notes/generate", response_model=StudyNote)
async def generate_notes(req: GenerateRequest, user=Depends(get_current_user)):
    valid_note_types = ["quick_revision", "detailed", "exam_focused"]
    note_type = req.note_type if req.note_type in valid_note_types else "detailed"
    content = await generate_notes_with_ai(req.subject, req.chapter, note_type)
    note = StudyNote(
        subject=req.subject,
        chapter=req.chapter,
        note_type=note_type,
        content=content,
        user_id=user["id"],
    )
    doc = note.model_dump()
    await db.study_notes.insert_one(doc)
    return note


@router.get("/notes", response_model=List[StudyNote])
async def get_all_notes(user=Depends(get_current_user)):
    notes = await db.study_notes.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notes


@router.get("/notes/search")
async def search_notes(q: str = "", user=Depends(get_current_user)):
    base_filter = {"user_id": user["id"]}
    if not q.strip():
        notes = await db.study_notes.find(base_filter, {"_id": 0}).sort("created_at", -1).to_list(50)
        return notes
    query = {
        "$and": [
            {"user_id": user["id"]},
            {
                "$or": [
                    {"subject": {"$regex": q, "$options": "i"}},
                    {"chapter": {"$regex": q, "$options": "i"}},
                    {"note_type": {"$regex": q, "$options": "i"}},
                ]
            },
        ]
    }
    notes = await db.study_notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notes


@router.get("/notes/{note_id}", response_model=StudyNote)
async def get_note(note_id: str, user=Depends(get_current_user)):
    note = await db.study_notes.find_one(
        {"id": note_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user=Depends(get_current_user)):
    result = await db.study_notes.delete_one({"id": note_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}


@router.delete("/notes/bulk/delete")
async def bulk_delete_notes(ids: List[str], user=Depends(get_current_user)):
    result = await db.study_notes.delete_many({"id": {"$in": ids}, "user_id": user["id"]})
    return {"deleted": result.deleted_count}


@router.put("/notes/{note_id}", response_model=StudyNote)
async def update_note(note_id: str, req: NoteUpdateRequest, user=Depends(get_current_user)):
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
    result = await db.study_notes.update_one(
        {"id": note_id, "user_id": user["id"]}, {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    updated = await db.study_notes.find_one({"id": note_id}, {"_id": 0})
    return updated


@router.post("/notes/{note_id}/share")
async def share_note(note_id: str, user=Depends(get_current_user)):
    note = await db.study_notes.find_one(
        {"id": note_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    share_id = note.get("share_id")
    if not share_id:
        share_id = str(uuid.uuid4())[:8]
        await db.study_notes.update_one(
            {"id": note_id}, {"$set": {"share_id": share_id}}
        )
    return {"share_id": share_id}


# Public — no auth required
@router.get("/shared/{share_id}")
async def get_shared_note(share_id: str):
    note = await db.study_notes.find_one({"share_id": share_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Shared note not found")
    return note


@router.post("/notes/{note_id}/flashcards")
async def generate_flashcards(note_id: str, user=Depends(get_current_user)):
    note = await db.study_notes.find_one(
        {"id": note_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    content = note.get("content", {})
    cards = []
    for i, kp in enumerate(content.get("key_points", [])):
        cards.append({
            "id": f"fc-{i+1}",
            "front": f"What is the significance of: {kp[:80]}...?" if len(kp) > 80 else f"Explain: {kp}",
            "back": kp,
        })
    for si, section in enumerate(content.get("main_content", [])):
        heading = section.get("heading", "")
        points = section.get("points", [])
        if heading and points:
            cards.append({
                "id": f"fc-s{si+1}",
                "front": f"What are the key points about {heading}?",
                "back": " | ".join(points[:3]),
            })

    if not cards:
        summary = f"Subject: {note.get('subject')}, Topic: {note.get('chapter')}\nIntro: {content.get('introduction', '')[:200]}\nKey Points: {', '.join(content.get('key_points', [])[:5])}"
        cards = await generate_flashcards_ai(note.get("subject", ""), note.get("chapter", ""), summary)

    return {
        "note_id": note_id,
        "subject": note.get("subject"),
        "chapter": note.get("chapter"),
        "cards": cards,
    }


@router.get("/tags")
async def get_all_tags(user=Depends(get_current_user)):
    notes = await db.study_notes.find(
        {"user_id": user["id"], "tags": {"$exists": True, "$ne": []}},
        {"_id": 0, "tags": 1},
    ).to_list(500)
    all_tags = set()
    for n in notes:
        for t in n.get("tags", []):
            all_tags.add(t)
    return sorted(all_tags)
