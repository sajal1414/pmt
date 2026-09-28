from tests.conftest import auth_headers
from tests.e2e_tests.common.base_test import assert_fail, assert_success


def test_new_user_must_change_password_flag(client, admin_token):
    created = assert_success(
        client.post(
            "/v1/users",
            json={"email": "newbie@test.com", "password": "temp1234", "role": "admin"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    assert created["must_change_password"] is True

    login = assert_success(client.post("/v1/auth/login", json={"email": "newbie@test.com", "password": "temp1234"}))
    assert login["must_change_password"] is True


def test_change_password_requires_correct_current_password(client, admin_token):
    client.post(
        "/v1/users",
        json={"email": "newbie2@test.com", "password": "temp1234", "role": "admin"},
        headers=auth_headers(admin_token),
    )
    token = assert_success(client.post("/v1/auth/login", json={"email": "newbie2@test.com", "password": "temp1234"}))[
        "token"
    ]

    assert_fail(
        client.post(
            "/v1/auth/change-password",
            json={"current_password": "wrong", "new_password": "newpass123"},
            headers=auth_headers(token),
        ),
        401,
    )


def test_change_password_succeeds_and_clears_flag(client, admin_token):
    client.post(
        "/v1/users",
        json={"email": "newbie3@test.com", "password": "temp1234", "role": "admin"},
        headers=auth_headers(admin_token),
    )
    token = assert_success(client.post("/v1/auth/login", json={"email": "newbie3@test.com", "password": "temp1234"}))[
        "token"
    ]

    assert_success(
        client.post(
            "/v1/auth/change-password",
            json={"current_password": "temp1234", "new_password": "newpass123"},
            headers=auth_headers(token),
        )
    )

    # old password no longer works
    assert_fail(client.post("/v1/auth/login", json={"email": "newbie3@test.com", "password": "temp1234"}), 401)

    # new password works and must_change_password is now false
    login = assert_success(client.post("/v1/auth/login", json={"email": "newbie3@test.com", "password": "newpass123"}))
    assert login["must_change_password"] is False


def test_admin_resetting_password_forces_change_again(client, admin_token):
    created = assert_success(
        client.post(
            "/v1/users",
            json={"email": "newbie4@test.com", "password": "temp1234", "role": "admin"},
            headers=auth_headers(admin_token),
        ),
        201,
    )
    token = assert_success(client.post("/v1/auth/login", json={"email": "newbie4@test.com", "password": "temp1234"}))[
        "token"
    ]
    assert_success(
        client.post(
            "/v1/auth/change-password",
            json={"current_password": "temp1234", "new_password": "ownpassword1"},
            headers=auth_headers(token),
        )
    )

    updated = assert_success(
        client.put(f"/v1/users/{created['id']}", json={"password": "adminreset1"}, headers=auth_headers(admin_token))
    )
    assert updated["must_change_password"] is True
