import os

os.environ["DATABASE_URL"] = "postgresql://atlas:atlas@localhost:5433/atlas_test"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("S3_BUCKET", "test-bucket")
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")

import pytest  # noqa: E402

from app.auth.auth_utils import hash_password  # noqa: E402
from app.auth.users_dao import UserDAO  # noqa: E402
from app.db import engine  # noqa: E402
from app.flask_server import create_app  # noqa: E402
from app.instructors.instructors_dao import InstructorDAO  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def client():
    app = create_app()
    app.testing = True
    return app.test_client()


def _login(client, email, password):
    resp = client.post("/v1/auth/login", json={"email": email, "password": password})
    return resp.get_json()["DATA"]["token"]


@pytest.fixture
def admin_token(client):
    with UserDAO() as dao:
        dao.create(email="admin@test.com", password_hash=hash_password("pass1234"), role="admin", full_name="Admin")
    return _login(client, "admin@test.com", "pass1234")


@pytest.fixture
def instructor_and_token(client):
    """Creates an Instructor profile + a linked `instructor`-role login. Returns (instructor_id, token)."""
    with InstructorDAO() as dao:
        instructor = dao.create({"name": "Jane Smith", "email": "jane@test.com"})
        instructor_id = instructor.id
    with UserDAO() as dao:
        dao.create(
            email="jane@test.com",
            password_hash=hash_password("pass1234"),
            role="instructor",
            full_name="Jane Smith",
            instructor_id=instructor_id,
        )
    token = _login(client, "jane@test.com", "pass1234")
    return instructor_id, token


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
