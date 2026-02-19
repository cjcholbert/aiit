# AI Manager Skills — Product Overview

## One-Liner
Interactive web platform teaching non-technical workers six managerial skills for effective AI collaboration — through hands-on practice, not passive video.

## The Six Managerial Concepts

1. **Context Assembly** — Knowing what information to provide, from what sources, and why
2. **Quality Judgment** — Knowing when to trust AI output and when to verify
3. **Task Decomposition** — Breaking work into AI-appropriate chunks
4. **Iterative Refinement** — Moving from 70% to 95% through structured feedback loops
5. **Workflow Integration** — Embedding AI into existing processes effectively
6. **Frontier Recognition** — Knowing when you're operating outside AI's reliable boundaries

## What Users Actually Do (by lesson)

| Lesson | Title | Users Build | AI-Powered? |
|--------|-------|------------|-------------|
| 1 | Context Tracker | Analyzed conversations with coaching feedback | Yes — full analysis |
| 2 | Feedback Analyzer | Scored feedback entries with rewrite suggestions | Rule-based |
| 3 | Template Builder | Reusable prompt templates, tested live | Yes — template testing |
| 4 | Context Docs | Living project documents with AI session prompts | Prompt generation |
| 5 | Trust Matrix | Personal trust ratings with prediction tracking | Yes — calibration insights |
| 6 | Verification Tools | Reusable verification checklists | CRUD |
| 7 | Task Decomposer | Project breakdowns with AI/human categorization | CRUD + analytics |
| 8 | Delegation Tracker | Structured delegations with task workflows | CRUD + templates |
| 9 | Iteration Passes | Multi-pass refinement records with quality scoring | Feedback scoring |
| 10 | Status Reporter | Workflow templates with execution tracking | Prompt generation |
| 11 | Frontier Mapper | AI reliability zones with encounter logs | CRUD + statistics |
| 12 | Reference Card | Personal quick-reference aggregating all lessons | Yes — card generation |

## Module Structure

| Module | Lessons | Primary Concepts |
|--------|---------|-----------------|
| Foundation | 1-3 | Context Assembly |
| Documentation & Trust | 4-6 | Context Assembly, Quality Judgment |
| Workflow | 7-10 | Task Decomposition, Iterative Refinement, Workflow Integration |
| Advanced | 11-12 | Frontier Recognition, Integration |

## Pedagogical Design

- **Learn-Practice-Track cycle** — every lesson has Learn tab (concepts + scenarios), Practice tab (interactive tools), and assessment criteria
- **Behavioral assessment** — measures what users do ("analyzed 1+ conversation") not what they know ("define context assembly")
- **Cross-lesson integration** — Lesson 3 pulls from Lesson 1, Lesson 8 imports from Lesson 7, Lesson 12 aggregates all
- **Before/after comparisons** — every lesson shows vague vs. specific approaches side-by-side
- **Problem/Skill framing** — each lesson opens with "The Problem" and "The Skill" before content
- **4 criteria per lesson** — 48 total completion criteria across all 12 lessons
- **Recommended learning path** — guided sequence (1, 3, 5, 7, 2, 4, 6, 8, 9, 10, 11, 12) with all lessons accessible from day one

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Backend | FastAPI (Python, async) | JWT auth, rate limiting, circuit breaker, schema validation |
| AI Integration | Claude API (Anthropic) | Lessons 1, 3, 5, 12 — with retry logic and graceful degradation |
| Database | PostgreSQL + SQLAlchemy 2.0 | 29 models, UUID primary keys, per-user data isolation |
| Frontend | React 18 + Vite 5 | Custom CSS (4,200+ lines), dark/light/high-contrast themes |
| Deployment | Docker Compose | Frontend (nginx), backend, postgres, admin panel |

## Current State (February 2026)

| Area | Status | Details |
|------|--------|---------|
| Core product | DONE | All 12 lessons functional with real business logic |
| AI integration | DONE | 4 lessons with live Claude API, circuit breaker, retries |
| Authentication | DONE | JWT access/refresh tokens, bcrypt, rate limiting |
| Input validation | DONE | Field(max_length) on all schemas, file upload validation |
| Onboarding | DONE | Getting started overlay + recommended lesson path |
| Accessibility | PARTIAL | Skip link, focus trapping, aria attributes — 14 confirm() dialogs remain |
| Test coverage | PARTIAL | 18 test files (~30-40%), all 12 lessons have tests |
| Admin backend | PARTIAL | Cohort API exists, no admin UI frontend |
| Monetization | ZERO | No payments, no billing, no subscription system |
| Certification | ZERO | No completion certificates or competency proof |
| SSO/Enterprise | ZERO | JWT-only auth, no SAML/SSO |
| Marketing | ZERO | No landing page, no content funnel, no sales materials |

## Competitive Position

**The gap we fill:** Most "AI training" is either deeply technical (prompt engineering for developers) or superficially motivational ("AI will change everything!"). This platform occupies the productive middle: practical skill-building for non-technical knowledge workers who use AI tools daily.

| Factor | AI Manager Skills | Typical Competitors |
|--------|------------------|---------------------|
| Content depth | 12 hands-on lessons | Shallow webinars or slide decks |
| Interactivity | Real tools with AI integration | Videos + quizzes |
| Personalization | Users build personal artifacts | Generic one-size-fits-all |
| Enterprise readiness | Weak — no SSO, no cohort UI | Strong in established LMS |

## Target Audience

**Strong fit:**
- Knowledge workers wanting to skill up on AI collaboration
- Managers wanting personal AI skills before rolling out to teams
- Career development for non-technical roles moving into AI-adjacent work
- Self-paced learner populations (remote-first, asynchronous)

**Weaker fit (without enterprise features):**
- Organizations needing to upskill entire teams at once
- Regulated industries needing documented competency verification
- Companies wanting trainer-led cohorts with peer learning

## Commercial Tier Estimates

| Tier | Target | Price | Effort to Launch |
|------|--------|-------|-----------------|
| Tier 1 — Self-Serve Individual | Individual learners | $20-50/user | 2-3 weeks |
| Tier 2 — Team/SMB | Managers, small teams | $200-500/seat | 5-8 weeks |
| Tier 3 — Enterprise | L&D departments | $1,000+/seat | 3-6 months |

## Builder Context

- Solo developer at Network Connection Inc (small MSP)
- Microsoft 365 Business Premium environment
- Bootstrapped — no external funding, no marketing team
- Technical capability is high; marketing/sales expertise is the gap
