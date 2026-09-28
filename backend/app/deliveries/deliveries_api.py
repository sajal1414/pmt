from datetime import date

from flask import Blueprint, g, request
from pydantic import BaseModel, ConfigDict, ValidationError

from app.auth.auth_utils import require_role, verify_jwt_token
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.db import to_dict
from app.deliveries.deliveries_dao import DeliveryDAO

deliveries_api = Blueprint("deliveries_api", __name__, url_prefix="/v1/deliveries")


class DeliveryCreateRequest(BaseModel):
    student_name: str | None = None
    student_email: str | None = None
    student_demographics: str | None = None
    company: str | None = None
    company_industry: str | None = None
    role: str | None = None
    location: str | None = None
    modality: str | None = None
    course_name: str | None = None
    course_id: int | None = None
    instructor_id: int | None = None
    delivery_date: date | None = None


class DeliveryUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_name: str | None = None
    student_email: str | None = None
    student_demographics: str | None = None
    company: str | None = None
    company_industry: str | None = None
    role: str | None = None
    location: str | None = None
    modality: str | None = None
    course_name: str | None = None
    course_id: int | None = None
    instructor_id: int | None = None
    delivery_date: date | None = None


class FeedbackCreateRequest(BaseModel):
    course_name: str | None = None
    course_code: str | None = None
    nps_score: int | None = None
    feedback_text: str | None = None


@deliveries_api.route("", methods=["GET"])
@verify_jwt_token()
def list_deliveries():
    with DeliveryDAO() as dao:
        deliveries = dao.get_all(request.args, g.current_user)
        return respond(SUCCESS_MESSAGE, "OK", [to_dict(d) for d in deliveries])


@deliveries_api.route("/<int:delivery_id>", methods=["GET"])
@verify_jwt_token()
def get_delivery(delivery_id):
    with DeliveryDAO() as dao:
        delivery = dao.get_by_id(delivery_id, g.current_user)
        if delivery is None:
            return respond(FAIL_MESSAGE, "Delivery not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", to_dict(delivery))


@deliveries_api.route("", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def create_delivery():
    try:
        body = DeliveryCreateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with DeliveryDAO() as dao:
        delivery = dao.create(body.model_dump())
        return respond(SUCCESS_MESSAGE, "Delivery created", to_dict(delivery)), 201


@deliveries_api.route("/<int:delivery_id>", methods=["PUT"])
@verify_jwt_token()
@require_role("admin")
def update_delivery(delivery_id):
    try:
        body = DeliveryUpdateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with DeliveryDAO() as dao:
        delivery = dao.get_raw_by_id(delivery_id)
        if delivery is None:
            return respond(FAIL_MESSAGE, "Delivery not found"), 404
        delivery = dao.update(delivery, body.model_dump(exclude_unset=True))
        return respond(SUCCESS_MESSAGE, "Delivery updated", to_dict(delivery))


@deliveries_api.route("/<int:delivery_id>", methods=["DELETE"])
@verify_jwt_token()
@require_role("admin")
def delete_delivery(delivery_id):
    with DeliveryDAO() as dao:
        delivery = dao.get_raw_by_id(delivery_id)
        if delivery is None:
            return respond(FAIL_MESSAGE, "Delivery not found"), 404
        dao.delete(delivery)
        return respond(SUCCESS_MESSAGE, "Delivery deleted", None)


@deliveries_api.route("/<int:delivery_id>/feedback", methods=["GET"])
@verify_jwt_token()
def list_feedback(delivery_id):
    with DeliveryDAO() as dao:
        delivery = dao.get_by_id(delivery_id, g.current_user)
        if delivery is None:
            return respond(FAIL_MESSAGE, "Delivery not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", [to_dict(f) for f in dao.get_feedback_for_delivery(delivery_id)])


@deliveries_api.route("/<int:delivery_id>/feedback", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def create_feedback(delivery_id):
    try:
        body = FeedbackCreateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with DeliveryDAO() as dao:
        delivery = dao.get_raw_by_id(delivery_id)
        if delivery is None:
            return respond(FAIL_MESSAGE, "Delivery not found"), 404
        feedback = dao.add_feedback(delivery_id, body.model_dump())
        return respond(SUCCESS_MESSAGE, "Feedback created", to_dict(feedback)), 201
