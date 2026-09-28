from app.db import BaseDAO
from app.models import Delivery, DeliveryFeedback
from app.query_utils import apply_filters, parse_pagination, parse_sort

FILTERABLE_COLUMNS = frozenset({"course_id", "instructor_id", "company", "modality", "location"})
RANGE_COLUMNS = frozenset({"delivery_date"})
SEARCH_COLUMNS = ["student_name", "course_name", "company"]
SORTABLE_COLUMNS = FILTERABLE_COLUMNS | RANGE_COLUMNS | {"id", "delivery_date", "created_at"}


class DeliveryDAO(BaseDAO):
    def get_all(self, args, current_user):
        query = self.session.query(Delivery)
        if current_user["role"] == "instructor":
            query = query.filter(Delivery.instructor_id == current_user["instructor_id"])
        query = apply_filters(query, Delivery, args, FILTERABLE_COLUMNS, RANGE_COLUMNS, SEARCH_COLUMNS)
        query = parse_sort(query, Delivery, args, SORTABLE_COLUMNS, default_sort="id")
        limit, offset = parse_pagination(args)
        return query.limit(limit).offset(offset).all()

    def get_by_id(self, delivery_id: int, current_user):
        query = self.session.query(Delivery).filter(Delivery.id == delivery_id)
        if current_user["role"] == "instructor":
            query = query.filter(Delivery.instructor_id == current_user["instructor_id"])
        return query.one_or_none()

    def get_raw_by_id(self, delivery_id: int):
        return self.session.query(Delivery).filter(Delivery.id == delivery_id).one_or_none()

    def create(self, fields: dict) -> Delivery:
        delivery = Delivery(**fields)
        self.session.add(delivery)
        self.session.flush()
        return delivery

    def update(self, delivery: Delivery, fields: dict) -> Delivery:
        for key, value in fields.items():
            setattr(delivery, key, value)
        self.session.flush()
        return delivery

    def delete(self, delivery: Delivery):
        self.session.delete(delivery)

    def add_feedback(self, delivery_id: int, fields: dict) -> DeliveryFeedback:
        feedback = DeliveryFeedback(delivery_id=delivery_id, **fields)
        self.session.add(feedback)
        self.session.flush()
        return feedback

    def get_feedback_for_delivery(self, delivery_id: int):
        return self.session.query(DeliveryFeedback).filter(DeliveryFeedback.delivery_id == delivery_id).all()
