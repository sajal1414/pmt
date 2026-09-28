import uuid
from datetime import date
from decimal import Decimal

import openpyxl
from flask import Blueprint, Response, g, request
from pydantic import BaseModel, ConfigDict, ValidationError

from app.auth.auth_utils import require_role, verify_jwt_token
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.courses.course_pdf import generate_course_outline_pdf
from app.courses.courses_dao import CourseDAO
from app.courses.courses_import import map_lesson_row, map_row
from app.db import to_dict
from app.models import Course, CourseOutlineStatus, CourseStatus, IPOwner, LabLocation, Lesson, SkillLevel
from app.s3_utils import create_presigned_playback_url, create_presigned_upload_post

courses_api = Blueprint("courses_api", __name__, url_prefix="/v1/courses")


class CourseCreateRequest(BaseModel):
    course_name: str
    nfolks_course_code: str
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    ibm_course_codes: str | None = None
    status: CourseStatus = CourseStatus.backlog
    course_outline_status: CourseOutlineStatus | None = None
    modality: str | None = None
    duration_days: Decimal | None = None
    num_hours: Decimal | None = None
    on_ibm_pmt: str | None = None
    lab_location: LabLocation | None = None
    ibm_retirement_date: date | None = None
    ip_owner: IPOwner | None = None
    course_author_email: str | None = None
    planned_completion_date: date | None = None
    release_date: date | None = None
    retire_date: date | None = None
    course_description: str | None = None
    link_to_course_outline: str | None = None
    skill_level: SkillLevel | None = None
    max_students: int | None = None
    pre_reqs: str | None = None
    persona_audience_type: str | None = None
    lab_configuration: str | None = None
    course_technical_requirements: str | None = None
    delivery_instruction_notes: str | None = None
    instructor_daily_rate: Decimal | None = None
    materials_cost: Decimal | None = None
    lab_cost: Decimal | None = None
    learning_path: str | None = None
    badge: str | None = None
    certification: str | None = None
    notes: str | None = None
    record_source: str | None = None


class CourseUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    course_name: str | None = None
    nfolks_course_code: str | None = None
    vendor: str | None = None
    platform: str | None = None
    portfolio: str | None = None
    product: str | None = None
    ibm_course_codes: str | None = None
    status: CourseStatus | None = None
    course_outline_status: CourseOutlineStatus | None = None
    modality: str | None = None
    duration_days: Decimal | None = None
    num_hours: Decimal | None = None
    on_ibm_pmt: str | None = None
    lab_location: LabLocation | None = None
    ibm_retirement_date: date | None = None
    ip_owner: IPOwner | None = None
    course_author_email: str | None = None
    planned_completion_date: date | None = None
    release_date: date | None = None
    retire_date: date | None = None
    course_description: str | None = None
    link_to_course_outline: str | None = None
    skill_level: SkillLevel | None = None
    max_students: int | None = None
    pre_reqs: str | None = None
    persona_audience_type: str | None = None
    lab_configuration: str | None = None
    course_technical_requirements: str | None = None
    delivery_instruction_notes: str | None = None
    instructor_daily_rate: Decimal | None = None
    materials_cost: Decimal | None = None
    lab_cost: Decimal | None = None
    learning_path: str | None = None
    badge: str | None = None
    certification: str | None = None
    notes: str | None = None
    record_source: str | None = None


@courses_api.route("", methods=["GET"])
@verify_jwt_token()
def list_courses():
    with CourseDAO() as dao:
        courses = dao.get_all(request.args, g.current_user)
        return respond(SUCCESS_MESSAGE, "OK", [to_dict(c) for c in courses])


@courses_api.route("/<int:course_id>", methods=["GET"])
@verify_jwt_token()
def get_course(course_id):
    with CourseDAO() as dao:
        course = dao.get_by_id(course_id, g.current_user)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", to_dict(course))


@courses_api.route("", methods=["POST"])
@verify_jwt_token()
@require_role("admin", "instructor")
def create_course():
    try:
        body = CourseCreateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with CourseDAO() as dao:
        course = dao.create(body.model_dump(), g.current_user)
        return respond(SUCCESS_MESSAGE, "Course created", to_dict(course)), 201


@courses_api.route("/<int:course_id>", methods=["PUT"])
@verify_jwt_token()
@require_role("admin", "instructor")
def update_course(course_id):
    try:
        body = CourseUpdateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with CourseDAO() as dao:
        course = dao.get_raw_by_id(course_id)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        if not dao.owns(course, g.current_user):
            return respond(FAIL_MESSAGE, "You do not own this course"), 403
        updates = body.model_dump(exclude_unset=True)
        if g.current_user["role"] == "instructor":
            updates.pop("course_author_email", None)
        course = dao.update(course, updates)
        return respond(SUCCESS_MESSAGE, "Course updated", to_dict(course))


@courses_api.route("/<int:course_id>", methods=["DELETE"])
@verify_jwt_token()
@require_role("admin")
def delete_course(course_id):
    with CourseDAO() as dao:
        course = dao.get_raw_by_id(course_id)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        dao.delete(course)
        return respond(SUCCESS_MESSAGE, "Course deleted", None)


@courses_api.route("/<int:course_id>/outline", methods=["POST"])
@verify_jwt_token()
@require_role("admin", "instructor")
def request_outline_upload(course_id):
    content_type = request.get_json(force=True).get("content_type", "application/pdf")

    with CourseDAO() as dao:
        course = dao.get_raw_by_id(course_id)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        if not dao.owns(course, g.current_user):
            return respond(FAIL_MESSAGE, "You do not own this course"), 403

        s3_key = f"outlines/{course_id}/{uuid.uuid4().hex}.pdf"
        upload = create_presigned_upload_post(s3_key, content_type)
        course.course_outline_s3_key = s3_key
        return respond(SUCCESS_MESSAGE, "Upload URL created", {"s3_key": s3_key, "upload": upload})


@courses_api.route("/<int:course_id>/outline", methods=["GET"])
@verify_jwt_token()
def get_outline_url(course_id):
    with CourseDAO() as dao:
        course = dao.get_by_id(course_id, g.current_user)
        if course is None or not course.course_outline_s3_key:
            return respond(FAIL_MESSAGE, "No outline uploaded for this course"), 404
        url = create_presigned_playback_url(course.course_outline_s3_key)
        return respond(SUCCESS_MESSAGE, "OK", {"playback_url": url})


@courses_api.route("/<int:course_id>/outline/pdf", methods=["GET"])
@verify_jwt_token()
def download_course_outline_pdf(course_id):
    with CourseDAO() as dao:
        course = dao.get_by_id(course_id, g.current_user)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        pdf_bytes = generate_course_outline_pdf(course)
        code = course.nfolks_course_code or f"COURSE-{course.id}"
        safe_code = "".join(c for c in code if c.isalnum() or c in ("-", "_"))
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_code}_Course_Outline.pdf"',
                "Content-Type": "application/pdf",
            },
        )


@courses_api.route("/import", methods=["POST"])
@verify_jwt_token()
@require_role("admin")
def import_courses():
    file = request.files.get("file")
    if file is None:
        return respond(FAIL_MESSAGE, "No file uploaded (expected multipart field 'file')"), 400

    workbook = openpyxl.load_workbook(file, read_only=True, data_only=True)

    # 1. Identify Courses sheet
    courses_sheet_name = None
    for name in workbook.sheetnames:
        clean = name.strip().lower()
        if "course directory" in clean or "course catalog" in clean or clean in ("courses", "course"):
            courses_sheet_name = name
            break
    if not courses_sheet_name:
        courses_sheet_name = workbook.sheetnames[0]

    sheet = workbook[courses_sheet_name]
    rows = sheet.iter_rows(values_only=True)
    try:
        headers = next(rows)
    except StopIteration:
        return respond(FAIL_MESSAGE, "Courses sheet is empty"), 400

    created, updated, skipped, errors = 0, 0, 0, []
    lessons_created, lesson_errors = 0, []

    with CourseDAO() as dao:
        existing_codes = {code for (code,) in dao.session.query(Course.nfolks_course_code).all()}
        seen_codes = set()
        course_code_to_id = {}

        # Populate course_code_to_id for any other existing courses in DB
        all_courses = dao.session.query(Course.id, Course.nfolks_course_code).all()
        for c_id, c_code in all_courses:
            if c_code:
                course_code_to_id[str(c_code).strip()] = c_id

        # Detect single-sheet mode if sheet headers contain lesson attributes
        clean_headers_set = {str(h).strip().lower() for h in headers if h}
        single_sheet_mode = bool(clean_headers_set & {"lesson title", "title", "class name", "video link", "video url", "attachment url"})

        for row_number, raw_row in enumerate(rows, start=2):
            if raw_row is None or all(c is None or str(c).strip() == "" for c in raw_row):
                continue
            row = dict(zip(headers, raw_row))
            fields = map_row(row)
            code = fields.get("nfolks_course_code")
            if not code and fields.get("course_name"):
                code = f"ATLAS-BK-{row_number:03d}"
                fields["nfolks_course_code"] = code

            target_course_id = None
            if code:
                code_str = str(code).strip()
                if code_str in course_code_to_id:
                    target_course_id = course_code_to_id[code_str]
                    existing_course = dao.get_raw_by_id(target_course_id)
                    if existing_course:
                        try:
                            body = CourseUpdateRequest(**fields)
                            dao.update(existing_course, body.model_dump(exclude_unset=True))
                            updated += 1
                        except Exception:
                            pass
                else:
                    try:
                        body = CourseCreateRequest(**fields)
                        new_course = dao.create(body.model_dump(), g.current_user)
                        course_code_to_id[code_str] = new_course.id
                        target_course_id = new_course.id
                        seen_codes.add(code_str)
                        created += 1
                    except ValidationError as e:
                        errors.append({"row": row_number, "reason": str(e)})
                        skipped += 1
                        continue

            # In single-sheet mode, process lesson columns on this row if present
            if single_sheet_mode and target_course_id:
                l_fields = map_lesson_row(row)
                if l_fields.get("title") or l_fields.get("attachment_url") or l_fields.get("description"):
                    title = l_fields.get("title") or f"Lesson {l_fields.get('sequence_order', 1)}"
                    url = l_fields.get("attachment_url")
                    c_type = l_fields.get("attachment_content_type")
                    if not c_type and url:
                        c_type = "video" if ("youtube" in url or "youtu.be" in url or ".mp4" in url) else "document"
                    elif not c_type:
                        c_type = "article"

                    existing_lesson = (
                        dao.session.query(Lesson)
                        .filter(Lesson.course_id == target_course_id, Lesson.title.ilike(title.strip()))
                        .first()
                    )
                    if existing_lesson:
                        if l_fields.get("description"):
                            existing_lesson.description = l_fields.get("description")
                        if l_fields.get("duration_minutes"):
                            existing_lesson.duration_minutes = l_fields.get("duration_minutes")
                        if url:
                            existing_lesson.attachment_url = url
                            existing_lesson.attachment_content_type = c_type
                    else:
                        lesson = Lesson(
                            course_id=target_course_id,
                            title=title,
                            description=l_fields.get("description"),
                            sequence_order=l_fields.get("sequence_order", 1),
                            duration_minutes=l_fields.get("duration_minutes"),
                            attachment_url=url,
                            attachment_content_type=c_type,
                        )
                        dao.session.add(lesson)
                        lessons_created += 1

        # 2. Check for separate Lessons / Classes sheet (if present and different from courses sheet)
        lessons_sheet_name = None
        for name in workbook.sheetnames:
            if name.strip().lower() in ("lessons", "lesson", "classes", "class", "course_lessons", "course lessons"):
                lessons_sheet_name = name
                break

        if lessons_sheet_name and lessons_sheet_name != courses_sheet_name:
            lesson_sheet = workbook[lessons_sheet_name]
            lesson_rows = lesson_sheet.iter_rows(values_only=True)
            try:
                l_headers = next(lesson_rows)
            except StopIteration:
                l_headers = None

            if l_headers:
                for l_row_num, raw_l_row in enumerate(lesson_rows, start=2):
                    if raw_l_row is None or all(c is None or str(c).strip() == "" for c in raw_l_row):
                        continue
                    l_dict = dict(zip(l_headers, raw_l_row))
                    l_fields = map_lesson_row(l_dict)

                    code = l_fields.get("course_code")
                    if not code:
                        lesson_errors.append({"row": l_row_num, "reason": "Missing course code for lesson"})
                        continue

                    target_course_id = course_code_to_id.get(str(code).strip())
                    if not target_course_id:
                        lesson_errors.append({"row": l_row_num, "reason": f"Course code not found: {code}"})
                        continue

                    title = l_fields.get("title") or f"Lesson {l_fields.get('sequence_order', 1)}"
                    url = l_fields.get("attachment_url")
                    c_type = l_fields.get("attachment_content_type")
                    if not c_type and url:
                        c_type = "video" if ("youtube" in url or "youtu.be" in url or ".mp4" in url) else "document"
                    elif not c_type:
                        c_type = "article"

                    # Deduplicate: check if a lesson with this title already exists for this course
                    existing_lesson = (
                        dao.session.query(Lesson)
                        .filter(
                            Lesson.course_id == target_course_id,
                            Lesson.title.ilike(title.strip()),
                        )
                        .first()
                    )
                    if existing_lesson:
                        if l_fields.get("description"):
                            existing_lesson.description = l_fields.get("description")
                        if l_fields.get("duration_minutes"):
                            existing_lesson.duration_minutes = l_fields.get("duration_minutes")
                        if url:
                            existing_lesson.attachment_url = url
                            existing_lesson.attachment_content_type = c_type
                        continue

                    lesson = Lesson(
                        course_id=target_course_id,
                        title=title,
                        description=l_fields.get("description"),
                        sequence_order=l_fields.get("sequence_order", 1),
                        duration_minutes=l_fields.get("duration_minutes"),
                        attachment_url=url,
                        attachment_content_type=c_type,
                    )
                    dao.session.add(lesson)
                    lessons_created += 1

        dao.session.commit()

    return respond(
        SUCCESS_MESSAGE,
        "Import complete",
        {
            "created": created,
            "updated": updated,
            "lessons_created": lessons_created,
            "skipped": skipped,
            "errors": errors + lesson_errors,
        },
    )
