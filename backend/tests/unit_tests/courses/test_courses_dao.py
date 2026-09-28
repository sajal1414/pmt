from app.courses.courses_dao import CourseDAO
from app.instructors.instructors_dao import InstructorDAO


def _make_instructor_user():
    with InstructorDAO() as dao:
        instructor = dao.create({"name": "Jane", "email": "jane@dao-test.com"})
        return {"role": "instructor", "instructor_id": instructor.id}


def test_create_forces_author_email_for_instructor_role(client):
    instructor_user = _make_instructor_user()
    with CourseDAO() as dao:
        course = dao.create(
            {"course_name": "X", "nfolks_course_code": "X-1", "course_author_email": "someone-else@evil.com"},
            instructor_user,
        )
        assert course.course_author_email == "jane@dao-test.com"


def test_owns_true_for_admin_regardless_of_author(client):
    with CourseDAO() as dao:
        course = dao.create(
            {"course_name": "X", "nfolks_course_code": "X-1", "course_author_email": "a@b.com"},
            {"role": "admin", "instructor_id": None},
        )
        assert dao.owns(course, {"role": "admin", "instructor_id": None}) is True


def test_owns_false_for_instructor_who_is_not_the_author(client):
    instructor_user = _make_instructor_user()
    with CourseDAO() as dao:
        course = dao.create(
            {"course_name": "X", "nfolks_course_code": "X-1", "course_author_email": "not-jane@x.com"},
            {"role": "admin", "instructor_id": None},
        )
        assert dao.owns(course, instructor_user) is False


def test_get_all_scopes_instructor_to_own_authored_courses(client):
    instructor_user = _make_instructor_user()
    with CourseDAO() as dao:
        dao.create({"course_name": "Mine", "nfolks_course_code": "MINE-1"}, instructor_user)
        dao.create(
            {"course_name": "Not mine", "nfolks_course_code": "OTHER-1", "course_author_email": "other@x.com"},
            {"role": "admin", "instructor_id": None},
        )

    with CourseDAO() as dao:
        results = dao.get_all({}, instructor_user)
        assert [c.nfolks_course_code for c in results] == ["MINE-1"]
