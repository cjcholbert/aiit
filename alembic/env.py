"""Alembic migration environment configuration."""
import os
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from alembic import context

# Load .env from project parent folder (shared across all projects)
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

# Alembic Config object
config = context.config

# Override sqlalchemy.url from environment
database_url = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/ai_manager_skills",
)
# Railway provides DATABASE_URL as postgres:// — normalize to postgresql://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
# Alembic needs sync driver — strip async prefixes
database_url = database_url.replace("+asyncpg", "").replace("+aiosqlite", "")
config.set_main_option("sqlalchemy.url", database_url)

# Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import models so Alembic can detect schema
from backend.database.models import Base  # noqa: E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
