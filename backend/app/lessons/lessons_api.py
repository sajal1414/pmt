import mimetypes
import uuid

from flask import Blueprint, g, request
from pydantic import BaseModel, ConfigDict, ValidationError

from app.auth.auth_utils import require_role, verify_jwt_token
from app.config import FAIL_MESSAGE, SUCCESS_MESSAGE, respond
from app.db import to_dict
from app.lessons.lessons_dao import LessonDAO
from app.s3_utils import create_presigned_playback_url, create_presigned_upload_post

lessons_api = Blueprint("lessons_api", __name__)


class LessonCreateRequest(BaseModel):
    title: str
    description: str | None = None
    sequence_order: int = 0
    duration_minutes: int | None = None
    attachment_url: str | None = None


class LessonUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    description: str | None = None
    sequence_order: int | None = None
    duration_minutes: int | None = None
    attachment_url: str | None = None


def _visible_course_or_error(dao: LessonDAO, course_id: int, current_user):
    course = dao.get_course(course_id)
    if course is None:
        return None, (respond(FAIL_MESSAGE, "Course not found"), 404)
    if current_user["role"] == "instructor" and not dao.course_owned_by(course, current_user):
        return None, (respond(FAIL_MESSAGE, "Course not found"), 404)
    return course, None


@lessons_api.route("/v1/courses/<int:course_id>/lessons", methods=["GET"])
@verify_jwt_token()
def list_lessons(course_id):
    with LessonDAO() as dao:
        course, error = _visible_course_or_error(dao, course_id, g.current_user)
        if error:
            return error
        return respond(SUCCESS_MESSAGE, "OK", [to_dict(lesson) for lesson in dao.get_all_for_course(course_id)])


@lessons_api.route("/v1/courses/<int:course_id>/lessons", methods=["POST"])
@verify_jwt_token()
@require_role("admin", "instructor")
def create_lesson(course_id):
    try:
        body = LessonCreateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with LessonDAO() as dao:
        course = dao.get_course(course_id)
        if course is None:
            return respond(FAIL_MESSAGE, "Course not found"), 404
        if not dao.course_owned_by(course, g.current_user):
            return respond(FAIL_MESSAGE, "You do not own this course"), 403
        lesson = dao.create(course_id, body.model_dump())
        return respond(SUCCESS_MESSAGE, "Lesson created", to_dict(lesson)), 201


@lessons_api.route("/v1/lessons/<int:lesson_id>", methods=["GET"])
@verify_jwt_token()
def get_lesson(lesson_id):
    with LessonDAO() as dao:
        lesson = dao.get_by_id(lesson_id)
        if lesson is None:
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        course = dao.get_course(lesson.course_id)
        if g.current_user["role"] == "instructor" and not dao.course_owned_by(course, g.current_user):
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        return respond(SUCCESS_MESSAGE, "OK", to_dict(lesson))


@lessons_api.route("/v1/lessons/<int:lesson_id>", methods=["PUT"])
@verify_jwt_token()
@require_role("admin", "instructor")
def update_lesson(lesson_id):
    try:
        body = LessonUpdateRequest(**request.get_json(force=True))
    except ValidationError as e:
        return respond(FAIL_MESSAGE, str(e)), 400

    with LessonDAO() as dao:
        lesson = dao.get_by_id(lesson_id)
        if lesson is None:
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        course = dao.get_course(lesson.course_id)
        if not dao.course_owned_by(course, g.current_user):
            return respond(FAIL_MESSAGE, "You do not own this lesson's course"), 403
        updates = body.model_dump(exclude_unset=True)
        if updates.get("attachment_url"):
            # a pasted link replaces any uploaded file
            updates["attachment_s3_key"] = None
            updates["attachment_content_type"] = None
        lesson = dao.update(lesson, updates)
        return respond(SUCCESS_MESSAGE, "Lesson updated", to_dict(lesson))


@lessons_api.route("/v1/lessons/<int:lesson_id>", methods=["DELETE"])
@verify_jwt_token()
@require_role("admin")
def delete_lesson(lesson_id):
    with LessonDAO() as dao:
        lesson = dao.get_by_id(lesson_id)
        if lesson is None:
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        dao.delete(lesson)
        return respond(SUCCESS_MESSAGE, "Lesson deleted", None)


@lessons_api.route("/v1/lessons/<int:lesson_id>/attachment", methods=["POST"])
@verify_jwt_token()
@require_role("admin", "instructor")
def request_attachment_upload(lesson_id):
    content_type = request.get_json(force=True).get("content_type", "application/pdf")

    with LessonDAO() as dao:
        lesson = dao.get_by_id(lesson_id)
        if lesson is None:
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        course = dao.get_course(lesson.course_id)
        if not dao.course_owned_by(course, g.current_user):
            return respond(FAIL_MESSAGE, "You do not own this lesson's course"), 403

        extension = mimetypes.guess_extension(content_type) or ""
        s3_key = f"lesson-attachments/{lesson_id}/{uuid.uuid4().hex}{extension}"
        upload = create_presigned_upload_post(s3_key, content_type)
        dao.update(
            lesson,
            {"attachment_s3_key": s3_key, "attachment_url": None, "attachment_content_type": content_type},
        )
        return respond(SUCCESS_MESSAGE, "Upload URL created", {"s3_key": s3_key, "upload": upload})


@lessons_api.route("/v1/lessons/<int:lesson_id>/attachment", methods=["GET"])
@verify_jwt_token()
def get_attachment_url(lesson_id):
    with LessonDAO() as dao:
        lesson = dao.get_by_id(lesson_id)
        if lesson is None:
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        course = dao.get_course(lesson.course_id)
        if g.current_user["role"] == "instructor" and not dao.course_owned_by(course, g.current_user):
            return respond(FAIL_MESSAGE, "Lesson not found"), 404
        if not lesson.attachment_s3_key:
            return respond(FAIL_MESSAGE, "No file uploaded for this lesson"), 404
        url = create_presigned_playback_url(lesson.attachment_s3_key)
        return respond(SUCCESS_MESSAGE, "OK", {"playback_url": url, "content_type": lesson.attachment_content_type})
