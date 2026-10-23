import io
import re
from decimal import Decimal

import openpyxl
from flask import Blueprint, g, request
from pydantic import BaseModel, ConfigDict, EmailStr, ValidationError

from app.auth.auth_utils import hash_password, require_role, verify_jwt_token
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.db import to_dict
from app.instructors.instructors_dao import InstructorDAO
from app.instructors.instructors_import import map_instructor_row
from app.models import Course, Instructor, TravelPreference, User, UserRole

instructors_api = Blueprint("instructors_api", __name__, url_prefix="/v1/instructors")


class InstructorCreateRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    location: str | None = None
    travel_preference: TravelPreference | None = None
    languages: str | None = None
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    skills_products: str | None = None
    courses_can_teach: str | None = None
    external_courses_owned: str | None = None
    feedback_score: Decimal | None = None
    comments: str | None = None
    owned_course_ids: list[int] | None = None


class InstructorUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    phone: str | None = None
    location: str | None = None
    travel_preference: TravelPreference | None = None
    languages: str | None = None
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    skills_products: str | None = None
    courses_can_teach: str | None = None
    external_courses_owned: str | None = None
    feedback_score: Decimal | None = None
    comments: str | None = None
    owned_course_ids: list[int] | None = None


def _is_own_record(current_user, instructor_id: int) -> bool:
    return current_user["role"] == "admin" or current_user.get("instructor_id") == instructor_id


def _instructor_to_dict(instructor) -> dict:
    d = to_dict(instructor)
    owned = []
    # 1. In-repository courses
    if hasattr(instructor, "courses") and instructor.courses:
        for c in instructor.courses:
            status_val = c.status.value if hasattr(c.status, "value") else str(c.status)
            owned.append({
                "id": c.id,
                "course_name": c.course_name,
                "nfolks_course_code": c.nfolks_course_code,
                "status": status_val,
                "in_repository": True,
            })
    # 2. External / custom courses (not in repository)
    ext_raw = getattr(instructor, "external_courses_owned", None)
    if ext_raw:
        for name in [x.strip() for x in re.split(r"[;\n]", str(ext_raw)) if x.strip()]:
            owned.append({
                "id": None,
                "course_name": name,
                "nfolks_course_code": None,
                "status": "external",
                "in_repository": False,
            })
    d["courses_owned"] = owned
    return d


@instructors_api.route("", methods=["GET"])
@verify_jwt_token()
def list_instructors():
    with InstructorDAO() as dao:
        instructors = dao.get_all(request.args, g.current_user)
        return respond(SUCCESS_MESSAGE, "OK", [_instructor_to_dict(i) for i in instructors])


@instructors_api.route("/<int:instructor_id>", methods=["GET"])
@verify_jwt_token()
def get_instructor(instructor_id):
    if not _is_own_record(g.current_user, instructor_id):
        return respond(FAIL_MESSAGE, "Insufficient permissions"), 403
    with InstructorDAO() as dao:
        instructor = dao.get_by_id(instructor_id)
        if instructor is None:
            return respond(FAIL_MESSAGE, "Instructor not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", _instructor_to_dict(instructor))


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

        data = body.model_dump()
        owned_course_ids = data.pop("owned_course_ids", None)
        instructor = dao.create(data)

        if owned_course_ids is not None:
            instructor.courses = dao.session.query(Course).filter(Course.id.in_(owned_course_ids)).all()

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

        return respond(SUCCESS_MESSAGE, "Instructor created", _instructor_to_dict(instructor)), 201


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
        updates.pop("owned_course_ids", None)

    owned_course_ids = updates.pop("owned_course_ids", ...)

    with InstructorDAO() as dao:
        instructor = dao.get_by_id(instructor_id)
        if instructor is None:
            return respond(FAIL_MESSAGE, "Instructor not found"), 404

        if owned_course_ids is not ...:
            if owned_course_ids is not None:
                instructor.courses = dao.session.query(Course).filter(Course.id.in_(owned_course_ids)).all()
            else:
                instructor.courses = []

        instructor = dao.update(instructor, updates)

        # Synchronize linked User account if name or email changed
        user = dao.session.query(User).filter(User.instructor_id == instructor.id).one_or_none()
        if user:
            if "name" in updates and updates["name"]:
                user.full_name = updates["name"]
            dao.session.flush()

        return respond(SUCCESS_MESSAGE, "Instructor updated", _instructor_to_dict(instructor))


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


@instructors_api.route("/import", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def import_instructors():
    file = request.files.get("file")
    if file is None:
        return respond(FAIL_MESSAGE, "No file uploaded (expected multipart field 'file')"), 400

    file_bytes = file.read()
    if not file_bytes:
        return respond(FAIL_MESSAGE, "Uploaded file is empty"), 400

    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True, read_only=True)
    except Exception:
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)

    # 1. Identify Instructors sheet
    instructors_sheet_name = None
    for name in workbook.sheetnames:
        clean = name.strip().lower()
        if "instructor" in clean:
            instructors_sheet_name = name
            break
    if not instructors_sheet_name:
        instructors_sheet_name = workbook.sheetnames[0]

    sheet = workbook[instructors_sheet_name]
    row_iter = sheet.iter_rows(values_only=True)
    raw_headers = next(row_iter, None)
    if not raw_headers or not any(raw_headers):
        return respond(FAIL_MESSAGE, "Instructors sheet has no headers or is empty"), 400

    headers = [str(h).strip() if h is not None else None for h in raw_headers]

    created, updated, skipped, errors = 0, 0, 0, []

    # Precompute default password hash once outside the loop to avoid repeating bcrypt calculations
    default_password_hash = hash_password("nFolks")

    with InstructorDAO() as dao:
        all_instructors = dao.session.query(Instructor).all()
        instructor_by_email = {inst.email.strip().lower(): inst for inst in all_instructors if inst.email}
        instructor_by_name = {inst.name.strip().lower(): inst for inst in all_instructors if inst.name}

        all_users = dao.session.query(User).all()
        user_by_email = {u.email.strip().lower(): u for u in all_users if u.email}
        user_by_instructor_id = {u.instructor_id: u for u in all_users if u.instructor_id}

        batch_seen_emails = {}

        empty_streak = 0
        for row_number, raw_cells in enumerate(row_iter, start=2):
            if not raw_cells or not any(c is not None and str(c).strip() != "" for c in raw_cells):
                empty_streak += 1
                if empty_streak >= 30:
                    break
                continue

            empty_streak = 0
            row = {}
            for h, val in zip(headers, raw_cells):
                if h:
                    row[h] = val

            fields = map_instructor_row(row)
            name = fields.get("name")
            if not name:
                errors.append({"row": row_number, "reason": "Instructor name is required"})
                continue

            email = fields.get("email")
            if not email:
                errors.append({"row": row_number, "reason": "Email could not be determined"})
                continue

            email_key = email.strip().lower()

            try:
                body = InstructorCreateRequest(**fields)
                validated_data = body.model_dump()
            except ValidationError as ve:
                errors.append({"row": row_number, "reason": str(ve)})
                continue

            existing_inst = batch_seen_emails.get(email_key) or instructor_by_email.get(email_key)
            if not existing_inst and name.strip().lower() in instructor_by_name:
                existing_inst = instructor_by_name[name.strip().lower()]

            if existing_inst:
                changed_fields = {}
                for k, new_val in validated_data.items():
                    curr_val = getattr(existing_inst, k, None)
                    curr_cmp = curr_val.value if hasattr(curr_val, "value") else curr_val
                    new_cmp = new_val.value if hasattr(new_val, "value") else new_val

                    if isinstance(curr_cmp, str) and isinstance(new_cmp, str):
                        if curr_cmp.strip() == new_cmp.strip():
                            continue
                    elif curr_cmp == new_cmp:
                        continue

                    if new_val is not None:
                        changed_fields[k] = new_val

                if changed_fields:
                    for k, v in changed_fields.items():
                        setattr(existing_inst, k, v)

                    linked_user = user_by_instructor_id.get(existing_inst.id) or user_by_email.get(email_key)
                    if linked_user and "name" in changed_fields:
                        linked_user.full_name = existing_inst.name

                    updated += 1
                else:
                    skipped += 1

                batch_seen_emails[email_key] = existing_inst
            else:
                new_inst = Instructor(**validated_data)
                dao.session.add(new_inst)

                existing_user = user_by_email.get(email_key)
                if existing_user:
                    existing_user.instructor = new_inst
                    existing_user.role = UserRole.instructor
                    existing_user.full_name = new_inst.name
                else:
                    new_user = User(
                        email=new_inst.email,
                        password_hash=default_password_hash,
                        role=UserRole.instructor,
                        full_name=new_inst.name,
                        instructor=new_inst,
                        must_change_password=True,
                    )
                    dao.session.add(new_user)
                    user_by_email[email_key] = new_user

                created += 1
                batch_seen_emails[email_key] = new_inst
                instructor_by_email[email_key] = new_inst
                instructor_by_name[new_inst.name.strip().lower()] = new_inst

    return respond(
        SUCCESS_MESSAGE,
        "Import completed",
        {
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
        },
    )

