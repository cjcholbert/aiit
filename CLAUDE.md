# AI Manager Skills - Project Context

## Target Audience

The AI Managerial Skills Project is **not meant for the Super User** but the **common worker** interested in increasing their ability to use AI more productively. The focus is on building systematic habits, not advanced technical skills.

## Project Origin

This project emerged from six core managerial concepts that define effective AI collaboration. Each concept became the foundation for a hands-on lesson, packaged as an interactive web application.

---

## The Six Managerial Concepts

### 1. Context Assembly
Knowing what information to provide, from what sources, and why

- Recognizing which background details are essential vs. noise for a given task
- Curating inputs from multiple sources (documents, data, prior conversations) into coherent prompts
- Understanding that AI lacks implicit knowledge humans take for granted—making the unstated explicit
- Matching context depth to task complexity (quick question vs. multi-step project)
- Developing reusable context templates for recurring task types
- Knowing when to front-load context vs. provide it incrementally

### 2. Quality Judgment
Knowing when to trust AI output and when to verify

- Calibrating confidence based on task type (factual lookup vs. creative generation vs. technical implementation)
- Recognizing patterns that signal AI uncertainty or confabulation
- Understanding domain-specific error rates—where AI excels vs. struggles
- Building verification workflows proportional to risk (low-stakes draft vs. production code)
- Distinguishing "looks right" from "is right"—resisting surface-level polish
- Knowing your own blind spots that might cause you to miss AI errors

### 3. Task Decomposition
Breaking work into AI-appropriate chunks

- Identifying which subtasks are well-suited for AI delegation vs. human judgment
- Sizing work units to fit within AI capabilities and context limits
- Sequencing dependent tasks to build on prior outputs
- Creating clear handoff points between AI work and human review
- Recognizing tasks that seem simple but contain hidden complexity
- Balancing granularity (too small = overhead, too large = quality degradation)

### 4. Iterative Refinement
Moving from 70% to 95% through structured feedback loops

- Accepting that first outputs are drafts, not finished products
- Providing specific, actionable feedback rather than vague dissatisfaction
- Knowing when to refine in-conversation vs. start fresh with better context
- Building checkpoints into longer workflows to catch drift early
- Developing a sense for diminishing returns—when "good enough" is reached
- Using AI to critique its own outputs as a refinement accelerator

### 5. Workflow Integration
Embedding AI into existing processes effectively

- Identifying friction points in current workflows where AI adds genuine value
- Designing handoffs between AI tools, human review, and downstream systems
- Building sustainable habits rather than one-off experiments
- Creating feedback mechanisms to improve processes over time
- Balancing automation benefits against oversight requirements
- Documenting AI-augmented workflows for consistency and knowledge transfer

### 6. Frontier Recognition
Knowing when you're operating outside AI's reliable boundaries

- Recognizing task types where AI performance degrades unpredictably
- Understanding the difference between "AI can attempt this" and "AI can do this well"
- Identifying when novel situations require human judgment over AI pattern-matching
- Staying current on genuine capability boundaries vs. perceived limitations
- Knowing when to push boundaries experimentally vs. when stakes demand proven approaches
- Developing intuition for the "uncanny valley" of AI confidence without competence

---

## Ongoing Maintenance

### Weekly Check-in (Every Friday, 10 min)
1. Context Assembly: Did I provide good context this week?
2. Quality Judgment: Any trust calibration updates needed?
3. Task Decomposition: Did I decompose effectively?
4. Iterative Refinement: What was my iterations-to-done average?
5. Workflow Integration: Are my integrations still working?
6. Frontier Recognition: Any new frontiers discovered?

### Monthly Review (30 min)
- Update frontier map with new discoveries
- Refine context templates based on usage
- Review verification checklists for relevance
- Update trust matrix based on accumulated evidence
- Assess time savings from workflow integrations

### Quarterly Reset
- Review all documentation for relevance
- Archive outdated project contexts
- Evaluate which skills need refreshing
- Set focus skills for next quarter

---

## Development Notes

- All 12 lessons accessible from start (no sequential unlocking)
- Dark theme UI, consistent across all lessons
- User authentication with per-user data isolation
- Admin panel for user management (separate container)
- Templates and progress persist per-user

### Terminology

- **Module**: A category grouping (Foundation, Documentation & Trust, Workflow, Advanced)
- **Lesson**: An individual content item (1-12)
- Routes use `/lesson/X` pattern
- Backend folders use `lessonXX_name/` pattern

### Lesson-to-Concept Mapping

| Lesson | Title | Primary Concept |
|--------|-------|-----------------|
| 1 | Context Tracker | Context Assembly |
| 2 | Feedback Analyzer | Iterative Refinement |
| 3 | Template Builder | Context Assembly |
| 4 | Context Docs | Context Assembly |
| 5 | Trust Matrix | Quality Judgment |
| 6 | Verification Tools | Quality Judgment |
| 7 | Task Decomposer | Task Decomposition |
| 8 | Delegation Tracker | Task Decomposition |
| 9 | Iteration Passes | Iterative Refinement |
| 10 | Status Reporter | Workflow Integration |
| 11 | Frontier Mapper | Frontier Recognition |
| 12 | Reference Card | Workflow Integration |

### Adding New Lessons

When activating a new lesson, update ALL of the following:

**Backend:**
- `backend/modules/lessonXX_name/` - Create lesson directory with `__init__.py`, `schemas.py`, `routes.py`
- `backend/database/models.py` - Add model if needed, update User relationships
- `backend/main.py` - Import and register router, update health check status to "active"

**Frontend:**
- `frontend/src/pages/LessonXX.jsx` - Create the page component
- `frontend/src/App.jsx` - Import component and add Route
- `frontend/src/components/Sidebar.jsx` - Set `active: true` for the lesson
- `frontend/src/pages/Dashboard.jsx` - Set `status: 'active'` for the lesson

Plan created: January 2025
