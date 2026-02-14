# RALPH_PLAN: Week 5 Task Decomposer

## Status: IN PROGRESS
## Current Checkpoint: 1

---

## Checkpoint 1: Backend Foundation
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Create `backend/modules/week05_decomposer/__init__.py`
- [ ] Create `backend/modules/week05_decomposer/schemas.py` with:
  - TaskCreate, TaskUpdate, TaskResponse
  - DecompositionCreate, DecompositionUpdate, DecompositionResponse
  - DecompositionStats
- [ ] Create `backend/modules/week05_decomposer/routes.py` with:
  - CRUD endpoints for decompositions
  - Task management within decompositions
  - Statistics endpoint

### Verification:
```bash
curl http://localhost:8001/openapi.json | grep "/week5/"
```

### Commit Message:
`feat: Add Week 5 Task Decomposer backend foundation`

---

## Checkpoint 2: Backend Routes Complete
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Update `backend/main.py` to include week05 router
- [ ] Implement all CRUD routes for decompositions
- [ ] Add task reordering endpoint
- [ ] Add statistics/patterns endpoint
- [ ] Add example decomposition seeding

### Verification:
```bash
curl -X POST http://localhost:8001/week5/decompositions -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_name":"Test Project","tasks":[]}'
```

### Commit Message:
`feat: Complete Week 5 backend routes and API`

---

## Checkpoint 3: Frontend Page Structure
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Create `frontend/src/pages/Week05.jsx` with:
  - Page layout matching Week 4 style
  - Tab navigation: Learn | Decompose | History
  - Category color scheme
- [ ] Update `frontend/src/components/Sidebar.jsx` to activate Week 5
- [ ] Update `frontend/src/pages/Dashboard.jsx` to mark Week 5 active
- [ ] Update `frontend/src/App.jsx` to add Week 5 route

### Verification:
Navigate to http://localhost:3009/week/5 - page should load without errors.

### Commit Message:
`feat: Add Week 5 frontend page structure`

---

## Checkpoint 4: Learn Tab - Category Guide
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Implement Learn tab with three category explanations
- [ ] Add examples for each category
- [ ] Color-coded visual cards for each category
- [ ] "Got it" or progression indicator

### Verification:
User can read and understand the three categories with examples.

### Commit Message:
`feat: Add category learning guide to Week 5`

---

## Checkpoint 5: Decompose Tab - Project Creation
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Project creation form (name, description)
- [ ] Task addition interface
- [ ] Category selection for each task (AI-Optimal, Collaborative, Human-Primary)
- [ ] Reasoning/notes field for each task
- [ ] Save decomposition

### Verification:
Create a project with 3+ tasks in different categories.

### Commit Message:
`feat: Add project decomposition UI to Week 5`

---

## Checkpoint 6: Task Sequencing
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Task reordering (drag or up/down buttons)
- [ ] Dependency selection (which tasks depend on which)
- [ ] Decision gate toggle
- [ ] Visual flow showing task sequence
- [ ] Parallel task grouping

### Verification:
Reorder tasks, set dependencies, mark decision gates.

### Commit Message:
`feat: Add task sequencing to Week 5`

---

## Checkpoint 7: History & Stats
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] History tab showing past decompositions
- [ ] Category distribution stats (pie chart or bars)
- [ ] Patterns in categorization over time
- [ ] View/edit past decompositions

### Verification:
View history of decompositions with stats.

### Commit Message:
`feat: Add decomposition history and stats to Week 5`

---

## Checkpoint 8: Polish & Integration
**Status:** [ ] NOT STARTED

### Tasks:
- [ ] Add context-rich page description
- [ ] Empty states and tooltips
- [ ] Error handling and loading states
- [ ] Final UI polish

### Verification:
Full user flow works smoothly.

### Commit Message:
`feat: Complete Week 5 with polish and integration`

---

## Blockers Log
(Document any issues that block progress)

---

## Notes
- Follow Week 4 patterns for consistency
- Color scheme: Green=AI-Optimal, Yellow=Collaborative, Red=Human-Primary
- Keep UI simple - focus on the categorization skill, not complex project management
- The goal is learning to decompose, not full task tracking
