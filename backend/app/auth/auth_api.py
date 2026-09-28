from flask import Blueprint, g, request
from pydantic import BaseModel, ConfigDict, EmailStr, ValidationError

from app.auth.auth_utils import check_password, hash_password, issue_token, require_role, verify_jwt_token
from app.auth.users_dao import UserDAO
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.models import UserRole

auth_api = Blueprint("auth_api", __name__, url_prefix="/v1/auth")
users_api = Blueprint("users_api", __name__, url_prefix="/v1/users")


def _user_to_dict(user) -> dict:
    """Never serialize password_hash."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "instructor_id": user.instructor_id,
        "must_change_password": user.must_change_password,
        "created_at": user.created_at.isoformat(),
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: UserRole
    instructor_id: int | None = None


class UpdateUserRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = None
    role: UserRole | None = None
    instructor_id: int | None = None
    password: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@auth_api.route("/login", methods=["POST"])
def login():
    try:
        body = LoginRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with UserDAO() as dao:
        user = dao.get_by_email(body.email)
        if user is None or not check_password(body.password, user.password_hash):
            return respond(FAIL_MESSAGE, "Invalid email or password"), 401
        token = issue_token(user)
        return respond(
            SUCCESS_MESSAGE,
            "Logged in",
            {
                "token": token,
                "id": user.id,
                "role": user.role.value,
                "full_name": user.full_name,
                "instructor_id": user.instructor_id,
                "must_change_password": user.must_change_password,
            },
        )


@auth_api.route("/change-password", methods=["POST"])
@verify_jwt_token()
def change_password():
    try:
        body = ChangePasswordRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with UserDAO() as dao:
        user = dao.get_by_id(g.current_user["id"])
        if not check_password(body.current_password, user.password_hash):
            return respond(FAIL_MESSAGE, "Current password is incorrect"), 401
        dao.update(user, {"password_hash": hash_password(body.new_password), "must_change_password": False})
        return respond(SUCCESS_MESSAGE, "Password updated", None)


@users_api.route("", methods=["GET"])
@verify_jwt_token()
@require_role("admin")
def list_users():
    with UserDAO() as dao:
        return respond(SUCCESS_MESSAGE, "OK", [_user_to_dict(u) for u in dao.get_all()])


@users_api.route("", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def create_user():
    try:
        body = CreateUserRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    if body.role == UserRole.instructor and body.instructor_id is None:
        return respond(FAIL_MESSAGE, "instructor_id is required when role=instructor"), 400

    with UserDAO() as dao:
        if dao.get_by_email(body.email) is not None:
            return respond(FAIL_MESSAGE, f"A user with email {body.email} already exists"), 400
        user = dao.create(
            email=body.email,
            password_hash=hash_password(body.password),
            full_name=body.full_name,
            role=body.role,
            instructor_id=body.instructor_id,
        )
        return respond(SUCCESS_MESSAGE, "User created", _user_to_dict(user)), 201


@users_api.route("/<int:user_id>", methods=["PUT"])
@verify_jwt_token()
@require_role("admin")
def update_user(user_id):
    try:
        body = UpdateUserRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    if body.role == UserRole.instructor and body.instructor_id is None:
        return respond(FAIL_MESSAGE, "instructor_id is required when role=instructor"), 400

    updates = body.model_dump(exclude_unset=True, exclude={"password"})
    if body.password:
        updates["password_hash"] = hash_password(body.password)
        updates["must_change_password"] = True  # admin-set password is temporary again

    with UserDAO() as dao:
        user = dao.get_by_id(user_id)
        if user is None:
            return respond(FAIL_MESSAGE, "User not found"), 404
        user = dao.update(user, updates)
        return respond(SUCCESS_MESSAGE, "User updated", _user_to_dict(user))


@users_api.route("/<int:user_id>", methods=["DELETE"])
@verify_jwt_token()
@require_role("admin")
def delete_user(user_id):
    if user_id == g.current_user["id"]:
        return respond(FAIL_MESSAGE, "You cannot delete your own account"), 400

    with UserDAO() as dao:
        user = dao.get_by_id(user_id)
        if user is None:
            return respond(FAIL_MESSAGE, "User not found"), 404
        dao.delete(user)
        return respond(SUCCESS_MESSAGE, "User deleted", None)
