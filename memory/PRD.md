# StudyForge — PRD

## Original Problem Statement
Build a study assistant that generates structured study notes based on Subject and Chapter input. Notes follow a specific format: Key Concepts (5-7 points), Important Formulas, Explanation (max 150 words), Quick Revision (5 points). AI-powered via Claude Sonnet 4.5. Save & history, export (PDF/text), customizable themes.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Claude Sonnet 4.5)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **Database**: MongoDB (collection: study_notes)
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

## What's Been Implemented (Feb 2026)
- Full-stack app with FastAPI backend and React frontend
- AI note generation using Claude Sonnet 4.5
- MongoDB persistence for all generated notes
- Bento grid "Control Room" Swiss design for note display
- History sidebar with select/delete functionality
- PDF and Text export functionality
- Light/Dark theme toggle with localStorage persistence
- Personalized Study Planner (topic + hours/day + num days)
- Practice Test MCQs with interactive quiz, scoring, and explanations
- Navigation between Notes, Planner, Practice pages
- **Unified History Page** — aggregates all activity (notes, plans, practice tests) in one timeline with filter tabs (All/Notes/Plans/Practice), expandable detail views, type badges, previews, and delete

### Code Quality Improvements (Feb 2026)
- Fixed all critical hook dependency warnings (useCallback → inline useEffect)
- Removed all console.error statements from production code
- Replaced array index keys with stable unique identifiers
- Extracted nested ternary expressions into helper functions (getOptionStyles, getOptionBorderStyle)
- Broke high-complexity components into smaller sub-components:
  - QuizView → QuizView + OptionButton + QuizNavigation
  - NoteDisplay → NoteTitle + KeyConceptsSection + FormulasSection + QuickRevisionSection
  - Header → Logo + NavBar + HeaderActions
  - SavedNotes → SavedNotes + NoteItem
  - exportAsPDF → writePDFHeading + writePDFBulletList + ensurePageSpace + downloadBlob

## Prioritized Backlog
### P0 (Critical) — Done
- [x] AI note generation
- [x] Note saving/history
- [x] Export (PDF/Text)
- [x] Theme toggle

### P1 (Important)
- [ ] Search/filter saved notes
- [ ] Edit existing notes
- [ ] Folder/tag organization

### P2 (Nice to Have)
- [ ] Print-optimized layout
- [ ] Share notes via link
- [ ] Multiple AI model selection
- [ ] Flashcard generation from notes
