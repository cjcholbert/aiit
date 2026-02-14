# Week 5: Task Decomposer - Implementation Task

## Context
You are building Week 5 of the AI Manager Skills platform - a 12-week curriculum teaching common workers (not super users) how to use AI more productively. The focus is on building systematic habits, not advanced technical skills.

**Weeks 1-4 are complete:**
- Week 1: Context Tracker (analyze transcripts, identify patterns)
- Week 2: Template Builder (create/test context templates)
- Week 3: Trust Matrix (output types, predictions, calibration)
- Week 4: Verification Tools (checklists, practice sessions, skip criteria)

## Week 5 Focus: Task Decomposition - Mapping Skills
Learning to see tasks as decomposable chunks and categorize them appropriately.

### The Three Categories

**AI-Optimal (Delegate Freely)**
- Well-defined input -> well-defined output
- Pattern-based work, no institutional knowledge required
- Examples: Boilerplate generation, data formatting, research summaries

**Collaborative (Work Together)**
- Requires judgment calls
- Benefits from your context + AI capability
- Examples: Strategy development, complex analysis, creative refinement

**Human-Primary (You Lead)**
- Requires your authority or credentials
- Involves institutional knowledge AI can't have
- Examples: Final decisions, sensitive communications, real-world actions

### Core Features Required

1. **Project Decomposition**
   - Create a new project/task to decompose
   - Break it into subtasks
   - Categorize each subtask (AI-Optimal, Collaborative, Human-Primary)
   - Add notes/reasoning for categorization

2. **Task Sequencing**
   - Order tasks by dependencies
   - Mark which tasks can run in parallel
   - Identify decision gates (review points)
   - Visual dependency flow

3. **Category Learning**
   - Interactive guide explaining each category
   - Examples for each category
   - Quiz/self-assessment on categorization

4. **Decomposition History**
   - View past decompositions
   - Track patterns in how you categorize
   - Statistics on category distribution

### Database Model (Already Exists)
```python
class Decomposition(Base):
    __tablename__ = "decompositions"
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"))
    project_name = Column(String(255), nullable=False)
    tasks = Column(JSON, nullable=False)  # List of task objects
    categories = Column(JSON, nullable=False)  # Category counts/stats
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

### Task Object Structure
```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "What needs to be done",
  "category": "ai_optimal|collaborative|human_primary",
  "reasoning": "Why this category",
  "order": 0,
  "dependencies": ["task_id1", "task_id2"],
  "is_decision_gate": false,
  "parallel_group": null,
  "status": "pending|in_progress|completed"
}
```

### Tech Stack
- Backend: FastAPI + SQLAlchemy + async SQLite
- Frontend: React (Vite) with existing component patterns
- Follow patterns from week04_verification module

### Files to Create
1. `backend/modules/week05_decomposer/__init__.py`
2. `backend/modules/week05_decomposer/schemas.py`
3. `backend/modules/week05_decomposer/routes.py`
4. `frontend/src/pages/Week05.jsx`
5. Update `backend/main.py` to include week05 router
6. Update `frontend/src/components/Sidebar.jsx` to activate Week 5
7. Update `frontend/src/pages/Dashboard.jsx` to mark Week 5 active
8. Update `frontend/src/App.jsx` to add Week 5 route

### UI Design Guidelines
- Dark theme consistent with Weeks 1-4
- Card-based layout for decompositions
- Color-coded categories (green=AI-optimal, yellow=collaborative, red=human-primary)
- Drag-and-drop for task reordering (optional)
- Visual dependency lines or flow diagram

### End State
User can:
1. Create a project and break it into categorized subtasks
2. Sequence tasks with dependencies
3. Learn the three categories through examples
4. View history and patterns in their decompositions

## Instructions
Read RALPH_PLAN.md and work through checkpoints sequentially. Mark each checkpoint complete after verification. Commit after each major checkpoint.
