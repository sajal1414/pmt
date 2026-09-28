from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import g, request

from app.config import FAIL_MESSAGE, JWT_ALGORITHM, JWT_EXPIRY_HOURS, JWT_SECRET_KEY, respond


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain.encode(), password_hash.encode())


def issue_token(user) -> str:
    payload = {
        "sub": str(user.id),
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "instructor_id": user.instructor_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_jwt_token():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return respond(FAIL_MESSAGE, "Missing bearer token"), 401
            token = auth_header[len("Bearer ") :]
            try:
                payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            except jwt.PyJWTError:
                return respond(FAIL_MESSAGE, "Invalid or expired token"), 401
            g.current_user = {
                "id": int(payload["sub"]),
                "role": payload["role"],
                "instructor_id": payload.get("instructor_id"),
            }
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if g.current_user["role"] not in roles:
                return respond(FAIL_MESSAGE, "Insufficient permissions"), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
