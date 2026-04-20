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
- **Home Screen Landing Page** — Hero section, Feature Cards (Notes/Planner/Quiz/History), "How It Works" 3-step guide, Final CTA, Footer. Fully styled with Premium Neon design system.
- **Enhanced Notes Generator** — Subject, Topic, Note Type (Quick Revision/Detailed/Exam-Focused). Output: Title, Introduction, Main Content (sectioned headings+bullets), Examples, Key Points (5-10 mandatory), Summary
- **Personalized Study Planner** — Topic, hours/day, duration → AI-generated day-by-day plan
- **Exam Preparation Planner** — Subject, Topics (multi), Exam Date (Calendar picker), Hours/Day → AI-generated day-wise schedule with priorities (high/medium/low)
- **Practice Tests (MCQs)** — Subject, Chapter, # Questions → Interactive quiz with scoring & explanations
- **Unified History** — Aggregated timeline with filter tabs (All/Notes/Plans/Exam Prep/Quizzes), expandable details, delete
- **Export** — PDF and Text for notes
- **Neon-inspired UI** — CSS variable-based theming with cyan/purple neon accents (dark: vivid glows; light: muted tones), glass header, hover glow transitions

### Routing
- `/` — Home/Landing Page
- `/notes` — Notes Generator (extracted from old HomePage)
- `/planner` — Study Planner
- `/practice` — Practice Tests
- `/history` — Unified History

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
- [x] Home Screen Landing Page (Hero, Features, How It Works, CTA) — Feb 2026
- [x] Navigation Refinement: Minimal header on landing, full nav on feature pages, logo-based home navigation — Feb 2026

### P1 (Important)
- [x] Study Analytics Dashboard (totals, subject breakdown, note types, activity timeline) — Feb 2026
- [x] Search/filter saved notes (sidebar search by subject/topic/type) — Feb 2026
- [x] Edit existing notes (inline editing of subject/chapter via click-to-edit) — Feb 2026

### P2 (Nice to Have)
- [x] Print-optimized layout (opens clean print window with formatted HTML) — Feb 2026
- [x] Share notes via link (generates shareable URL, /shared/:shareId public page) — Feb 2026
- [x] Flashcard generation from notes (auto-generates from key_points & content sections, flip animation viewer) — Feb 2026
- [x] Folder/tag organization (add/remove tags on notes, GET /api/tags for all tags) — Feb 2026
- [x] Quiz score tracking in Analytics (accuracy gauge, best/worst subjects, score trends) — Feb 2026
- [x] Study streak tracking (current/longest streak, weekly heatmap, home page badge) — Feb 2026
- [x] Export analytics as report (downloadable .txt with full study stats) — Feb 2026
