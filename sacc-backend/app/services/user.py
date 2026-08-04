from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import CreateUserRequest, UpdateUserRequest


async def create_user(
    db: AsyncSession,
    actor: User,
    payload: CreateUserRequest,
) -> None:
    # TODO: 校验 username 唯一性，加密密码，持久化并记录审计日志。
    _ = db, actor, payload
    raise NotImplementedError


async def update_user(
    db: AsyncSession,
    actor: User,
    user_id: int,
    payload: UpdateUserRequest,
) -> None:
    # TODO: 更新请求中提供的字段；如包含新密码则加密，并记录审计日志。
    _ = db, actor, user_id, payload
    raise NotImplementedError
