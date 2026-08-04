from typing import Annotated, NoReturn

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User


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
    # TODO: 解析并校验 JWT，检查 Redis 黑名单，再加载状态正常的用户。
    _ = credentials, db
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO：实现 JWT 身份认证",
    )


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_super_admin(current_user: CurrentUser) -> User:
    # TODO: 当前用户角色不是 super_admin 时返回 403。
    _ = current_user
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO：实现 super_admin 权限校验",
    )


SuperAdmin = Annotated[User, Depends(require_super_admin)]


def not_implemented(requirement: str) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"TODO：{requirement}",
    )
