from typing import Annotated, NoReturn

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserStatus
from app.utils.security import decode_access_token


DbSession = Annotated[AsyncSession, Depends(get_db)]
bearer_scheme = HTTPBearer(
    auto_error=False,
    bearerFormat="JWT",
    scheme_name="bearerAuth",
    description="Use the JWT returned by POST /api/v1/auth/login.",
)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Security(bearer_scheme),
    ],
    db: DbSession,
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="请先登录")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (ValueError, TypeError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效或已过期的令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = (
        await db.execute(
            select(User).where(User.id == user_id, User.status == UserStatus.ACTIVE)
        )
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_super_admin(current_user: CurrentUser) -> User:
    if current_user.role.value != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要超级管理员权限",
        )
    return current_user


SuperAdmin = Annotated[User, Depends(require_super_admin)]


def not_implemented(requirement: str) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"TODO：{requirement}",
    )
