from decimal import Decimal

from flask import Blueprint, g, request
from pydantic import BaseModel, ConfigDict, EmailStr, ValidationError

from app.auth.auth_utils import hash_password, require_role, verify_jwt_token
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.db import to_dict
from app.instructors.instructors_dao import InstructorDAO
from app.models import Instructor, TravelPreference, User, UserRole

instructors_api = Blueprint("instructors_api", __name__, url_prefix="/v1/instructors")


class InstructorCreateRequest(BaseModel):
    name: str
    email: EmailStr
    location: str | None = None
    travel_preference: TravelPreference | None = None
    languages: str | None = None
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    skills_products: str | None = None
    courses_can_teach: str | None = None
    feedback_score: Decimal | None = None
    comments: str | None = None


class InstructorUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    location: str | None = None
    travel_preference: TravelPreference | None = None
    languages: str | None = None
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    skills_products: str | None = None
    courses_can_teach: str | None = None
    feedback_score: Decimal | None = None
    comments: str | None = None


def _is_own_record(current_user, instructor_id: int) -> bool:
    return current_user["role"] == "admin" or current_user.get("instructor_id") == instructor_id


@instructors_api.route("", methods=["GET"])
@verify_jwt_token()
def list_instructors():
    with InstructorDAO() as dao:
        instructors = dao.get_all(request.args, g.current_user)
        return respond(SUCCESS_MESSAGE, "OK", [to_dict(i) for i in instructors])


@instructors_api.route("/<int:instructor_id>", methods=["GET"])
@verify_jwt_token()
def get_instructor(instructor_id):
    if not _is_own_record(g.current_user, instructor_id):
        return respond(FAIL_MESSAGE, "Insufficient permissions"), 403
    with InstructorDAO() as dao:
        instructor = dao.get_by_id(instructor_id)
        if instructor is None:
            return respond(FAIL_MESSAGE, "Instructor not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", to_dict(instructor))


@instructors_api.route("", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def create_instructor():
    try:
        body = InstructorCreateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with InstructorDAO() as dao:
        existing_inst = dao.session.query(Instructor).filter(Instructor.email == body.email).one_or_none()
        if existing_inst:
            return respond(FAIL_MESSAGE, f"An instructor with email {body.email} already exists"), 400

        instructor = dao.create(body.model_dump())

        # Automatically create or link a user account for the instructor with default password 'nFolks'
        user = dao.session.query(User).filter(User.email == instructor.email).one_or_none()
        if user:
            user.instructor_id = instructor.id
            user.role = UserRole.instructor
            user.full_name = instructor.name
        else:
            user = User(
                email=instructor.email,
                password_hash=hash_password("nFolks"),
                role=UserRole.instructor,
                full_name=instructor.name,
                instructor_id=instructor.id,
                must_change_password=True,
            )
            dao.session.add(user)
        dao.session.flush()

        return respond(SUCCESS_MESSAGE, "Instructor created", to_dict(instructor)), 201


@instructors_api.route("/<int:instructor_id>", methods=["PUT"])
@verify_jwt_token()
@require_role("admin", "instructor")
def update_instructor(instructor_id):
    if not _is_own_record(g.current_user, instructor_id):
        return respond(FAIL_MESSAGE, "Insufficient permissions"), 403
    try:
        body = InstructorUpdateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    updates = body.model_dump(exclude_unset=True)
    if g.current_user["role"] == "instructor":
        updates.pop("feedback_score", None)  # admin-assessed field, never self-editable

    with InstructorDAO() as dao:
        instructor = dao.get_by_id(instructor_id)
        if instructor is None:
            return respond(FAIL_MESSAGE, "Instructor not found"), 404
        instructor = dao.update(instructor, updates)

        # Synchronize linked User account if name or email changed
        user = dao.session.query(User).filter(User.instructor_id == instructor.id).one_or_none()
        if user:
            if "name" in updates and updates["name"]:
                user.full_name = updates["name"]
            dao.session.flush()

        return respond(SUCCESS_MESSAGE, "Instructor updated", to_dict(instructor))


@instructors_api.route("/<int:instructor_id>", methods=["DELETE"])
@verify_jwt_token()
@require_role("admin")
def delete_instructor(instructor_id):
    with InstructorDAO() as dao:
        instructor = dao.get_by_id(instructor_id)
        if instructor is None:
            return respond(FAIL_MESSAGE, "Instructor not found"), 404

        # Delete any linked user account before removing instructor profile
        user = dao.session.query(User).filter(User.instructor_id == instructor.id).one_or_none()
        if user:
            dao.session.delete(user)
            dao.session.flush()

        dao.delete(instructor)
        return respond(SUCCESS_MESSAGE, "Instructor deleted", None)
