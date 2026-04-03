# StudyForge — PRD

## Original Problem Statement
Build a study assistant that generates structured study notes based on Subject and Chapter input. Notes follow a specific format: Key Concepts (5-7 points), Important Formulas, Explanation (max 150 words), Quick Revision (5 points). AI-powered via Claude Sonnet 4.5. Save & history, export (PDF/text), customizable themes.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Claude Sonnet 4.5)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **Database**: MongoDB (collections: study_notes, study_plans, practice_tests, exam_plans)
- **AI**: Claude Sonnet 4.5 via EMERGENT_LLM_KEY

## User Personas
- Students preparing for exams who need structured revision notes
- Teachers creating quick chapter summaries
- Self-learners exploring new subjects

## Core Requirements
- AI-powered structured note generation (Subject + Chapter → Notes)
- Save notes to database with history
- Export notes as PDF and Text
- Light/Dark theme toggle with persistence
- Responsive design
- Personalized Study Planner
- Practice Tests (MCQs) with interactive quiz
- Exam Preparation Planner with date-based scheduling
- Unified History page

## What's Been Implemented (Feb 2026)
- Full-stack app with FastAPI backend and React frontend
- AI note generation using Claude Sonnet 4.5
- MongoDB persistence for all generated content
- Bento grid "Control Room" Swiss design for note display
- History sidebar with select/delete functionality
- PDF and Text export functionality
- Light/Dark theme toggle with localStorage persistence
- Personalized Study Planner (topic + hours/day + num days)
- Practice Test MCQs with interactive quiz, scoring, and explanations
- Navigation between Notes, Planner, Practice pages
- **Unified History Page** — aggregates all activity (notes, plans, practice tests, exam plans) with filter tabs
- **Exam Preparation Planner** — Subject, Topics (multi-add/remove), Exam Date (Calendar picker), Study Hours/Day → AI-generated day-wise schedule with priorities (high/medium/low), date labels, topic distribution, revision days

### Code Quality Improvements (Feb 2026)
- Fixed all critical hook dependency warnings
- Removed all console.error statements from production code
- Replaced array index keys with stable unique identifiers
- Extracted nested ternary expressions into helper functions
- Broke high-complexity components into smaller sub-components

## API Endpoints
- `POST /api/notes/generate` — Generate study notes
- `GET /api/notes` — List all notes
- `DELETE /api/notes/{id}` — Delete a note
- `POST /api/planner/generate` — Generate regular study plan
- `GET /api/planners` — List all study plans
- `DELETE /api/planners/{id}` — Delete a plan
- `POST /api/planner/exam/generate` — Generate exam preparation plan
- `GET /api/exam-planners` — List all exam plans
- `DELETE /api/exam-planners/{id}` — Delete an exam plan
- `POST /api/practice/generate` — Generate practice test
- `GET /api/practices` — List all practice tests
- `DELETE /api/practices/{id}` — Delete a test
- `GET /api/history` — Unified history (supports ?item_type= filter)
- `DELETE /api/history/{type}/{id}` — Delete history item

## DB Schema
- `study_notes`: {id, subject, chapter, content{key_concepts, formulas, explanation, quick_revision}, created_at}
- `study_plans`: {id, topic, hours_per_day, num_days, days[{day, topic, tasks, duration_hours}], created_at}
- `exam_plans`: {id, subject, topics[], exam_date, hours_per_day, days_until_exam, days[{day, date, topics, tasks, duration_hours, priority}], created_at}
- `practice_tests`: {id, subject, chapter, num_questions, questions[{question, options, correct_answer, explanation}], created_at}

## Prioritized Backlog
### P0 (Critical) — Done
- [x] AI note generation
- [x] Note saving/history
- [x] Export (PDF/Text)
- [x] Theme toggle
- [x] Personalized Study Planner
- [x] Practice Tests (MCQs)
- [x] Unified History
- [x] Exam Preparation Planner

### P1 (Important)
- [ ] Study Analytics Dashboard (study time, notes generated, quiz accuracy)
- [ ] Search/filter saved notes
- [ ] Edit existing notes

### P2 (Nice to Have)
- [ ] Print-optimized layout
- [ ] Share notes via link
- [ ] Flashcard generation from notes
- [ ] Folder/tag organization
