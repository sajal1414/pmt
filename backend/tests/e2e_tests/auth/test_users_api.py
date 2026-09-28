from tests.conftest import auth_headers
from tests.e2e_tests.common.base_test import assert_fail, assert_success


def test_list_users_requires_admin(client, instructor_and_token):
    _, token = instructor_and_token
    assert_fail(client.get("/v1/users", headers=auth_headers(token)), 403)


def test_admin_can_list_create_and_update_user_role(client, admin_token):
    created = assert_success(
        client.post(
            "/v1/users",
            json={"email": "new-admin@test.com", "password": "pass1234", "role": "admin", "full_name": "New Admin"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    assert created["role"] == "admin"
    assert "password_hash" not in created

    listed = assert_success(client.get("/v1/users", headers=auth_headers(admin_token)))
    assert any(u["id"] == created["id"] for u in listed)

    updated = assert_success(
        client.put(f"/v1/users/{created['id']}", json={"full_name": "Renamed"}, headers=auth_headers(admin_token))
    )
    assert updated["full_name"] == "Renamed"


def test_create_instructor_user_requires_instructor_id(client, admin_token):
    resp = client.post(
        "/v1/users",
        json={"email": "orphan@test.com", "password": "pass1234", "role": "instructor"},
        headers=auth_headers(admin_token),
    )
    assert_fail(resp, 400)


def test_admin_cannot_delete_own_account(client, admin_token):
    from app.auth.users_dao import UserDAO

    with UserDAO() as dao:
        me = dao.get_by_email("admin@test.com")
    assert_fail(client.delete(f"/v1/users/{me.id}", headers=auth_headers(admin_token)), 400)


def test_admin_can_delete_another_user(client, admin_token):
    created = assert_success(
        client.post(
            "/v1/users",
            json={"email": "throwaway@test.com", "password": "pass1234", "role": "admin"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    assert_success(client.delete(f"/v1/users/{created['id']}", headers=auth_headers(admin_token)))
