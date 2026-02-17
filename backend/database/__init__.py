"""Database initialization and session management."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
from pathlib import Path
from dotenv import load_dotenv

from .models import Base

# Load .env from AI-ManagerSkills parent folder (shared across all projects)
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

# Database URL from environment
# Supports PostgreSQL (production) or SQLite (local dev)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./ai_manager_skills.db"
)

# Railway provides DATABASE_URL as postgres:// but SQLAlchemy 2.0 requires postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# For sync operations (like Alembic migrations)
SYNC_DATABASE_URL = DATABASE_URL.replace("+asyncpg", "").replace("+aiosqlite", "")

# Async engine for FastAPI
engine = create_async_engine(DATABASE_URL, echo=False)

# Async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db() -> AsyncSession:
    """Dependency for getting database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()
