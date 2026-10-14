"""add course instructors junction table

Revision ID: b7a8c9d0e1f2
Revises: 011a1cf4afef
Create Date: 2026-10-14 15:25:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7a8c9d0e1f2"
down_revision: Union[str, None] = "011a1cf4afef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "course_instructors",
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("instructor_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["instructor_id"], ["instructors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("course_id", "instructor_id"),
    )
    op.create_index(op.f("ix_course_instructors_course_id"), "course_instructors", ["course_id"], unique=False)
    op.create_index(op.f("ix_course_instructors_instructor_id"), "course_instructors", ["instructor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_course_instructors_instructor_id"), table_name="course_instructors")
    op.drop_index(op.f("ix_course_instructors_course_id"), table_name="course_instructors")
    op.drop_table("course_instructors")
