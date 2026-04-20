# StudyForge — PRD

## Original Problem Statement
AI-powered study assistant with Notes Generator, Study Planner, Practice Tests, Analytics Dashboard, Goals Tracker, Pomodoro Timer, and JWT authentication.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + emergentintegrations (Claude Sonnet 4.5) + slowapi (rate limiting) + bcrypt/PyJWT (auth)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **Database**: MongoDB (collections: users, study_notes, study_plans, practice_tests, exam_plans, quiz_scores, goals, pomodoro_sessions, login_attempts)
- **AI**: Claude Sonnet 4.5 via EMERGENT_LLM_KEY
- **Auth**: JWT httpOnly cookies, brute force protection, admin seeding

## Routing
- `/login` — Login page (public)
- `/register` — Register page (public)
- `/` — Home/Landing Page (protected)
- `/notes` — Notes Generator (protected)
- `/planner` — Study Planner (protected)
- `/practice` — Practice Tests with difficulty (protected)
- `/goals` — Study Goals tracker (protected)
- `/pomodoro` — Pomodoro Timer (protected)
- `/history` — Unified History (protected)
- `/analytics` — Analytics Dashboard (protected)
- `/shared/:shareId` — Public shared note view

## Completed Features
- [x] JWT Auth (login/register/logout/refresh, brute force protection)
- [x] AI Notes Generator (3 types, edit, tags, share, flashcards, print, PDF/text export)
- [x] Study Planner + Exam Planner (Notion-ready copy)
- [x] Practice Tests (MCQ/T-F/Numerical/Short/Long, difficulty selector, score tracking)
- [x] Study Goals & Progress Tracker (CRUD, progress bars, +1 increment)
- [x] Pomodoro Timer (circular display, session logging, today's stats)
- [x] Analytics Dashboard (stats, streaks, heatmap, quiz accuracy, AI recommendations, export)
- [x] Unified History with filters
- [x] Bookmarks & Confidence Ratings
- [x] Bulk Operations (multi-select, bulk delete, bulk tag)
- [x] API Rate Limiting (10/min on AI endpoints)
- [x] Data Migration (existing data -> admin user)
- [x] ConfirmDialog on deletes

## Admin Credentials
- Email: admin@studyforge.com
- Password: admin123
