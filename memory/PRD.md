# StudyForge — PRD

## Original Problem Statement
Build a study assistant that generates structured study notes based on Subject and Chapter input. AI-powered via Claude Sonnet 4.5. Features: Notes Generator with difficulty/type controls, Study Planner, Exam Preparation Planner, Practice Tests (multi-type), Unified History, PDF/Text export, dark/light themes, Analytics Dashboard, and more.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + emergentintegrations (Claude Sonnet 4.5)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **Database**: MongoDB (collections: study_notes, study_plans, practice_tests, exam_plans, quiz_scores)
- **AI**: Claude Sonnet 4.5 via EMERGENT_LLM_KEY (Emergent Universal Key)
- **Webhook**: External n8n webhook integration (async POST on every generation)

## User Personas
- Students preparing for exams who need structured revision notes
- Teachers creating quick chapter summaries
- Self-learners exploring new subjects

## What's Been Implemented

### Core Features
- **Home Screen Landing Page** — Hero section with streak badge, Feature Cards (Notes/Planner/Quiz/History), "How It Works" 3-step guide, Final CTA, Footer
- **Enhanced Notes Generator** — Subject, Topic, Note Type (Quick Revision/Detailed/Exam-Focused). Inline editing of subject/chapter, tags, share via link, flashcards, print, PDF/text export
- **Personalized Study Planner** — Topic, hours/day, duration -> AI-generated day-by-day plan with Notion-ready copy
- **Exam Preparation Planner** — Subject, Topics (multi), Exam Date, Hours/Day -> day-wise schedule with priorities
- **Practice Tests** — Subject, Chapter, Question Type (MCQ/T-F/Numerical/Short/Long/Mixed), Difficulty (Easy/Medium/Hard/Mixed), # Questions -> Interactive quiz with scoring, difficulty badges, explanations
- **Unified History** — Aggregated timeline with filter tabs, expandable details, delete
- **Study Analytics Dashboard** — Stat cards, subject breakdown, note types, 30-day activity timeline, study streaks (heatmap), quiz performance (accuracy gauge, subject accuracy, score trend), AI recommendations, export report
- **Bulk Operations** — Multi-select notes in sidebar, bulk delete, bulk tag
- **Flashcard Viewer** — Auto-generated from note content, flip animation, prev/next navigation
- **Share via Link** — Public /shared/:shareId pages for notes
- **Print Layout** — Clean print-friendly window

### Routing
- `/` — Home/Landing Page (minimal header, streak badge)
- `/notes` — Notes Generator with sidebar (search, bulk ops)
- `/planner` — Study Planner
- `/practice` — Practice Tests with difficulty selector
- `/history` — Unified History
- `/analytics` — Analytics Dashboard with AI recommendations
- `/shared/:shareId` — Public shared note view

### Navigation
- Landing page: minimal header (logo + theme toggle only)
- Feature pages: full navbar (Notes, Planner, Practice, History, Analytics) with staggered animation
- Logo always navigates to home

## API Endpoints
### Notes
- `POST /api/notes/generate` — Generate notes (subject, chapter, note_type)
- `GET /api/notes` — List all notes
- `GET /api/notes/search?q=` — Search notes by subject/chapter/note_type
- `GET /api/notes/{id}` — Get single note
- `PUT /api/notes/{id}` — Update note (subject, chapter, note_type, content, tags)
- `DELETE /api/notes/{id}` — Delete note
- `POST /api/notes/{id}/share` — Generate share link (idempotent)
- `POST /api/notes/{id}/flashcards` — Generate flashcards from note content
- `GET /api/shared/{shareId}` — Get shared note (public)
- `GET /api/tags` — List all unique tags

### Planner
- `POST /api/planner/generate` — Generate study plan
- `GET /api/planners` — List plans
- `DELETE /api/planners/{id}` — Delete plan

### Exam Planner
- `POST /api/planner/exam/generate` — Generate exam prep plan
- `GET /api/exam-planners` — List exam plans
- `DELETE /api/exam-planners/{id}` — Delete exam plan

### Practice
- `POST /api/practice/generate` — Generate practice test (subject, chapter, num_questions, question_type, difficulty)
- `GET /api/practices` — List tests
- `DELETE /api/practices/{id}` — Delete test

### Quiz Scores
- `POST /api/quiz-scores` — Save quiz score (auto on submit)
- `GET /api/quiz-scores` — List all scores

### History & Analytics
- `GET /api/history` — Unified history (?item_type= filter)
- `DELETE /api/history/{type}/{id}` — Delete history item
- `GET /api/analytics` — Full analytics (totals, subjects, note types, activity, streaks, quiz scores)
- `GET /api/analytics/export` — Download text report
- `GET /api/analytics/recommendations` — AI-powered study recommendations

## DB Schema
- `study_notes`: {id, subject, chapter, note_type, content{title, introduction, main_content[], examples[], key_points[], summary}, tags[], share_id, created_at}
- `study_plans`: {id, topic, hours_per_day, num_days, days[], plain_text, created_at}
- `exam_plans`: {id, subject, topics[], exam_date, hours_per_day, days_until_exam, days[], created_at}
- `practice_tests`: {id, subject, chapter, num_questions, question_type, questions[{id, question_type, topic, difficulty, marks, question, options[], correct_answer, explanation, key_points[], model_answer}], created_at}
- `quiz_scores`: {id, test_id, subject, chapter, total_gradable, correct, total_subjective, attempted_subjective, score_pct, created_at}

## Completed Backlog
### P0 (Critical) — All Done
- [x] AI note generation with Note Type controls
- [x] Structured output (Title, Intro, Main Content, Examples, Key Points, Summary)
- [x] Note saving/history with metadata
- [x] Export (PDF/Text)
- [x] Theme toggle (dark/light)
- [x] Personalized Study Planner
- [x] Practice Tests (multi-type: MCQ, T/F, Numerical, Short, Long)
- [x] Unified History
- [x] Exam Preparation Planner
- [x] Home Screen Landing Page
- [x] Navigation Refinement (minimal landing header, full app nav)

### P1 (Important) — All Done
- [x] Study Analytics Dashboard
- [x] Search/filter saved notes
- [x] Edit existing notes (inline)

### P2 (Nice to Have) — All Done
- [x] Print-optimized layout
- [x] Share notes via link
- [x] Flashcard generation
- [x] Tag organization
- [x] Quiz score tracking in Analytics
- [x] Study streak tracking with heatmap
- [x] Export analytics as report

### In Progress
- [ ] Bulk operations on notes (multi-select, bulk delete, bulk tag) — Frontend done, pending test
- [ ] AI-powered study recommendations — Backend done, pending test
- [ ] Difficulty selector in Practice Tests (Easy/Medium/Hard/Mixed) — Backend+Frontend done, pending test

### Future Ideas
- Spaced repetition for flashcards
- Study goals / weekly targets
- Advanced tag filtering across all views
