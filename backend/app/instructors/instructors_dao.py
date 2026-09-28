from app.db import BaseDAO
from app.models import Instructor
from app.query_utils import apply_filters, parse_pagination, parse_sort

FILTERABLE_COLUMNS = frozenset({"vendor", "platform", "portfolio", "product", "travel_preference", "location", "email"})
SEARCH_COLUMNS = ["name", "skills_products", "comments"]
SORTABLE_COLUMNS = FILTERABLE_COLUMNS | {"id", "name", "created_at"}


class InstructorDAO(BaseDAO):
    def get_all(self, args, current_user):
        query = self.session.query(Instructor)
        if current_user["role"] == "instructor":
            query = query.filter(Instructor.id == current_user["instructor_id"])
        else:
            query = apply_filters(query, Instructor, args, FILTERABLE_COLUMNS, search_columns=SEARCH_COLUMNS)
            query = parse_sort(query, Instructor, args, SORTABLE_COLUMNS, default_sort="id")
        limit, offset = parse_pagination(args)
        return query.limit(limit).offset(offset).all()

    def get_by_id(self, instructor_id: int):
        return self.session.query(Instructor).filter(Instructor.id == instructor_id).one_or_none()

    def create(self, fields: dict) -> Instructor:
        instructor = Instructor(**fields)
        self.session.add(instructor)
        self.session.flush()
        return instructor

    def update(self, instructor: Instructor, fields: dict) -> Instructor:
        for key, value in fields.items():
            setattr(instructor, key, value)
        self.session.flush()
        return instructor

    def delete(self, instructor: Instructor):
        self.session.delete(instructor)
