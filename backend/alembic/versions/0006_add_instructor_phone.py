"""add instructor phone column

Revision ID: c8d9e0f1a2b3
Revises: b7a8c9d0e1f2
Create Date: 2026-10-23 15:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, None] = "b7a8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("instructors", sa.Column("phone", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("instructors", "phone")
