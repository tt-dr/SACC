from datetime import datetime
from pathlib import PurePosixPath
from uuid import uuid4

import oss2
from fastapi import HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.schemas.content import UploadResponse


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ("jpg", (b"\xff\xd8\xff",)),
    "image/png": ("png", (b"\x89PNG\r\n\x1a\n",)),
    "image/gif": ("gif", (b"GIF87a", b"GIF89a")),
    "image/webp": ("webp", (b"RIFF",)),
}


def _configured() -> bool:
    return all(
        (
            settings.oss_endpoint,
            settings.oss_access_key_id,
            settings.oss_access_key_secret,
            settings.oss_bucket_name,
        )
    )


def _object_url(bucket: oss2.Bucket, key: str) -> str:
    if settings.oss_public_base_url:
        return f"{settings.oss_public_base_url.rstrip('/')}/{key}"
    return bucket.sign_url("GET", key, 3600)


async def upload_image(file: UploadFile) -> UploadResponse:
    if not _configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OSS 存储未配置",
        )
    content_type = (file.content_type or "").lower()
    image_type = ALLOWED_IMAGE_TYPES.get(content_type)
    if image_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 JPG、PNG、GIF 或 WEBP 图片",
        )

    body = await file.read(settings.max_upload_size + 1)
    if len(body) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片大小不能超过 10MB",
        )
    if not _valid_signature(body, content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片文件内容与 MIME 类型不匹配",
        )

    extension = image_type[0]
    prefix = settings.oss_bucket_prefix.strip("/")
    key = str(PurePosixPath(prefix) / "images" / f"{uuid4().hex}.{extension}")
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket_name)

    def put_object() -> None:
        bucket.put_object(
            key,
            body,
            headers={"Content-Type": content_type, "Content-Disposition": "inline"},
        )

    try:
        await run_in_threadpool(put_object)
    except oss2.exceptions.OssError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="图片上传 OSS 失败",
        ) from exc
    return UploadResponse(
        url=_object_url(bucket, key),
        filename=key.rsplit("/", 1)[-1],
        size=len(body),
        uploaded_at=datetime.utcnow(),
    )


def _valid_signature(body: bytes, content_type: str) -> bool:
    if content_type == "image/webp":
        return len(body) >= 12 and body[:4] == b"RIFF" and body[8:12] == b"WEBP"
    return any(body.startswith(signature) for signature in ALLOWED_IMAGE_TYPES[content_type][1])
