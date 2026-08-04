from tempfile import SpooledTemporaryFile

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.config import settings
from app.services import storage


def upload_file(body: bytes, content_type: str) -> UploadFile:
    file = SpooledTemporaryFile()
    file.write(body)
    file.seek(0)
    return UploadFile(
        file,
        filename="image",
        headers=Headers({"content-type": content_type}),
    )


@pytest.mark.asyncio
async def test_upload_image_to_oss(monkeypatch) -> None:
    uploaded = {}

    class FakeBucket:
        def put_object(self, key, body, headers):
            uploaded.update(key=key, body=body, headers=headers)

    monkeypatch.setattr(settings, "oss_endpoint", "https://oss.example.com")
    monkeypatch.setattr(settings, "oss_access_key_id", "key")
    monkeypatch.setattr(settings, "oss_access_key_secret", "secret")
    monkeypatch.setattr(settings, "oss_bucket_name", "bucket")
    monkeypatch.setattr(settings, "oss_bucket_prefix", "sacc/")
    monkeypatch.setattr(settings, "oss_public_base_url", "https://cdn.example.com")
    monkeypatch.setattr(storage.oss2, "Auth", lambda *_: object())
    monkeypatch.setattr(storage.oss2, "Bucket", lambda *_: FakeBucket())

    async def run_immediately(function):
        return function()

    monkeypatch.setattr(storage, "run_in_threadpool", run_immediately)

    body = b"\x89PNG\r\n\x1a\n" + b"image"
    file = upload_file(body, "image/png")
    result = await storage.upload_image(file)

    assert result.url.startswith("https://cdn.example.com/sacc/images/")
    assert result.filename.endswith(".png")
    assert result.size == len(body)
    assert uploaded["body"] == body


@pytest.mark.asyncio
async def test_upload_rejects_fake_image(monkeypatch) -> None:
    monkeypatch.setattr(settings, "oss_endpoint", "https://oss.example.com")
    monkeypatch.setattr(settings, "oss_access_key_id", "key")
    monkeypatch.setattr(settings, "oss_access_key_secret", "secret")
    monkeypatch.setattr(settings, "oss_bucket_name", "bucket")
    file = upload_file(b"not an image", "image/png")

    with pytest.raises(HTTPException) as raised:
        await storage.upload_image(file)
    assert raised.value.status_code == 400
