from sqlalchemy.orm import selectinload

from app.db import BaseDAO, get_instructor_email
from app.models import Course, Instructor
from app.query_utils import apply_filters, parse_pagination, parse_sort

FILTERABLE_COLUMNS = frozenset(
    {"vendor", "platform", "portfolio", "product", "status", "modality", "lab_location", "skill_level", "ip_owner"}
)
RANGE_COLUMNS = frozenset({"retire_date", "release_date", "planned_completion_date"})
SEARCH_COLUMNS = ["nfolks_course_code", "course_name", "ibm_course_codes", "course_description"]
SORTABLE_COLUMNS = FILTERABLE_COLUMNS | RANGE_COLUMNS | {"id", "course_name", "nfolks_course_code", "created_at"}


class CourseDAO(BaseDAO):
    def _instructor_email(self, current_user) -> str | None:
        return get_instructor_email(self.session, current_user)

    def _scope_to_owner(self, query, current_user):
        if current_user["role"] == "instructor":
            email = self._instructor_email(current_user)
            instructor_id = current_user.get("instructor_id")
            if instructor_id:
                query = query.filter(
                    (Course.course_author_email == email)
                    | (Course.instructors.any(Instructor.id == instructor_id))
                )
            else:
                query = query.filter(Course.course_author_email == email)
        return query

    def get_all(self, args, current_user):
        query = self.session.query(Course).options(selectinload(Course.instructors))
        query = self._scope_to_owner(query, current_user)
        if args.get("instructor_id"):
            try:
                inst_id = int(args["instructor_id"])
                query = query.filter(Course.instructors.any(Instructor.id == inst_id))
            except (ValueError, TypeError):
                pass
        query = apply_filters(query, Course, args, FILTERABLE_COLUMNS, RANGE_COLUMNS, SEARCH_COLUMNS)
        query = parse_sort(query, Course, args, SORTABLE_COLUMNS, default_sort="id")
        limit, offset = parse_pagination(args)
        return query.limit(limit).offset(offset).all()

    def get_by_id(self, course_id: int, current_user):
        query = self.session.query(Course).options(selectinload(Course.instructors)).filter(Course.id == course_id)
        query = self._scope_to_owner(query, current_user)
        return query.one_or_none()

    def get_raw_by_id(self, course_id: int):
        """Fetch without owner-scoping, for update/delete routes that do their own ownership check."""
        return (
            self.session.query(Course)
            .options(selectinload(Course.instructors))
            .filter(Course.id == course_id)
            .one_or_none()
        )

    def create(self, fields: dict, current_user) -> Course:
        if current_user["role"] == "instructor":
            fields["course_author_email"] = self._instructor_email(current_user)
        instructor_ids = fields.pop("instructor_ids", None)
        course = Course(**fields)
        if instructor_ids:
            course.instructors = (
                self.session.query(Instructor).filter(Instructor.id.in_(instructor_ids)).all()
            )
        self.session.add(course)
        self.session.flush()
        return course

    def owns(self, course: Course, current_user) -> bool:
        if current_user["role"] == "admin":
            return True
        email = self._instructor_email(current_user)
        if course.course_author_email == email:
            return True
        instructor_id = current_user.get("instructor_id")
        if instructor_id and any(i.id == instructor_id for i in course.instructors):
            return True
        return False

    def update(self, course: Course, fields: dict) -> Course:
        if "instructor_ids" in fields:
            instructor_ids = fields.pop("instructor_ids")
            if instructor_ids is not None:
                course.instructors = (
                    self.session.query(Instructor).filter(Instructor.id.in_(instructor_ids)).all()
                )
            else:
                course.instructors = []
        for key, value in fields.items():
            setattr(course, key, value)
        self.session.flush()
        return course

    def delete(self, course: Course):
        self.session.delete(course)

