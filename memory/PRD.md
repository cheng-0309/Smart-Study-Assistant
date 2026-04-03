# StudyForge — PRD

## Original Problem Statement
Build a study assistant that generates structured study notes based on Subject and Chapter input. AI-powered via Claude Sonnet 4.5. Features: Notes Generator with difficulty/type controls, Study Planner, Exam Preparation Planner, Practice Tests (MCQs), Unified History, PDF/Text export, dark/light themes.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Claude Sonnet 4.5)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **Database**: MongoDB (collections: study_notes, study_plans, practice_tests, exam_plans)
- **AI**: Claude Sonnet 4.5 via EMERGENT_LLM_KEY

## User Personas
- Students preparing for exams who need structured revision notes
- Teachers creating quick chapter summaries
- Self-learners exploring new subjects

## What's Been Implemented (Feb-Apr 2026)

### Core Features
- **Enhanced Notes Generator** — Subject, Topic, Note Type (Quick Revision/Detailed/Exam-Focused). Output: Title, Introduction, Main Content (sectioned headings+bullets), Examples, Key Points (5-10 mandatory), Summary
- **Personalized Study Planner** — Topic, hours/day, duration → AI-generated day-by-day plan
- **Exam Preparation Planner** — Subject, Topics (multi), Exam Date (Calendar picker), Hours/Day → AI-generated day-wise schedule with priorities (high/medium/low)
- **Practice Tests (MCQs)** — Subject, Chapter, # Questions → Interactive quiz with scoring & explanations
- **Unified History** — Aggregated timeline with filter tabs (All/Notes/Plans/Exam Prep/Quizzes), expandable details, delete
- **Export** — PDF and Text for notes
- **Themes** — Light/Dark toggle with localStorage persistence

### Technical Quality
- Backward-compatible note rendering (old notes with key_concepts still display)
- Form validation on all inputs
- Loading skeletons, toast notifications
- Component extraction for maintainability

## API Endpoints
- `POST /api/notes/generate` — Generate notes (subject, chapter, note_type)
- `GET /api/notes` — List all notes
- `DELETE /api/notes/{id}` — Delete a note
- `POST /api/planner/generate` — Generate regular study plan
- `GET /api/planners` — List plans
- `DELETE /api/planners/{id}` — Delete plan
- `POST /api/planner/exam/generate` — Generate exam preparation plan
- `GET /api/exam-planners` — List exam plans
- `DELETE /api/exam-planners/{id}` — Delete exam plan
- `POST /api/practice/generate` — Generate practice test
- `GET /api/practices` — List tests
- `DELETE /api/practices/{id}` — Delete test
- `GET /api/history` — Unified history (?item_type= filter)
- `DELETE /api/history/{type}/{id}` — Delete history item

## DB Schema
- `study_notes`: {id, subject, chapter, note_type, content{title, introduction, main_content[{heading, points}], examples[], key_points[], summary}, created_at}
- `study_plans`: {id, topic, hours_per_day, num_days, days[{day, topic, tasks, duration_hours}], created_at}
- `exam_plans`: {id, subject, topics[], exam_date, hours_per_day, days_until_exam, days[{day, date, topics, tasks, duration_hours, priority}], created_at}
- `practice_tests`: {id, subject, chapter, num_questions, questions[{question, options, correct_answer, explanation}], created_at}

## Prioritized Backlog
### P0 (Critical) — All Done
- [x] AI note generation with Note Type controls (Quick Revision/Detailed/Exam-Focused)
- [x] Structured output (Title, Intro, Main Content, Examples, Key Points, Summary)
- [x] Note saving/history with metadata
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
