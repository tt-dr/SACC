from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import bcrypt
from jose import jwt

from app.config import settings


BCRYPT_ROUNDS = 12
MAX_BCRYPT_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError("密码 UTF-8 编码后不能超过 72 字节")
    return bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_BCRYPT_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
    except (TypeError, ValueError):
        return False


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = dict(claims or {})
    payload.update({
        "sub": subject,
        "jti": str(uuid4()),
        "iat": now,
        "exp": now + timedelta(seconds=settings.jwt_expire_seconds),
    })
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        options={
            "require_exp": True,
            "require_iat": True,
            "require_sub": True,
        },
    )
    if not payload.get("jti"):
        raise ValueError("JWT 缺少 jti 声明")
    return payload
