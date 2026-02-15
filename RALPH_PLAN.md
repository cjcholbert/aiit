# Ralph Task Plan: AI Manager Skills — Educational Review Improvements

## Objective

Implement prioritized improvements from the Educational Review, Curriculum Review, Exercise Review, and UX Review to elevate the platform from a "professional toolbox" to a "guided learning experience."

## Source Documents
- `EDUCATIONAL_REVIEW.md` — Comprehensive review (B+ overall)
- `review_curriculum_findings.md` — Curriculum design findings
- `review_exercise_findings.md` — Exercise & practice findings
- `review_ux_findings.md` — UX & learning experience findings

## Overall Grade Targets
- Assessment: D → B (add self-assessment checklists + completion tracking)
- Motivation Design: C → B (add celebrations + progress visibility)
- Feedback Mechanisms: B- → B+ (add AI feedback to L7, L9, L11)
- Learner Experience: B- → B+ (add onboarding + progress tracking)

---

## Completion Criteria

- [ ] Lesson 1 has a Learn tab with instructional content
- [ ] All 12 lessons use "Lesson" terminology (no "week" references)
- [ ] Previous/Next navigation exists at bottom of every lesson
- [ ] Dashboard has "Start Here" guidance for new users
- [ ] Every lesson has a self-assessment checklist (modeled on L5)
- [ ] Basic lesson completion tracking with Dashboard indicators
- [ ] Lesson 7 has AI-powered task categorization feedback
- [ ] Lesson 9 has AI-powered iteration quality feedback (using L2 principles)
- [ ] Lesson 11 has AI-powered frontier pattern analysis
- [ ] Celebration/milestone messages appear on key achievements
- [ ] Lesson 12 strengthened with integrative capstone exercise
- [ ] Frontend builds without errors: `cd frontend && npm run build`
- [ ] Backend starts without errors: `cd backend && python -c "from main import app"`
- [ ] All existing functionality preserved (no regressions)

---

## Phase 1: Quick Wins (High Impact, Low Effort)

### Checkpoint 1: Add Learn Tab to Lesson 1
**Priority:** CRITICAL — First impression fix
**Agent:** foundation-agent

Tasks:
- [ ] Create Learn tab content for Lesson01.jsx explaining:
  - What "context" means in AI interactions
  - Why context gaps lead to generic/unhelpful AI responses
  - Examples of good vs. poor context (similar to L2's vague vs. specific pattern)
  - The context gap patterns the Analyze tab will help identify
  - 3 concrete before/after examples showing context impact
- [ ] Make Learn the first/default tab
- [ ] Maintain existing Analyze and History tabs unchanged

Verify: `cd frontend && npm run build` succeeds, Lesson 1 loads with Learn tab

---

### Checkpoint 2: Fix Terminology Inconsistencies
**Priority:** HIGH — Reduces learner confusion
**Agent:** foundation-agent

Tasks:
- [ ] Search all frontend files for "week" references → replace with "lesson"
- [ ] Search all backend files for "Week" in comments → update
- [ ] Fix Lesson 6 reference to "Module 3" → should reference "Lesson 5"
- [ ] Fix Lesson 12 "12-week journey" → "12-lesson curriculum"
- [ ] Fix database model comments using "Week" numbers
- [ ] Standardize: "Lesson" = individual unit, "Module" = group of lessons
- [ ] Verify no user-facing strings say "week" or "session" when meaning "lesson"

Verify: `grep -ri "week" frontend/src/pages/ --include="*.jsx"` shows no "week" used as lesson synonym

---

### Checkpoint 3: Add Previous/Next Lesson Navigation
**Priority:** HIGH — Creates journey flow
**Agent:** foundation-agent

Tasks:
- [ ] Create a reusable `LessonNav` component with Previous/Next links
- [ ] Place at bottom of every lesson page (Lesson01-Lesson12)
- [ ] Style consistently with existing dark theme
- [ ] Previous button hidden on Lesson 1, Next hidden on Lesson 12
- [ ] Links include lesson number and title

Verify: Navigate between lessons using bottom nav, all 12 lessons have it

---

### Checkpoint 4: Dashboard "Start Here" Guidance
**Priority:** HIGH — Improves first-time experience
**Agent:** foundation-agent

Tasks:
- [ ] Add a conditional "Start Here" banner at top of Dashboard
- [ ] Show only when user has no activity data (new user)
- [ ] Banner highlights Lesson 1 with welcoming text
- [ ] Brief explanation: 12 lessons, 4 modules, start with Lesson 1
- [ ] Dismissable (persists dismissal in localStorage)
- [ ] After dismissal, show "Continue where you left off" with last-visited lesson

Verify: New user sees welcome banner, returning user sees continue prompt

---

## Phase 2: Assessment & Progress (High Impact, Medium Effort)

### Checkpoint 5: Self-Assessment Checklists for All Lessons
**Priority:** HIGH — First step toward embedded assessment
**Agent:** assessment-agent

Model on Lesson 5's End-of-Week Progress Checklist pattern.

Tasks:
- [ ] Define 3-5 auto-checking criteria per lesson:
  - L1: Analyzed 1+ conversation, identified 1+ pattern, reviewed coaching
  - L2: Analyzed 3+ entries, rewrote 1+ vague feedback, checked all 5 patterns
  - L3: Created 1+ template, tested 1+ template, used variables
  - L4: Created 1+ context doc, completed 1+ session, generated context prompt
  - L5: (already has checklist — enhance if needed)
  - L6: Created 1+ checklist, completed 1+ practice session, tracked issues
  - L7: Decomposed 1+ project, used all 3 categories, added reasoning
  - L8: Created 1+ delegation, received output, completed review
  - L9: Created 1+ iteration task, completed all 3 passes, wrote transition feedback
  - L10: Designed 1+ workflow, executed 1+ run, tracked time savings
  - L11: Mapped 1+ zone, logged 1+ encounter, reviewed stats
  - L12: Generated reference card, reviewed progress, exported card
- [ ] Create reusable `SelfAssessmentChecklist` component
- [ ] Add checklist to a visible location in each lesson (bottom of main tab or dedicated section)
- [ ] Checklists auto-populate based on actual user data from APIs
- [ ] Green checkmarks for completed criteria, grey for incomplete

Verify: Each lesson shows its checklist, items auto-check based on real data

---

### Checkpoint 6: Lesson Completion Tracking
**Priority:** HIGH — Enables progress visibility
**Agent:** assessment-agent

Tasks:
- [ ] Define completion = all self-assessment criteria met (from CP5)
- [ ] Create backend endpoint: `GET /api/progress/summary` returning per-lesson completion status
- [ ] Add completion checkmarks to Dashboard lesson cards
- [ ] Add completion indicators to Sidebar lesson links (small dot or checkmark)
- [ ] Add overall progress percentage to Dashboard header
- [ ] Store completion state so it persists across sessions

Verify: Complete a lesson's criteria → checkmark appears on Dashboard and Sidebar

---

## Phase 3: AI Integration Gaps (High Impact, Medium Effort)

### Checkpoint 7: AI Feedback for Lesson 7 (Task Categorization)
**Priority:** HIGH — Biggest exercise quality gap
**Agent:** ai-integration-agent

Tasks:
- [ ] Create `backend/modules/lesson07_decomposer/analyzer.py`
- [ ] AI prompt evaluates user's task categorization decisions:
  - Is each task in the right category?
  - Are there borderline cases worth reconsidering?
  - Are dependencies reasonable?
  - Are decision gates placed appropriately?
- [ ] Add "Get AI Feedback" button to decomposition view
- [ ] Display AI suggestions as non-intrusive coaching (similar to L1's coaching)
- [ ] Add route: `POST /lesson7/decompositions/{id}/analyze`

Verify: Create a decomposition → click "Get AI Feedback" → receive categorization suggestions

---

### Checkpoint 8: AI Feedback for Lesson 9 (Iteration Quality)
**Priority:** HIGH — Most significant missed cross-lesson connection
**Agent:** ai-integration-agent

Tasks:
- [ ] Create `backend/modules/lesson09_iteration/analyzer.py`
- [ ] AI prompt evaluates iteration feedback quality using L2's principles:
  - Is the feedback specific (not vague)?
  - Does it include actionable suggestions?
  - Does it state reasons for changes?
  - Does it have appropriate scope?
- [ ] Reference L2's 5 vague patterns in the prompt
- [ ] Add "Check Feedback Quality" button on each pass
- [ ] Show quality score + specific suggestions for improvement
- [ ] Add route: `POST /lesson9/tasks/{id}/analyze-feedback`

Verify: Write iteration feedback → click analyze → get quality assessment referencing L2 criteria

---

### Checkpoint 9: AI Analysis for Lesson 11 (Frontier Patterns)
**Priority:** HIGH — A frontier lesson should use AI
**Agent:** ai-integration-agent

Tasks:
- [ ] Create `backend/modules/lesson11_frontier/analyzer.py`
- [ ] AI prompt analyzes user's encounter data to identify patterns:
  - Cluster failures by task type
  - Identify surprising capability boundaries
  - Suggest frontier areas worth testing
  - Compare encounter evidence against zone assessments
- [ ] Add "Analyze Patterns" button to Stats or Encounters tab
- [ ] Display pattern insights with evidence from user's own data
- [ ] Add route: `POST /lesson11/encounters/analyze`

Verify: Log 3+ encounters → click "Analyze Patterns" → receive frontier insights

---

## Phase 4: Engagement & Capstone (Medium Impact, Medium Effort)

### Checkpoint 10: Celebration & Milestone Messages
**Priority:** MEDIUM — Sustains engagement
**Agent:** assessment-agent

Tasks:
- [ ] Create `CelebrationToast` component for milestone messages
- [ ] Define milestone triggers:
  - First analysis completed (any lesson)
  - First lesson fully completed (all checklist items)
  - 3 lessons completed
  - 6 lessons completed (halfway)
  - All 12 lessons completed
  - 7-day learning streak
- [ ] Toast messages are encouraging but professional (not childish)
- [ ] Messages reference the specific skill learned
- [ ] Don't repeat — each celebration fires once

Verify: Complete first analysis → see celebration toast

---

### Checkpoint 11: Strengthen Lesson 12 Capstone
**Priority:** MEDIUM — Transforms weak capstone into culminating experience
**Agent:** ai-integration-agent

Tasks:
- [ ] Add an "Integration Challenge" tab to Lesson 12
- [ ] Present a realistic workplace scenario requiring all 6 concepts:
  - Context Assembly: What context would you provide?
  - Quality Judgment: How would you verify the output?
  - Task Decomposition: How would you break this down?
  - Iterative Refinement: What would your iteration plan be?
  - Workflow Integration: How would you make this repeatable?
  - Frontier Recognition: Where might AI struggle here?
- [ ] AI evaluates the learner's responses for completeness and quality
- [ ] Provide 2-3 scenario options (e.g., "Prepare quarterly report", "Onboard new team member", "Research competitor analysis")
- [ ] Keep existing Reference Card and Progress tabs
- [ ] Fix "12-week journey" → "12-lesson curriculum"

Verify: Complete integration challenge → receive AI evaluation covering all 6 concepts

---

### Checkpoint 12: Cross-Lesson Connection Callouts
**Priority:** MEDIUM — Creates interconnected learning
**Agent:** foundation-agent

Tasks:
- [ ] Add "Connection" callout boxes in Learn tabs where lessons connect:
  - L2 Learn: "In Lesson 1, you identified context gaps. Now learn to give feedback about those gaps."
  - L3 Learn: "Lesson 1 showed your context patterns. Now turn those insights into reusable templates."
  - L6 Learn: "Lesson 5 helped you calibrate trust. Now build checklists for the outputs you verified."
  - L8 Learn: "Lesson 7 decomposed your tasks. Now delegate the AI-optimal ones effectively."
  - L9 Learn: "Lesson 2 taught you specific feedback. Now apply those principles to iterate on AI outputs."
  - L11 Learn: "Lesson 5 tracked where AI succeeds and fails. Now map those into reliability zones."
- [ ] Style as distinct callout box (e.g., light blue background, link icon)
- [ ] Include link to referenced lesson

Verify: Open L2 Learn tab → see connection callout referencing L1

---

## Phase 5: Final Polish & Verification

### Checkpoint 13: Integration Testing
**Agent:** All agents

Tasks:
- [ ] Full frontend build: `cd frontend && npm run build`
- [ ] Backend import check: `cd backend && python -c "from main import app; print('OK')"`
- [ ] Manual smoke test: Navigate all 12 lessons, verify no regressions
- [ ] Verify all new features work together
- [ ] Git commit all changes

Verify: Build succeeds, all lessons load, no console errors

---

## Progress Log

| Iteration | Checkpoint | Status | Agent | Notes |
|-----------|------------|--------|-------|-------|
| 1         | Setup      | ⏳     | lead  | Creating plan and team |

## Current Status

- **Iteration:** 1
- **Phase:** Setup
- **Current Checkpoint:** Planning
- **Blockers:** None

## Blocked Issues

<!-- Document issues that couldn't be resolved after 5 attempts -->
