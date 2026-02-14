"""initial schema snapshot

Revision ID: b65b8574628c
Revises: 
Create Date: 2026-02-14 18:34:33.257353

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b65b8574628c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Baseline revision — schema created by SQLAlchemy create_all.

    Run `alembic revision --autogenerate -m "description"` against a
    running database to capture future schema changes.
    """
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
