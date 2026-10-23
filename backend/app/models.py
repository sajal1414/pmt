import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def _utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    admin = "admin"
    instructor = "instructor"


class CourseStatus(str, enum.Enum):
    available = "available"
    in_development = "in_development"
    retired = "retired"
    pipeline = "pipeline"
    backlog = "backlog"


class CourseOutlineStatus(str, enum.Enum):
    missing = "missing"
    not_yet_scoped = "not_yet_scoped"
    draft = "draft"
    partially_complete = "partially_complete"
    validated = "validated"


class LabLocation(str, enum.Enum):
    itz = "ITZ"
    nfolks = "nFolks"
    instructor_owned = "instructor_owned"
    na = "na"


class IPOwner(str, enum.Enum):
    nfolks = "nFolks"
    subk = "SubK"


class SkillLevel(str, enum.Enum):
    foundational = "foundational"
    intermediate = "intermediate"
    advanced = "advanced"


class TravelPreference(str, enum.Enum):
    can_travel = "can_travel"
    virtual_only = "virtual_only"
    in_person_only = "in_person_only"
    both = "both"


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    location = Column(String)
    travel_preference = Column(Enum(TravelPreference, native_enum=False))
    languages = Column(String)
    vendor = Column(String)
    platform = Column(String)
    portfolio = Column(String)
    product = Column(String)
    skills_products = Column(Text)
    courses_can_teach = Column(Text)
    external_courses_owned = Column(Text)
    feedback_score = Column(Numeric)
    comments = Column(Text)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole, native_enum=False), nullable=False)
    full_name = Column(String)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=True)
    # True for every admin-created account until the user sets their own password.
    must_change_password = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    instructor = relationship("Instructor")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    vendor = Column(String)
    platform = Column(String)
    portfolio = Column(String)
    product = Column(String)
    nfolks_course_code = Column(String, unique=True, nullable=False, index=True)
    ibm_course_codes = Column(String)
    status = Column(Enum(CourseStatus, native_enum=False), nullable=False, default=CourseStatus.backlog)
    course_name = Column(String, nullable=False)
    course_outline_status = Column(Enum(CourseOutlineStatus, native_enum=False))
    modality = Column(String)
    duration_days = Column(Numeric)
    num_hours = Column(Numeric)
    on_ibm_pmt = Column(String)
    lab_location = Column(Enum(LabLocation, native_enum=False))
    ibm_retirement_date = Column(Date)
    ip_owner = Column(Enum(IPOwner, native_enum=False))
    course_author_email = Column(String, index=True)
    planned_completion_date = Column(Date)
    release_date = Column(Date)
    retire_date = Column(Date, index=True)
    course_description = Column(Text)
    link_to_course_outline = Column(String)
    course_outline_s3_key = Column(String)
    skill_level = Column(Enum(SkillLevel, native_enum=False))
    max_students = Column(Integer)
    pre_reqs = Column(Text)
    persona_audience_type = Column(Text)
    lab_configuration = Column(Text)
    course_technical_requirements = Column(Text)
    delivery_instruction_notes = Column(Text)
    instructor_daily_rate = Column(Numeric(10, 2))
    materials_cost = Column(Numeric(10, 2))
    lab_cost = Column(Numeric(10, 2))
    learning_path = Column(String)
    badge = Column(String)
    certification = Column(String)
    notes = Column(Text)
    record_source = Column(String)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    lessons = relationship("Lesson", cascade="all, delete-orphan", back_populates="course")
    instructors = relationship("Instructor", secondary="course_instructors", backref="courses")


course_instructors = Table(
    "course_instructors",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True, index=True),
    Column("instructor_id", Integer, ForeignKey("instructors.id", ondelete="CASCADE"), primary_key=True, index=True),
    Column("created_at", DateTime(timezone=True), default=_utcnow, nullable=False),
)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    sequence_order = Column(Integer, nullable=False, default=0)
    duration_minutes = Column(Integer)
    attachment_url = Column(String)
    attachment_s3_key = Column(String)
    attachment_content_type = Column(String)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    course = relationship("Course", back_populates="lessons")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True)
    student_name = Column(String)
    student_email = Column(String)
    student_demographics = Column(Text)
    company = Column(String)
    company_industry = Column(String)
    role = Column(String)
    location = Column(String)
    modality = Column(String)
    course_name = Column(String)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=True, index=True)
    delivery_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    feedback = relationship("DeliveryFeedback", cascade="all, delete-orphan", back_populates="delivery")


class DeliveryFeedback(Base):
    __tablename__ = "delivery_feedback"

    id = Column(Integer, primary_key=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    course_name = Column(String)
    course_code = Column(String)
    nps_score = Column(Integer)
    feedback_text = Column(Text)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    delivery = relationship("Delivery", back_populates="feedback")
