from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from database import db
from ai_service import generate_recommendations
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analytics"])


async def compute_streaks(uid: str):
    all_dates = set()
    for coll_name in ["study_notes", "study_plans", "exam_plans", "practice_tests", "quiz_scores"]:
        cursor = db[coll_name].find({"user_id": uid}, {"_id": 0, "created_at": 1})
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

    heatmap = []
    base = datetime.now(timezone.utc).date()
    activity_counts = {}
    for coll_name in ["study_notes", "study_plans", "exam_plans", "practice_tests"]:
        cutoff = (base - timedelta(days=48)).isoformat()
        cursor = db[coll_name].find(
            {"user_id": uid, "created_at": {"$gte": cutoff}},
            {"_id": 0, "created_at": 1},
        )
        docs = await cursor.to_list(500)
        for d in docs:
            day = d["created_at"][:10]
            activity_counts[day] = activity_counts.get(day, 0) + 1

    for i in range(48, -1, -1):
        d = base - timedelta(days=i)
        ds = d.strftime("%Y-%m-%d")
        heatmap.append({"date": ds, "weekday": d.weekday(), "count": activity_counts.get(ds, 0)})

    return {
        "current_streak": current_streak,
        "longest_streak": longest,
        "total_active_days": len(all_dates),
        "weekly_heatmap": heatmap,
    }


@router.get("/analytics")
async def get_analytics(user=Depends(get_current_user)):
    uid = user["id"]
    notes_count = await db.study_notes.count_documents({"user_id": uid})
    plans_count = await db.study_plans.count_documents({"user_id": uid})
    exam_plans_count = await db.exam_plans.count_documents({"user_id": uid})
    practice_count = await db.practice_tests.count_documents({"user_id": uid})

    notes_cursor = db.study_notes.find({"user_id": uid}, {"_id": 0, "subject": 1, "note_type": 1, "created_at": 1})
    notes_list = await notes_cursor.to_list(500)
    subject_counts = {}
    note_type_counts = {}
    for n in notes_list:
        subj = n.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1
        nt = n.get("note_type", "detailed")
        note_type_counts[nt] = note_type_counts.get(nt, 0) + 1

    tests_cursor = db.practice_tests.find({"user_id": uid}, {"_id": 0, "num_questions": 1, "question_type": 1, "subject": 1})
    tests_list = await tests_cursor.to_list(500)
    total_questions = sum(t.get("num_questions", 0) for t in tests_list)
    quiz_type_counts = {}
    for t in tests_list:
        qt = t.get("question_type", "mcq")
        quiz_type_counts[qt] = quiz_type_counts.get(qt, 0) + 1
        subj = t.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1

    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    activity = {}
    for coll_name, label in [("study_notes", "notes"), ("study_plans", "plans"), ("exam_plans", "exam_plans"), ("practice_tests", "quizzes")]:
        cursor = db[coll_name].find(
            {"user_id": uid, "created_at": {"$gte": thirty_days_ago}},
            {"_id": 0, "created_at": 1},
        )
        docs = await cursor.to_list(500)
        for d in docs:
            day = d["created_at"][:10]
            if day not in activity:
                activity[day] = {"date": day, "notes": 0, "plans": 0, "exam_plans": 0, "quizzes": 0}
            activity[day][label] += 1
    activity_list = sorted(activity.values(), key=lambda x: x["date"])

    scores_cursor = db.quiz_scores.find({"user_id": uid}, {"_id": 0})
    scores_list = await scores_cursor.to_list(500)

    avg_accuracy = 0
    subject_scores = {}
    score_trend = []

    if scores_list:
        total_pct = sum(s.get("score_pct", 0) for s in scores_list)
        avg_accuracy = round(total_pct / len(scores_list), 1)

        for s in scores_list:
            subj = s.get("subject", "Unknown")
            if subj not in subject_scores:
                subject_scores[subj] = {"total_pct": 0, "count": 0, "total_correct": 0, "total_gradable": 0}
            subject_scores[subj]["total_pct"] += s.get("score_pct", 0)
            subject_scores[subj]["count"] += 1
            subject_scores[subj]["total_correct"] += s.get("correct", 0)
            subject_scores[subj]["total_gradable"] += s.get("total_gradable", 0)

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
        "streaks": await compute_streaks(uid),
    }


@router.get("/analytics/export")
async def export_analytics_report(user=Depends(get_current_user)):
    uid = user["id"]
    notes_count = await db.study_notes.count_documents({"user_id": uid})
    plans_count = await db.study_plans.count_documents({"user_id": uid})
    exam_plans_count = await db.exam_plans.count_documents({"user_id": uid})
    practice_count = await db.practice_tests.count_documents({"user_id": uid})

    tests_cursor = db.practice_tests.find({"user_id": uid}, {"_id": 0, "num_questions": 1})
    tests_list = await tests_cursor.to_list(500)
    total_questions = sum(t.get("num_questions", 0) for t in tests_list)

    scores_cursor = db.quiz_scores.find({"user_id": uid}, {"_id": 0, "subject": 1, "score_pct": 1, "correct": 1, "total_gradable": 1})
    scores_list = await scores_cursor.to_list(500)
    avg_acc = round(sum(s["score_pct"] for s in scores_list) / len(scores_list), 1) if scores_list else 0

    streaks = await compute_streaks(uid)

    notes_cursor = db.study_notes.find({"user_id": uid}, {"_id": 0, "subject": 1})
    notes_list = await notes_cursor.to_list(500)
    subject_counts = {}
    for n in notes_list:
        subj = n.get("subject", "Unknown")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1

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


@router.get("/analytics/recommendations")
async def get_study_recommendations(user=Depends(get_current_user)):
    uid = user["id"]
    scores_cursor = db.quiz_scores.find({"user_id": uid}, {"_id": 0, "subject": 1, "chapter": 1, "score_pct": 1, "created_at": 1})
    scores = await scores_cursor.to_list(100)

    notes_cursor = db.study_notes.find({"user_id": uid}, {"_id": 0, "subject": 1, "chapter": 1, "created_at": 1})
    notes = await notes_cursor.to_list(100)

    streaks = await compute_streaks(uid)

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

    recs = await generate_recommendations(context)
    return {"recommendations": recs}


@router.get("/analytics/weekly-report")
async def get_weekly_report(user=Depends(get_current_user)):
    uid = user["id"]
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_start_iso = week_start.isoformat()

    date_filter = {"user_id": uid, "created_at": {"$gte": week_start_iso}}

    notes = await db.study_notes.find(date_filter, {"_id": 0, "subject": 1, "chapter": 1, "created_at": 1}).to_list(200)
    plans = await db.study_plans.find(date_filter, {"_id": 0, "topic": 1}).to_list(100)
    exam_plans = await db.exam_plans.find(date_filter, {"_id": 0, "subject": 1}).to_list(100)
    tests = await db.practice_tests.find(date_filter, {"_id": 0, "subject": 1, "chapter": 1, "num_questions": 1}).to_list(200)
    scores = await db.quiz_scores.find(date_filter, {"_id": 0, "subject": 1, "score_pct": 1, "correct": 1, "total_gradable": 1}).to_list(200)
    sessions = await db.pomodoro_sessions.find({**date_filter, "completed": True}, {"_id": 0, "subject": 1, "duration_minutes": 1}).to_list(500)

    streaks = await compute_streaks(uid)

    # Build context for AI
    context = f"Weekly Study Report for {week_start.strftime('%B %d')} - {now.strftime('%B %d, %Y')}:\n\n"
    context += f"Notes generated: {len(notes)}\n"
    context += f"Study plans created: {len(plans)}\n"
    context += f"Exam plans created: {len(exam_plans)}\n"
    context += f"Practice tests taken: {len(tests)}\n"
    context += f"Total questions practiced: {sum(t.get('num_questions', 0) for t in tests)}\n"

    total_pomo = sum(s.get("duration_minutes", 0) for s in sessions)
    context += f"Pomodoro sessions: {len(sessions)} ({total_pomo} minutes)\n"
    context += f"Current streak: {streaks['current_streak']} days\n\n"

    if scores:
        avg = round(sum(s["score_pct"] for s in scores) / len(scores), 1)
        context += f"Quiz average: {avg}%\n"
        subj_scores = {}
        for s in scores:
            subj = s.get("subject", "Unknown")
            if subj not in subj_scores:
                subj_scores[subj] = []
            subj_scores[subj].append(s["score_pct"])
        for subj, pcts in subj_scores.items():
            context += f"  {subj}: {round(sum(pcts)/len(pcts), 1)}%\n"

    if notes:
        subjects = {}
        for n in notes:
            subj = n.get("subject", "Unknown")
            subjects[subj] = subjects.get(subj, 0) + 1
        context += "\nSubjects studied:\n"
        for subj, count in sorted(subjects.items(), key=lambda x: -x[1]):
            context += f"  {subj}: {count} notes\n"

    # Generate AI summary
    from ai_service import generate_recommendations
    import json
    import os
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import uuid as uuid_mod

    api_key = os.environ.get('EMERGENT_LLM_KEY')
    report_text = ""
    highlights = []
    areas_to_improve = []
    next_week_tips = []

    if api_key:
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=str(uuid_mod.uuid4()),
                system_message='You are a study coach. Given weekly study data, generate a motivating weekly report. Return ONLY valid JSON: {"summary": "2-3 sentence overview", "highlights": ["achievement 1", "achievement 2"], "areas_to_improve": ["area 1", "area 2"], "next_week_tips": ["tip 1", "tip 2", "tip 3"], "grade": "A/B/C/D/F"}',
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")

            resp = await chat.send_message(UserMessage(text=f"Generate weekly study report:\n{context}"))
            cleaned = resp.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
            parsed = json.loads(cleaned)
            report_text = parsed.get("summary", "")
            highlights = parsed.get("highlights", [])
            areas_to_improve = parsed.get("areas_to_improve", [])
            next_week_tips = parsed.get("next_week_tips", [])
            grade = parsed.get("grade", "")
        except Exception as e:
            logger.error(f"Weekly report AI error: {e}")
            report_text = f"This week you generated {len(notes)} notes, took {len(tests)} quizzes, and studied for {total_pomo} minutes."
            grade = ""
    else:
        report_text = f"This week you generated {len(notes)} notes, took {len(tests)} quizzes, and studied for {total_pomo} minutes."
        grade = ""

    return {
        "period": f"{week_start.strftime('%b %d')} - {now.strftime('%b %d, %Y')}",
        "summary": report_text,
        "highlights": highlights,
        "areas_to_improve": areas_to_improve,
        "next_week_tips": next_week_tips,
        "grade": grade if 'grade' in dir() else "",
        "stats": {
            "notes_count": len(notes),
            "plans_count": len(plans),
            "exam_plans_count": len(exam_plans),
            "tests_count": len(tests),
            "total_questions": sum(t.get("num_questions", 0) for t in tests),
            "pomodoro_minutes": total_pomo,
            "pomodoro_sessions": len(sessions),
            "avg_quiz_score": round(sum(s["score_pct"] for s in scores) / len(scores), 1) if scores else 0,
            "streak": streaks["current_streak"],
        },
    }
