from typing import Any

from jose import jwt
from jose.exceptions import JWTError

from app.config import settings


def hash_password(password: str) -> str:
    # TODO: 使用 bcrypt 和经过评审的明确工作因子对密码进行哈希。
    _ = password
    raise NotImplementedError


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
