from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditAction
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import CreateUserRequest, UpdateUserRequest
from app.utils.audit import write_audit_log
from app.utils.security import hash_password


async def create_user(
    db: AsyncSession,
    actor: User,
    payload: CreateUserRequest,
) -> None:
    existing = await db.scalar(select(User).where(User.username == payload.username))
    if existing is not None:
        raise ValueError("用户名已存在")
    user = User(
        username=payload.username,
        display_name=payload.display_name or payload.username,
        password_hash=hash_password(payload.password),
        role=UserRole(payload.role.value),
        position=payload.position,
        desc=payload.desc,
        avatar=payload.avatar,
    )
    db.add(user)
    await write_audit_log(
        db,
        actor=actor.username,
        module="users",
        action=AuditAction.CREATE,
        detail=f"创建用户 {payload.username}",
    )
    await db.commit()


async def update_user(
    db: AsyncSession,
    actor: User,
    user_id: int,
    payload: UpdateUserRequest,
) -> None:
    user = await db.get(User, user_id)
    if user is None:
        raise ValueError("用户不存在")
    values = payload.model_dump(exclude_unset=True)
    if "username" in values and values["username"] != user.username:
        existing = await db.scalar(
            select(User).where(User.username == values["username"])
        )
        if existing is not None:
            raise ValueError("用户名已存在")
    password = values.pop("password", None)
    if password:
        user.password_hash = hash_password(password)
    role = values.pop("role", None)
    if role is not None:
        user.role = UserRole(role.value)
    for field, value in values.items():
        setattr(user, field, value)
    await write_audit_log(
        db,
        actor=actor.username,
        module="users",
        action=AuditAction.UPDATE,
        detail=f"更新用户 {user.username}",
    )
    await db.commit()


async def disable_user(db: AsyncSession, actor: User, user_id: int) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise ValueError("用户不存在")
    if user.id == actor.id:
        raise PermissionError("不能禁用当前登录用户")
    user.status = UserStatus.DISABLED
    await write_audit_log(
        db,
        actor=actor.username,
        module="users",
        action=AuditAction.DELETE,
        detail=f"禁用用户 {user.username}",
    )
    await db.commit()
    return user
