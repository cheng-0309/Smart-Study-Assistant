import os
import json
import uuid
import logging
from typing import List
from fastapi import HTTPException
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import (
    NoteContent, ContentSection, PlannerDay, BaseQuestion,
    ExamPlanDay,
)

logger = logging.getLogger(__name__)

# ========================
# NOTES AI
# ========================

NOTES_SYSTEM_PROMPT = """You are a study assistant that generates structured study notes. Generate notes in the following JSON format ONLY:
{
  "title": "Topic Name",
  "introduction": "2-3 line introduction to the topic",
  "main_content": [
    {
      "heading": "Section Heading",
      "points": ["Clear bullet point 1", "Clear bullet point 2", "Clear bullet point 3"]
    }
  ],
  "examples": ["Example 1 with explanation", "Example 2 with explanation"],
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "summary": "2-3 line summary of the topic"
}

Rules:
- title: The topic name as a clear heading
- introduction: 2-3 concise sentences introducing the topic
- main_content: 2-5 sections with clear headings and 2-5 bullet points each. IMPORTANT: The entire main_content section must NOT exceed 1800 words total.
- examples: 1-4 practical examples (if applicable to the subject, otherwise empty array [])
- key_points: MANDATORY. Must contain 5-10 short, exam-relevant bullet points highlighting the most important ideas
- summary: 2-3 concise sentences wrapping up the topic
- Keep language simple and readable
- Use clear headings and short bullet points
- No long paragraphs
- Return ONLY valid JSON, no markdown code blocks, no extra text"""


def build_notes_user_prompt(subject: str, chapter: str, note_type: str) -> str:
    type_guidance = {
        "quick_revision": "Keep notes short and concise. Use bullet points. Minimal explanation. Focus on fast understanding and quick recall.",
        "detailed": "Provide full explanations with examples. Cover the topic comprehensively with clear structure, concepts, and examples.",
        "exam_focused": "Focus on important concepts likely to appear in exams, key formulas, common question patterns, likely questions, and flashcard-style points.",
    }
    type_text = type_guidance.get(note_type, type_guidance["detailed"])
    return f"""Generate structured study notes for:
Subject: {subject}
Topic: {chapter}

Note Type: {note_type.replace('_', ' ').title()}
\u2192 {type_text}

Remember: key_points section is MANDATORY with at least 5 bullet points."""


async def generate_notes_with_ai(subject: str, chapter: str, note_type: str = "detailed") -> NoteContent:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=NOTES_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(text=build_notes_user_prompt(subject, chapter, note_type))
    response = await chat.send_message(user_message)
    logger.info(f"AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        content = NoteContent(**parsed)

        # Enforce 1800 word limit on main_content
        total_words = 0
        trimmed_sections = []
        for section in content.main_content:
            section_words = sum(len(p.split()) for p in section.points)
            section_words += len(section.heading.split())
            if total_words + section_words > 1800:
                remaining = 1800 - total_words
                if remaining > 20:
                    trimmed_points = []
                    for p in section.points:
                        pw = len(p.split())
                        if total_words + pw <= 1800:
                            trimmed_points.append(p)
                            total_words += pw
                        else:
                            break
                    if trimmed_points:
                        section.points = trimmed_points
                        trimmed_sections.append(section)
                break
            total_words += section_words
            trimmed_sections.append(section)
        content.main_content = trimmed_sections
        return content
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Raw response: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


# ========================
# PLANNER AI
# ========================

PLANNER_SYSTEM_PROMPT = """You are a study planner assistant. When given a topic, hours per day, and number of days, create a detailed day-by-day study plan. Return ONLY valid JSON in this format:
{
  "days": [
    {
      "day": 1,
      "topic": "Subtopic or focus area for this day",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "duration_hours": 2.0,
      "goal": "Clear one-line goal for the day"
    }
  ]
}

Rules:
- Each day must have a clear goal (one sentence describing the day's objective)
- Each day should have 2-4 specific tasks
- Tasks should be actionable (Read, Practice, Solve, Review, Summarize)
- duration_hours per day should roughly match the hours_per_day requested
- Progress logically from basics to advanced topics
- Include review/revision days
- Keep language simple and motivating
- Return ONLY valid JSON, no markdown code blocks"""


async def generate_planner_with_ai(topic: str, hours_per_day: float, num_days: int) -> List[PlannerDay]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=PLANNER_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=f"Create a {num_days}-day study plan for:\nTopic: {topic}\nHours per day: {hours_per_day}"
    )
    response = await chat.send_message(user_message)
    logger.info(f"Planner AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [PlannerDay(**d) for d in parsed["days"]]
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse planner response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


def format_plan_plain_text(days: List[PlannerDay]) -> str:
    lines = []
    for day in days:
        lines.append(f"=== Day {day.day} ===")
        lines.append(f"Topic: {day.topic}")
        lines.append(f"Time: {day.duration_hours} hrs")
        lines.append("")
        lines.append("Tasks:")
        for task in day.tasks:
            lines.append(f"* {task}")
        lines.append("")
        lines.append(f"Goal: {day.goal}")
        lines.append("")
    return "\n".join(lines).strip()


# ========================
# PRACTICE TEST AI
# ========================

PRACTICE_SYSTEM_PROMPT = """You are a test generator for students. Generate questions of the specified types. Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "id": "q1",
      "question_type": "mcq",
      "topic": "Specific sub-topic being tested",
      "difficulty": "easy",
      "marks": 1,
      "question": "What is ...?",
      "options": [
        {"label": "A", "text": "Option text"},
        {"label": "B", "text": "Option text"},
        {"label": "C", "text": "Option text"},
        {"label": "D", "text": "Option text"}
      ],
      "correct_answer": "A",
      "explanation": "Brief explanation",
      "key_points": ["Important concept 1", "Important concept 2"]
    },
    {
      "id": "q2",
      "question_type": "true_false",
      "topic": "Specific sub-topic being tested",
      "difficulty": "medium",
      "marks": 1,
      "question": "Statement to evaluate as true or false",
      "options": [],
      "correct_answer": "True",
      "explanation": "Brief explanation",
      "key_points": ["Key concept 1", "Key concept 2"]
    },
    {
      "id": "q3",
      "question_type": "numerical",
      "topic": "Specific sub-topic being tested",
      "difficulty": "hard",
      "marks": 1,
      "question": "Calculate the value of ...",
      "options": [],
      "correct_answer": "42",
      "explanation": "Step-by-step solution",
      "key_points": ["Formula used", "Key step"]
    },
    {
      "id": "q4",
      "question_type": "short_answer",
      "topic": "Specific sub-topic being tested",
      "difficulty": "medium",
      "marks": 2,
      "question": "Briefly explain ...",
      "options": [],
      "correct_answer": "",
      "model_answer": "A concise 2-3 sentence answer",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "id": "q5",
      "question_type": "long_answer",
      "topic": "Specific sub-topic being tested",
      "difficulty": "hard",
      "marks": 4,
      "question": "Discuss in detail ...",
      "options": [],
      "correct_answer": "",
      "model_answer": "A detailed model answer covering all aspects",
      "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
    }
  ]
}

Rules:
- Each question MUST have a unique "id" (q1, q2, q3...)
- Each question MUST have a "topic" field with the specific sub-topic being tested
- Each question MUST have a "difficulty" field: "easy", "medium", or "hard" (vary across questions)
- Each question MUST have a "marks" field: 1 for mcq/true_false/numerical, 2 for short_answer, 4 for long_answer
- Each question MUST have a non-empty "key_points" array with at least 2 items
- question_type must be one of: mcq, true_false, numerical, short_answer, long_answer
- MCQ: exactly 4 options (A,B,C,D), correct_answer is A/B/C/D
- True/False: correct_answer is "True" or "False", options array empty
- Numerical: correct_answer is the numeric answer as string, options array empty
- Short Answer: provide model_answer (2-3 sentences) and 3+ key_points, correct_answer empty
- Long Answer: provide model_answer (detailed) and 4+ key_points, correct_answer empty
- All types must include explanation
- Questions should test understanding, not just memorization
- Return ONLY valid JSON, no markdown code blocks"""


def build_practice_prompt(subject: str, chapter: str, num_questions: int, question_type: str, difficulty: str = "mixed") -> str:
    diff_instruction = ""
    if difficulty in ("easy", "medium", "hard"):
        diff_instruction = f'\nDifficulty: ALL questions must be "{difficulty}" difficulty level.'
    else:
        diff_instruction = "\nDifficulty: Vary difficulty across easy, medium, and hard."

    if question_type == "mixed":
        mcq_count = max(1, round(num_questions * 0.4))
        tf_count = max(1, round(num_questions * 0.2))
        num_count = max(1, round(num_questions * 0.2))
        sa_count = num_questions - mcq_count - tf_count - num_count
        if sa_count < 1:
            sa_count = 1
            mcq_count = num_questions - tf_count - num_count - sa_count
        return (
            f"Generate exactly {num_questions} practice questions for:\n"
            f"Subject: {subject}\nChapter: {chapter}\n{diff_instruction}\n\n"
            f"Distribution:\n"
            f"- {mcq_count} MCQ questions (question_type: mcq)\n"
            f"- {tf_count} True/False questions (question_type: true_false)\n"
            f"- {num_count} Numerical questions (question_type: numerical)\n"
            f"- {sa_count} Short Answer questions (question_type: short_answer)"
        )

    type_map = {
        "mcq": "MCQ (multiple choice with 4 options)",
        "true_false": "True/False",
        "numerical": "Numerical (integer answer)",
        "short_answer": "Short Answer (2-3 sentence response)",
        "long_answer": "Long Answer (detailed response)",
    }
    type_label = type_map.get(question_type, question_type)
    return (
        f"Generate exactly {num_questions} {type_label} questions for:\n"
        f"Subject: {subject}\nChapter: {chapter}\n{diff_instruction}\n\n"
        f'All questions must have question_type: "{question_type}"'
    )


async def generate_practice_with_ai(subject: str, chapter: str, num_questions: int, question_type: str = "mixed", difficulty: str = "mixed") -> List[BaseQuestion]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=PRACTICE_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(
        text=build_practice_prompt(subject, chapter, num_questions, question_type, difficulty)
    )
    response = await chat.send_message(user_message)
    logger.info(f"Practice AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        questions = []
        for i, q in enumerate(parsed["questions"]):
            if not q.get("id"):
                q["id"] = f"q{i + 1}"
            if not q.get("topic"):
                q["topic"] = chapter
            if q.get("difficulty") not in ("easy", "medium", "hard"):
                q["difficulty"] = "medium"
            if not isinstance(q.get("marks"), int) or q["marks"] < 1:
                marks_map = {"short_answer": 2, "long_answer": 4}
                q["marks"] = marks_map.get(q.get("question_type", ""), 1)
            if not q.get("key_points"):
                q["key_points"] = [f"Key concept from: {q.get('question', '')[:60]}"]
            questions.append(BaseQuestion(**q))
        return questions
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse practice response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


# ========================
# EXAM PLANNER AI
# ========================

EXAM_PLANNER_SYSTEM_PROMPT = """You are an exam preparation planner. Given a subject, list of topics, number of days until the exam, and study hours per day, create a detailed day-by-day exam preparation schedule.

Return ONLY valid JSON in this format:
{
  "days": [
    {
      "day": 1,
      "topics": ["Topic A - Subtopic"],
      "tasks": ["Read chapter X", "Solve 10 problems on Y", "Make summary notes"],
      "duration_hours": 3.0,
      "priority": "high"
    }
  ]
}

Rules:
- Distribute ALL provided topics across the available days
- Earlier days: focus on learning new topics (priority: "high" or "medium")
- Middle days: practice and problem-solving (priority: "medium")
- Final 20-30% of days: dedicated to revision and mock tests (priority: "high")
- Each day should have 2-5 actionable tasks
- duration_hours per day should match the hours_per_day requested
- priority must be one of: "high", "medium", "low"
- Heavier/harder topics should get more days
- Include at least 1-2 full revision days near the end
- Keep tasks actionable: Read, Practice, Solve, Memorize, Revise, Test
- Return ONLY valid JSON, no markdown code blocks"""


async def generate_exam_plan_with_ai(subject: str, topics: List[str], days_until_exam: int, hours_per_day: float) -> List[ExamPlanDay]:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=EXAM_PLANNER_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    topics_str = "\n".join(f"- {t}" for t in topics)
    user_message = UserMessage(
        text=f"Create an exam preparation schedule:\nSubject: {subject}\nTopics to cover:\n{topics_str}\nDays until exam: {days_until_exam}\nStudy hours per day: {hours_per_day}"
    )
    response = await chat.send_message(user_message)
    logger.info(f"Exam Planner AI Response: {response[:200]}...")

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [ExamPlanDay(**d) for d in parsed["days"]]
    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"Failed to parse exam planner response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


# ========================
# RECOMMENDATIONS AI
# ========================

async def generate_recommendations(context: str) -> list:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        return []

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message='You are a study coach. Given study analytics, generate 3-5 concise, actionable study recommendations. Return ONLY valid JSON: {"recommendations": [{"type": "weakness|strength|reminder|motivation", "title": "Short title", "message": "Actionable advice in 1-2 sentences"}]}. Types: weakness=low scores, strength=high scores, reminder=not studied recently, motivation=streak/consistency.',
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        response = await chat.send_message(UserMessage(text=f"Generate study recommendations based on this data:\n{context}"))
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return parsed.get("recommendations", [])
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        return []


# ========================
# FLASHCARDS AI
# ========================

async def generate_flashcards_ai(subject: str, chapter: str, content_summary: str) -> list:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        return []

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message='Generate flashcards from study notes. Return ONLY valid JSON: {"cards": [{"front": "question", "back": "answer"}]}. Generate 5-10 cards.',
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        resp = await chat.send_message(UserMessage(text=f"Generate flashcards from these notes:\n{content_summary}"))
        cleaned = resp.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        return [{"id": f"fc-ai-{i+1}", "front": c["front"], "back": c["back"]} for i, c in enumerate(parsed.get("cards", []))]
    except Exception:
        return []
