import uuid
from app.courses.courses_api import course_to_dict
from app.courses.courses_dao import CourseDAO
from app.models import Course, Instructor


def test_course_multi_instructor_relation():
    with CourseDAO() as dao:
        instructors = dao.session.query(Instructor).limit(2).all()
        if len(instructors) < 2:
            return

        inst_ids = [instructors[0].id, instructors[1].id]
        code = f"TEST-INST-{uuid.uuid4().hex[:6]}"

        course = dao.create(
            {
                "course_name": "Test Course with Instructors",
                "nfolks_course_code": code,
                "instructor_ids": inst_ids,
            },
            {"role": "admin"},
        )
        dao.session.commit()

        fetched = dao.get_by_id(course.id, {"role": "admin"})
        assert fetched is not None
        assert len(fetched.instructors) == 2

        serialized = course_to_dict(fetched)
        assert len(serialized["instructors"]) == 2
        assert len(serialized["instructor_ids"]) == 2
        assert serialized["instructor"] != ""

        # Update test
        updated = dao.update(fetched, {"instructor_ids": [inst_ids[0]]})
        dao.session.commit()
        fetched_after = dao.get_by_id(course.id, {"role": "admin"})
        assert len(fetched_after.instructors) == 1

        # Cleanup
        dao.delete(fetched_after)
        dao.session.commit()


if __name__ == "__main__":
    test_course_multi_instructor_relation()
    print("test_course_multi_instructor_relation passed.")
