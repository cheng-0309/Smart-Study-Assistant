from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import Bookmark, BookmarkRequest
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["bookmarks"])


@router.post("/bookmarks")
async def toggle_bookmark(req: BookmarkRequest, user=Depends(get_current_user)):
    uid = user["id"]
    existing = await db.bookmarks.find_one(
        {"user_id": uid, "item_type": req.item_type, "item_id": req.item_id}
    )
    if existing:
        await db.bookmarks.delete_one({"_id": existing["_id"]})
        return {"bookmarked": False, "message": "Bookmark removed"}
    else:
        bm = Bookmark(item_type=req.item_type, item_id=req.item_id, user_id=uid)
        doc = bm.model_dump()
        await db.bookmarks.insert_one(doc)
        doc.pop("_id", None)
        return {"bookmarked": True, "message": "Bookmarked", "bookmark": doc}


@router.get("/bookmarks")
async def get_bookmarks(user=Depends(get_current_user)):
    bms = await db.bookmarks.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return bms


@router.get("/bookmarks/check/{item_type}/{item_id}")
async def check_bookmark(item_type: str, item_id: str, user=Depends(get_current_user)):
    existing = await db.bookmarks.find_one(
        {"user_id": user["id"], "item_type": item_type, "item_id": item_id}
    )
    return {"bookmarked": existing is not None}


@router.get("/bookmarks/items")
async def get_bookmarked_items(user=Depends(get_current_user)):
    uid = user["id"]
    bms = await db.bookmarks.find({"user_id": uid}, {"_id": 0}).to_list(200)

    items = []
    coll_map = {
        "note": "study_notes",
        "practice": "practice_tests",
        "plan": "study_plans",
        "exam_plan": "exam_plans",
    }
    for bm in bms:
        coll_name = coll_map.get(bm["item_type"])
        if not coll_name:
            continue
        item = await db[coll_name].find_one({"id": bm["item_id"], "user_id": uid}, {"_id": 0})
        if item:
            items.append({
                "bookmark_id": bm["id"],
                "item_type": bm["item_type"],
                "item_id": bm["item_id"],
                "bookmarked_at": bm["created_at"],
                "data": item,
            })
    return items
