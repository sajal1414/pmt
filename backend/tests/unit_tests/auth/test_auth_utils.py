import jwt
import pytest

from app.auth.auth_utils import check_password, hash_password, issue_token
from app.config import JWT_ALGORITHM, JWT_SECRET_KEY


class _FakeUser:
    def __init__(self, id, role, instructor_id=None):
        self.id = id
        self.role = role
        self.instructor_id = instructor_id


def test_hash_and_check_password_round_trip():
    hashed = hash_password("correct-password")
    assert check_password("correct-password", hashed)
    assert not check_password("wrong-password", hashed)


def test_issue_token_contains_expected_claims():
    token = issue_token(_FakeUser(id=7, role="admin", instructor_id=None))
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    assert payload["sub"] == "7"
    assert payload["role"] == "admin"
    assert payload["instructor_id"] is None


def test_issue_token_rejects_bad_signature():
    token = issue_token(_FakeUser(id=1, role="instructor", instructor_id=3))
    with pytest.raises(jwt.PyJWTError):
        jwt.decode(token, "wrong-secret", algorithms=[JWT_ALGORITHM])
