import enum

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_instructor_email(session, current_user) -> str | None:
    """Shared by courses/lessons/deliveries DAOs to resolve an `instructor`-role user's own email."""
    from app.models import Instructor

    instructor_id = current_user.get("instructor_id")
    if instructor_id is None:
        return None
    instructor = session.query(Instructor).filter(Instructor.id == instructor_id).one_or_none()
    return instructor.email if instructor else None


def to_dict(obj) -> dict:
    """Generic ORM-row -> JSON-safe dict, used by every <entity>_api.py response."""
    result = {}
    for column in inspect(obj).mapper.column_attrs:
        value = getattr(obj, column.key)
        if isinstance(value, enum.Enum):
            value = value.value
        elif hasattr(value, "isoformat"):
            value = value.isoformat()
        result[column.key] = value
    return result


class BaseDAO:
    """Context-manager base for every <entity>_dao.py — opens/closes one session per `with` block."""

    def __enter__(self):
        self.session = SessionLocal()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()
