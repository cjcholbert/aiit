# Ralph: AI Manager Skills — Educational Review Improvements

Read /root/ClaudeProjects/skills/claude-code-ralph-skill/SKILL.md first.
Then read RALPH_PLAN.md in the project root to see current progress.
Continue from where you left off.

## Context
You are improving the AI Manager Skills platform — a 12-lesson interactive web application teaching everyday workers to collaborate effectively with AI. All 12 lessons are fully implemented and functional.

Four educational reviews identified prioritized improvements:
- `EDUCATIONAL_REVIEW.md` — Overall B+ assessment with strategic gaps
- `review_curriculum_findings.md` — Curriculum design findings
- `review_exercise_findings.md` — Exercise quality findings
- `review_ux_findings.md` — UX/learning experience findings

## Tech Stack
- **Backend:** FastAPI + SQLAlchemy async + PostgreSQL
- **Frontend:** React (Vite) with JSX components
- **AI:** Anthropic Claude via shared service
- **Theme:** Dark theme (GitHub-dark palette)
- **Styling:** External CSS only (no inline styles)

## Key Files
- Frontend pages: `frontend/src/pages/Lesson01.jsx` through `Lesson12.jsx`
- Frontend components: `frontend/src/components/`
- Backend modules: `backend/modules/lesson01_context/` through `lesson12_reference/`
- Backend AI service: `backend/services/anthropic_client.py`
- Database models: `backend/database/models.py`
- Main app: `backend/main.py`
- CSS: `frontend/src/styles/`

## Team Agents
Work is divided among 3 specialist agents:
1. **foundation-agent**: Quick wins — L1 Learn tab, terminology, prev/next nav, Dashboard guidance, connection callouts
2. **assessment-agent**: Assessment & progress — self-assessment checklists, completion tracking, celebrations
3. **ai-integration-agent**: AI gaps — L7/L9/L11 AI feedback, L12 capstone strengthening

## Critical Rules
- All stylesheets MUST be external CSS — no inline styles
- Never break existing functionality
- Follow existing code patterns in the codebase
- Git commit after each completed checkpoint
- Update RALPH_PLAN.md after each checkpoint

## Completion Criteria
All items in RALPH_PLAN.md "Completion Criteria" section must be verified.
Output `<ralph:complete>` only after ALL criteria are verified with evidence.

## If Stuck
After 5 attempts on any issue: document blocker in RALPH_PLAN.md, move to next checkpoint.
