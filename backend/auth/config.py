"""Authentication configuration."""
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Path to shared .env in AI-ManagerSkills parent folder
ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


class AuthSettings(BaseSettings):
    """JWT and authentication settings."""

    # JWT Configuration
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_secrets_generate_token"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 600  # 10 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Password hashing
    BCRYPT_ROUNDS: int = 12

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"


@lru_cache()
def get_auth_settings() -> AuthSettings:
    """Get cached auth settings."""
    return AuthSettings()
