from tests.conftest import auth_headers
from tests.e2e_tests.common.base_test import assert_fail, assert_success


def _create_course(client, token, **overrides):
    body = {"course_name": "Test Course", "nfolks_course_code": "TST-001", "status": "draft"}
    body.update(overrides)
    return client.post("/v1/courses", json=body, headers=auth_headers(token))


def test_create_requires_auth(client):
    resp = client.post("/v1/courses", json={"course_name": "X", "nfolks_course_code": "X-1"})
    assert resp.status_code == 401


def test_create_and_get_course_round_trip(client, admin_token):
    created = assert_success(_create_course(client, admin_token), 201)
    resp = client.get(f"/v1/courses/{created['id']}", headers=auth_headers(admin_token))
    fetched = assert_success(resp)
    assert fetched["nfolks_course_code"] == "TST-001"


def test_list_filters_by_status(client, admin_token):
    assert_success(_create_course(client, admin_token, nfolks_course_code="TST-A", status="published"), 201)
    assert_success(_create_course(client, admin_token, nfolks_course_code="TST-B", status="draft"), 201)

    resp = client.get("/v1/courses?status=published", headers=auth_headers(admin_token))
    data = assert_success(resp)
    assert [c["nfolks_course_code"] for c in data] == ["TST-A"]


def test_list_filters_by_retire_date_range_90_days(client, admin_token):
    assert_success(_create_course(client, admin_token, nfolks_course_code="EXPIRING", retire_date="2026-10-01"), 201)
    assert_success(_create_course(client, admin_token, nfolks_course_code="FAR-FUTURE", retire_date="2030-01-01"), 201)

    resp = client.get(
        "/v1/courses?retire_date_from=2026-09-12&retire_date_to=2026-12-11", headers=auth_headers(admin_token)
    )
    data = assert_success(resp)
    assert [c["nfolks_course_code"] for c in data] == ["EXPIRING"]


def test_list_filters_courses_without_labs(client, admin_token):
    assert_success(_create_course(client, admin_token, nfolks_course_code="NO-LAB", lab_location="na"), 201)
    assert_success(_create_course(client, admin_token, nfolks_course_code="HAS-LAB", lab_location="ITZ"), 201)

    resp = client.get("/v1/courses?lab_location=na", headers=auth_headers(admin_token))
    data = assert_success(resp)
    assert [c["nfolks_course_code"] for c in data] == ["NO-LAB"]


def test_update_rejects_unknown_field(client, admin_token):
    created = assert_success(_create_course(client, admin_token), 201)
    resp = client.put(f"/v1/courses/{created['id']}", json={"not_a_real_field": 1}, headers=auth_headers(admin_token))
    assert_fail(resp, 400)


def test_delete_removes_course(client, admin_token):
    created = assert_success(_create_course(client, admin_token), 201)
    assert_success(client.delete(f"/v1/courses/{created['id']}", headers=auth_headers(admin_token)))
    assert_fail(client.get(f"/v1/courses/{created['id']}", headers=auth_headers(admin_token)), 404)


def test_delete_course_cascades_lessons(client, admin_token):
    course = assert_success(_create_course(client, admin_token), 201)
    lesson = assert_success(
        client.post(
            f"/v1/courses/{course['id']}/lessons",
            json={"title": "Lesson 1", "sequence_order": 1},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    client.delete(f"/v1/courses/{course['id']}", headers=auth_headers(admin_token))
    assert_fail(client.get(f"/v1/lessons/{lesson['id']}", headers=auth_headers(admin_token)), 404)


def test_lessons_are_returned_ordered_by_sequence(client, admin_token):
    course = assert_success(_create_course(client, admin_token), 201)
    for order, title in [(2, "Second"), (1, "First"), (3, "Third")]:
        assert_success(
            client.post(
                f"/v1/courses/{course['id']}/lessons",
                json={"title": title, "sequence_order": order},
                headers=auth_headers(admin_token),
            ),
            201,
        )

    data = assert_success(client.get(f"/v1/courses/{course['id']}/lessons", headers=auth_headers(admin_token)))
    assert [lesson["title"] for lesson in data] == ["First", "Second", "Third"]
