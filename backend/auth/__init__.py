"""Authentication module."""
from .routes import router as auth_router
from .dependencies import get_current_user, get_current_admin_user, get_optional_user
from .jwt import get_password_hash, verify_password

__all__ = [
    "auth_router",
    "get_current_user",
    "get_current_admin_user",
    "get_optional_user",
    "get_password_hash",
    "verify_password",
]
