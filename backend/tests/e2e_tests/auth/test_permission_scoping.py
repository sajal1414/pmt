from tests.conftest import auth_headers
from tests.e2e_tests.common.base_test import assert_fail, assert_success


def test_instructor_can_create_and_update_own_course(client, instructor_and_token):
    _, token = instructor_and_token
    created = assert_success(
        client.post(
            "/v1/courses",
            json={"course_name": "Owned", "nfolks_course_code": "OWN-1", "course_author_email": "someone-else@x.com"},
            headers=auth_headers(token),
        ),
        201,
    )
    # author email is server-forced to the instructor's own, not the client-supplied value
    assert created["course_author_email"] == "jane@test.com"

    updated = assert_success(
        client.put(f"/v1/courses/{created['id']}", json={"course_name": "Renamed"}, headers=auth_headers(token))
    )
    assert updated["course_name"] == "Renamed"


def test_instructor_forbidden_updating_others_course(client, admin_token, instructor_and_token):
    _, token = instructor_and_token
    others_course = assert_success(
        client.post(
            "/v1/courses",
            json={"course_name": "Admins", "nfolks_course_code": "ADM-1", "course_author_email": "admin@x.com"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    resp = client.put(f"/v1/courses/{others_course['id']}", json={"course_name": "hacked"}, headers=auth_headers(token))
    assert_fail(resp, 403)


def test_instructor_forbidden_deleting_own_course(client, instructor_and_token):
    _, token = instructor_and_token
    created = assert_success(
        client.post(
            "/v1/courses", json={"course_name": "Owned", "nfolks_course_code": "OWN-2"}, headers=auth_headers(token)
        ),
        201,
    )
    assert_fail(client.delete(f"/v1/courses/{created['id']}", headers=auth_headers(token)), 403)


def test_instructor_sees_only_own_courses_in_list(client, admin_token, instructor_and_token):
    _, token = instructor_and_token
    assert_success(
        client.post(
            "/v1/courses",
            json={"course_name": "Admins", "nfolks_course_code": "ADM-2", "course_author_email": "admin@x.com"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    assert_success(
        client.post(
            "/v1/courses", json={"course_name": "Mine", "nfolks_course_code": "MINE-1"}, headers=auth_headers(token)
        ),
        201,
    )

    data = assert_success(client.get("/v1/courses", headers=auth_headers(token)))
    assert [c["nfolks_course_code"] for c in data] == ["MINE-1"]


def test_instructor_sees_only_own_instructor_record(client, admin_token, instructor_and_token):
    instructor_id, token = instructor_and_token
    other = assert_success(
        client.post(
            "/v1/instructors", json={"name": "Bob", "email": "bob@test.com"}, headers=auth_headers(admin_token)
        ),
        201,
    )

    data = assert_success(client.get("/v1/instructors", headers=auth_headers(token)))
    assert [i["id"] for i in data] == [instructor_id]

    assert_fail(client.get(f"/v1/instructors/{other['id']}", headers=auth_headers(token)), 403)


def test_instructor_cannot_edit_own_feedback_score(client, instructor_and_token):
    instructor_id, token = instructor_and_token
    updated = assert_success(
        client.put(
            f"/v1/instructors/{instructor_id}",
            json={"feedback_score": 5.0, "location": "Dallas"},
            headers=auth_headers(token),
        )
    )
    assert updated["feedback_score"] is None
    assert updated["location"] == "Dallas"


def test_instructor_forbidden_writing_delivery_and_delivery_feedback(client, instructor_and_token):
    _, token = instructor_and_token
    assert_fail(client.post("/v1/deliveries", json={"student_name": "Bob"}, headers=auth_headers(token)), 403)
