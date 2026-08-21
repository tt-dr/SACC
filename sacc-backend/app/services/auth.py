from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserStatus
from app.utils.security import hash_password, verify_password


async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str,
) -> User | None:
    user = (
        await db.execute(
            select(User).where(
                User.username == username,
                User.status == UserStatus.ACTIVE,
            )
        )
    ).scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


async def change_user_password(
    db: AsyncSession,
    user: User,
    old_password: str,
    new_password: str,
) -> None:
    if not verify_password(old_password, user.password_hash):
        raise ValueError("旧密码错误")
    user.password_hash = hash_password(new_password)
    await db.commit()
