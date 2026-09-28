from app.db import BaseDAO, get_instructor_email
from app.models import Course, Lesson


class LessonDAO(BaseDAO):
    def get_course(self, course_id: int):
        return self.session.query(Course).filter(Course.id == course_id).one_or_none()

    def course_owned_by(self, course: Course, current_user) -> bool:
        if current_user["role"] == "admin":
            return True
        return course.course_author_email == get_instructor_email(self.session, current_user)

    def get_all_for_course(self, course_id: int):
        return self.session.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.sequence_order).all()

    def get_by_id(self, lesson_id: int):
        return self.session.query(Lesson).filter(Lesson.id == lesson_id).one_or_none()

    def create(self, course_id: int, fields: dict) -> Lesson:
        lesson = Lesson(course_id=course_id, **fields)
        self.session.add(lesson)
        self.session.flush()
        return lesson

    def update(self, lesson: Lesson, fields: dict) -> Lesson:
        for key, value in fields.items():
            setattr(lesson, key, value)
        self.session.flush()
        return lesson

    def delete(self, lesson: Lesson):
        self.session.delete(lesson)
