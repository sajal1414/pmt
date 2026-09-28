from app.courses.courses_dao import CourseDAO
from app.query_utils import ISNULL_SENTINEL


def _admin_user():
    return {"role": "admin", "instructor_id": None}


def test_parse_filters_equality(client):
    with CourseDAO() as dao:
        dao.create({"course_name": "A", "nfolks_course_code": "A-1", "vendor": "IBM"}, _admin_user())
        dao.create({"course_name": "B", "nfolks_course_code": "B-1", "vendor": "RedHat"}, _admin_user())

    with CourseDAO() as dao:
        results = dao.get_all({"vendor": "IBM"}, _admin_user())
        assert [c.nfolks_course_code for c in results] == ["A-1"]


def test_parse_filters_isnull_sentinel(client):
    with CourseDAO() as dao:
        dao.create({"course_name": "A", "nfolks_course_code": "A-1", "lab_location": "na"}, _admin_user())
        dao.create({"course_name": "B", "nfolks_course_code": "B-1"}, _admin_user())  # lab_location left null

    with CourseDAO() as dao:
        results = dao.get_all({"lab_location": ISNULL_SENTINEL}, _admin_user())
        assert [c.nfolks_course_code for c in results] == ["B-1"]


def test_parse_sort_falls_back_to_default_on_unknown_column(client):
    with CourseDAO() as dao:
        dao.create({"course_name": "Z", "nfolks_course_code": "Z-1"}, _admin_user())
        dao.create({"course_name": "A", "nfolks_course_code": "A-1"}, _admin_user())

    with CourseDAO() as dao:
        results = dao.get_all({"sort_by": "not_a_real_column"}, _admin_user())
        # falls back to default_sort="id", so insertion order (Z-1 then A-1) is preserved
        assert [c.nfolks_course_code for c in results] == ["Z-1", "A-1"]


def test_pagination_limit_and_offset(client):
    with CourseDAO() as dao:
        for i in range(5):
            dao.create({"course_name": f"C{i}", "nfolks_course_code": f"C-{i}"}, _admin_user())

    with CourseDAO() as dao:
        page = dao.get_all({"limit": "2", "offset": "1"}, _admin_user())
        assert [c.nfolks_course_code for c in page] == ["C-1", "C-2"]
