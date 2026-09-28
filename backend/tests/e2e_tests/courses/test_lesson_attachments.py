from tests.conftest import auth_headers
from tests.e2e_tests.common.base_test import assert_success


def _create_course_with_lesson(client, token):
    course = assert_success(
        client.post(
            "/v1/courses", json={"course_name": "X", "nfolks_course_code": "ATT-1"}, headers=auth_headers(token)
        ),
        201,
    )
    lesson = assert_success(
        client.post(
            f"/v1/courses/{course['id']}/lessons",
            json={"title": "L1", "sequence_order": 1},
            headers=auth_headers(token),
        ),
        201,
    )
    return course, lesson


def test_setting_attachment_link(client, admin_token):
    _, lesson = _create_course_with_lesson(client, admin_token)
    updated = assert_success(
        client.put(
            f"/v1/lessons/{lesson['id']}",
            json={"attachment_url": "https://example.com/slides.pdf"},
            headers=auth_headers(admin_token),
        )
    )
    assert updated["attachment_url"] == "https://example.com/slides.pdf"
    assert updated["attachment_s3_key"] is None


def test_requesting_upload_sets_s3_key_and_clears_link(client, admin_token):
    _, lesson = _create_course_with_lesson(client, admin_token)
    client.put(
        f"/v1/lessons/{lesson['id']}",
        json={"attachment_url": "https://example.com/old.pdf"},
        headers=auth_headers(admin_token),
    )

    resp = assert_success(
        client.post(
            f"/v1/lessons/{lesson['id']}/attachment",
            json={"content_type": "application/pdf"},
            headers=auth_headers(admin_token),
        )
    )
    assert resp["s3_key"].startswith(f"lesson-attachments/{lesson['id']}/")
    assert "upload" in resp

    fetched = assert_success(client.get(f"/v1/lessons/{lesson['id']}", headers=auth_headers(admin_token)))
    assert fetched["attachment_s3_key"] == resp["s3_key"]
    assert fetched["attachment_url"] is None  # uploading a file replaces any existing link
