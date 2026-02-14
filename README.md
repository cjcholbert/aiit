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

## Lesson Modules

| Lesson | Module | Status |
|--------|--------|--------|
| 1 | Context Tracker | Active |
| 2 | Feedback Analyzer | Active |
| 3 | Template Builder | Active |
| 4 | Context Docs | Active |
| 5 | Trust Matrix | Active |
| 6 | Verification Tools | Active |
| 7 | Task Decomposer | Active |
| 8 | Delegation Tracker | Active |
| 9 | Iteration Passes | Active |
| 10 | Status Reporter | Active |
| 11 | Frontier Mapper | Active |
| 12 | Reference Card | Active |

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `GET /auth/me` - Current user profile

### Lesson 1: Context Tracker
- `POST /lesson1/analyze` - Analyze transcript
- `POST /lesson1/upload` - Upload JSON file
- `GET /lesson1/conversations` - List conversations
- `GET /lesson1/conversations/{id}` - Get conversation
- `PUT /lesson1/conversations/{id}` - Update with edits
- `DELETE /lesson1/conversations/{id}` - Delete
- `GET /lesson1/patterns` - Pattern statistics
- `GET /lesson1/insights` - Aggregated insights

### Admin (separate container)
- `GET /admin/users` - List users
- `GET /admin/users/{id}` - User details
- `POST /admin/users/{id}/reset-password` - Reset password
- `POST /admin/users/{id}/toggle-active` - Enable/disable
- `DELETE /admin/users/{id}` - Delete user
- `GET /admin/stats` - Platform statistics

## Testing

Run the test suite with pytest:

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --tb=short

# Run a specific test file
pytest tests/test_auth.py -v
```

Tests use SQLite in-memory databases and do not require a running PostgreSQL instance.

## License

Private - Network Connection Inc
