from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str,
) -> User | None:
    # TODO: 加载状态正常的用户，并使用 bcrypt 校验提交的密码。
    _ = db, username, password
    raise NotImplementedError


async def change_user_password(
    db: AsyncSession,
    user: User,
    old_password: str,
    new_password: str,
) -> None:
    # TODO: 校验旧密码，保存新密码的 bcrypt 哈希，但不使当前 Token 失效。
    _ = db, user, old_password, new_password
    raise NotImplementedError
