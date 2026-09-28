import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.log_setup import log  # noqa: E402  (import after load_dotenv on purpose)

STATUS = "STATUS"
MESSAGE = "MESSAGE"
DATA = "DATA"
SUCCESS_MESSAGE = "SUCCESS"
FAIL_MESSAGE = "FAIL"

DATABASE_URL = os.environ["DATABASE_URL"]
JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "12"))

S3_BUCKET = os.environ.get("S3_BUCKET")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
# Set for a local/self-hosted S3-compatible store (MinIO); unset (None) means real AWS S3.
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL") or None

CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175"
    ).split(",")
    if origin.strip()
]


def respond(status: str, message: str, data=None):
    return {STATUS: status, MESSAGE: message, DATA: data}


__all__ = [
    "STATUS",
    "MESSAGE",
    "DATA",
    "SUCCESS_MESSAGE",
    "FAIL_MESSAGE",
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "JWT_ALGORITHM",
    "JWT_EXPIRY_HOURS",
    "S3_BUCKET",
    "AWS_REGION",
    "S3_ENDPOINT_URL",
    "CORS_ORIGINS",
    "respond",
    "log",
]
