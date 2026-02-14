"""Shared test fixtures for the backend test suite."""
import os

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure test JWT secret is set before app modules are imported
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-unit-tests")

from backend.database.models import Base, User
from backend.database import get_db
from backend.main import app
from backend.rate_limit import limiter
from backend.auth.jwt import create_access_token, get_password_hash


@pytest.fixture
async def db_engine():
    """Create an async in-memory SQLite engine for testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Provide a test database session."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_engine):
    """Provide an httpx AsyncClient wired to the test database."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    # Disable rate limiting during tests to prevent cross-test interference
    limiter.enabled = False
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    limiter.enabled = True
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session) -> tuple[User, str]:
    """Create a regular test user and return (user, access_token)."""
    user = User(
        email="testuser@example.com",
        password_hash=get_password_hash("testpassword123"),
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id)
    return user, token


@pytest.fixture
async def admin_user(db_session) -> tuple[User, str]:
    """Create an admin user and return (user, access_token)."""
    user = User(
        email="admin@example.com",
        password_hash=get_password_hash("adminpassword123"),
        is_active=True,
        is_admin=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(user.id)
    return user, token


def auth_headers(token: str) -> dict:
    """Build Authorization header dict for a bearer token."""
    return {"Authorization": f"Bearer {token}"}
