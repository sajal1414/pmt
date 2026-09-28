import boto3
from botocore.client import Config

from app.config import AWS_REGION, S3_BUCKET, S3_ENDPOINT_URL

_s3_client = None


def _client():
    global _s3_client
    if _s3_client is None:
        # Path-style addressing (bucket in the URL path, not a subdomain) is required for
        # MinIO/self-hosted S3; real AWS accepts it too, so it's safe to always set.
        _s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            endpoint_url=S3_ENDPOINT_URL,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )
    return _s3_client


def create_presigned_upload_post(s3_key: str, content_type: str, bucket: str = None, expires_in: int = 3600):
    bucket = bucket or S3_BUCKET
    return _client().generate_presigned_post(
        Bucket=bucket,
        Key=s3_key,
        Fields={"Content-Type": content_type},
        Conditions=[{"Content-Type": content_type}],
        ExpiresIn=expires_in,
    )


def create_presigned_playback_url(s3_key: str, bucket: str = None, expires_in: int = 3600):
    bucket = bucket or S3_BUCKET
    return _client().generate_presigned_url(
        "get_object", Params={"Bucket": bucket, "Key": s3_key}, ExpiresIn=expires_in
    )


def object_exists(s3_key: str, bucket: str = None) -> bool:
    bucket = bucket or S3_BUCKET
    try:
        _client().head_object(Bucket=bucket, Key=s3_key)
        return True
    except Exception:
        return False
