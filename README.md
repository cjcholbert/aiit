# AI Manager Skills Platform

12-week AI collaboration skills curriculum with user authentication, per-user history, and containerized deployment.

## Architecture

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React (Vite build) + React Router
- **Auth**: JWT tokens with refresh (python-jose + passlib)
- **Container**: Docker Compose

### Container Layout

```
Learner Platform (always running):
- nginx (:80/443) - reverse proxy
- frontend (:3000) - React SPA
- backend (:8000) - FastAPI
- postgres (:5432) - PostgreSQL

Admin (separate, optional):
- admin-api (:8001) - Admin FastAPI
- admin-frontend (:3001) - Admin React SPA
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Anthropic API key (for conversation analysis)

### Setup

1. Clone and configure:
```bash
cd ai-manager-skills
cp .env.example .env
# Edit .env with your values
```

2. Start the platform:
```bash
# Learner platform only
docker-compose up -d postgres backend frontend nginx

# With admin panel
docker-compose --profile admin up -d
```

3. Access:
- Learner platform: http://localhost
- Admin panel: http://localhost:3001 (when admin profile enabled)

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Start PostgreSQL first
docker-compose up -d postgres

# Run backend
uvicorn backend.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | postgres |
| `POSTGRES_PASSWORD` | Database password | postgres |
| `POSTGRES_DB` | Database name | ai_manager_skills |
| `JWT_SECRET_KEY` | JWT signing key | (change in prod!) |
| `ANTHROPIC_API_KEY` | Claude API key | (required) |
| `ANTHROPIC_MODEL` | Model to use | claude-3-haiku-20240307 |
| `ADMIN_SECRET_KEY` | Admin API key | (change in prod!) |

## Week Modules

| Week | Module | Status |
|------|--------|--------|
| 1 | Context Tracker | Active |
| 2 | Template Builder | Planned |
| 3 | Trust Matrix | Planned |
| 4 | Verification Tools | Planned |
| 5 | Task Decomposer | Planned |
| 6 | Delegation Tracker | Planned |
| 7 | Iteration Passes | Planned |
| 8 | Feedback Analyzer | Planned |
| 9 | Status Reporter | Planned |
| 10 | Context Docs | Planned |
| 11 | Frontier Mapper | Planned |
| 12 | Reference Card | Planned |

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `GET /auth/me` - Current user profile

### Week 1: Context Tracker
- `POST /week1/analyze` - Analyze transcript
- `POST /week1/upload` - Upload JSON file
- `GET /week1/conversations` - List conversations
- `GET /week1/conversations/{id}` - Get conversation
- `PUT /week1/conversations/{id}` - Update with edits
- `DELETE /week1/conversations/{id}` - Delete
- `GET /week1/patterns` - Pattern statistics
- `GET /week1/insights` - Aggregated insights

### Admin (separate container)
- `GET /admin/users` - List users
- `GET /admin/users/{id}` - User details
- `POST /admin/users/{id}/reset-password` - Reset password
- `POST /admin/users/{id}/toggle-active` - Enable/disable
- `DELETE /admin/users/{id}` - Delete user
- `GET /admin/stats` - Platform statistics

## License

Private - Network Connection Inc
