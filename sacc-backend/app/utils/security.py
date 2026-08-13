from typing import Any

import bcrypt
from jose import jwt
from jose.exceptions import JWTError

from app.config import settings


def hash_password(password: str) -> str:
    """使用 bcrypt（随机 salt）对密码进行哈希，返回可存储的字符串。"""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        # 超过 72 字节时 bcrypt 5.x 会抛 ValueError。调用方应在入参校验阶段拦截，
        # 或捕获本异常转换为明确的 4xx，避免未处理异常变成服务器 500。
        raise ValueError("密码过长：bcrypt 仅支持 72 字节以内的密码")
    password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return password_hash.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    # TODO: 在不泄露时序信息的前提下校验 bcrypt 哈希。
    _ = password, password_hash
    raise NotImplementedError


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    # TODO: 签发包含 sub、jti、iat 和 exp 声明的 JWT。
    _ = subject, claims
    raise NotImplementedError


def decode_access_token(token: str) -> dict[str, Any]:
    """校验 JWT 签名、算法、过期时间及必需声明，返回解析后的 payload。"""
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        options={
            "require_sub": True,
            "require_jti": True,
            "require_iat": True,
            "require_exp": True,
        },
    )
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.isdigit() or int(sub) <= 0:
        raise JWTError("Token sub 声明不是有效的用户 ID")
    payload["sub"] = int(sub)
    return payload
