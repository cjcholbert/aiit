# Credentials Required for AI Manager Skills Platform

## Status: [x] Complete

## Required Credentials

### 1. Anthropic API Key
- **Variable**: `ANTHROPIC_API_KEY`
- **Type**: API Key
- **Where to get it**: [Anthropic Console](https://console.anthropic.com/) > API Keys
- **Used by**: Backend AI analysis endpoints (context analysis, feedback analysis, delegation review)
- **Required**: Yes, for AI-powered features

### 2. PostgreSQL Database
- **Variables**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`
- **Type**: Database credentials
- **Where to get it**: Set your own values; Docker Compose creates the database automatically
- **Used by**: Backend and Admin API for all data storage
- **Required**: Yes
- **Notes**: `DATABASE_URL` is auto-constructed in docker-compose.yml from the individual POSTGRES_* vars. Only set `DATABASE_URL` directly for non-Docker deployments (e.g., Railway).

### 3. JWT Secret Key
- **Variable**: `JWT_SECRET_KEY`
- **Type**: Secret key (random string)
- **Where to get it**: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- **Used by**: Backend and Admin API for signing JWT access/refresh tokens
- **Required**: Yes
- **Notes**: Must be the same value for both backend and admin-api if they share the same user base. Access tokens expire in 15 minutes, refresh tokens in 7 days.

### 4. Admin Secret Key
- **Variable**: `ADMIN_SECRET_KEY`
- **Type**: Secret key (random string)
- **Where to get it**: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- **Used by**: Admin API for authenticating admin panel requests (X-Admin-Key header)
- **Required**: Yes, for admin panel functionality
- **Notes**: Admin API will not start without this value set.

### 5. CORS Origins
- **Variable**: `CORS_ORIGINS`
- **Type**: Comma-separated URL list
- **Where to get it**: Set based on your deployment URLs
- **Used by**: Backend and Admin API CORS middleware
- **Required**: No (defaults to localhost origins)
- **Default**: `http://localhost:3000` (backend), `http://localhost:3001` (admin)

### 6. Frontend API URL
- **Variable**: `VITE_API_URL`
- **Type**: URL
- **Where to get it**: Set to your backend's public URL
- **Used by**: Frontend build (Vite) to configure API endpoint
- **Required**: No (defaults to empty string, uses relative paths)
- **Notes**: This is a build-time variable baked into the frontend bundle.

### 7. Admin Frontend API URL
- **Variable**: `VITE_ADMIN_API_URL`
- **Type**: URL
- **Where to get it**: Set to your admin API's public URL
- **Used by**: Admin frontend build (Vite) to configure admin API endpoint
- **Required**: No (defaults to `http://localhost:8001`)

## .env File Template

```bash
# Copy to .env and fill in values
# See .env.example for the full template with defaults

# REQUIRED - generate these before starting
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET_KEY=<generate-with-secrets-module>
ADMIN_SECRET_KEY=<generate-with-secrets-module>

# Database (defaults work for Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=ai_manager_skills

# Optional
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
VITE_API_URL=http://localhost:8000
VITE_ADMIN_API_URL=http://localhost:8001
```

## Setup Steps

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Generate secret keys:
   ```bash
   python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
   python -c "import secrets; print('ADMIN_SECRET_KEY=' + secrets.token_urlsafe(32))"
   ```

3. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/) and set `ANTHROPIC_API_KEY`.

4. Set a strong `POSTGRES_PASSWORD` (the default is only suitable for local development).

5. Start the platform:
   ```bash
   docker compose up -d
   # With admin panel:
   docker compose --profile admin up -d
   ```
