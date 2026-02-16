"""add verification_sessions table

Revision ID: 6f732f734557
Revises: b65b8574628c
Create Date: 2026-02-16 01:01:48.268570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6f732f734557'
down_revision: Union[str, Sequence[str], None] = 'b65b8574628c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add verification_sessions table for Lesson 6."""
    op.create_table(
        'verification_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('checklist_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('checklists.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('checklist_name', sa.String(255), nullable=False),
        sa.Column('output_description', sa.Text(), nullable=False),
        sa.Column('is_low_stakes', sa.Boolean(), server_default='false'),
        sa.Column('is_prototyping', sa.Boolean(), server_default='false'),
        sa.Column('time_seconds', sa.Integer(), nullable=True),
        sa.Column('overall_passed', sa.Boolean(), nullable=True),
        sa.Column('issues_found', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    """Remove verification_sessions table."""
    op.drop_table('verification_sessions')
