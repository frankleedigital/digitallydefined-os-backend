# app/services/r2_storage.py
import os
import boto3
from botocore.config import Config

def _client():
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("R2_ENDPOINT"),
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )

def upload_file(local_path, key, content_type="application/octet-stream"):
    _client().upload_file(local_path, os.getenv("R2_BUCKET"), key, ExtraArgs={"ContentType": content_type})

def upload_bytes(data, key, content_type="application/octet-stream"):
    _client().put_object(Bucket=os.getenv("R2_BUCKET"), Key=key, Body=data, ContentType=content_type)

def download_bytes(key):
    return _client().get_object(Bucket=os.getenv("R2_BUCKET"), Key=key)["Body"].read()

def delete_object(key):
    _client().delete_object(Bucket=os.getenv("R2_BUCKET"), Key=key)

def exists(key):
    try:
        _client().head_object(Bucket=os.getenv("R2_BUCKET"), Key=key)
        return True
    except Exception:
        return False

def signed_url(key, expires=3600):
    return _client().generate_presigned_url("get_object", Params={"Bucket": os.getenv("R2_BUCKET"), "Key": key}, ExpiresIn=expires)
