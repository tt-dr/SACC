from collections.abc import Sequence

from fastapi import HTTPException
from pypinyin import lazy_pinyin
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only

from app.models.user import User, UserStatus
from app.schemas.content import MemberListResponse, MemberPublicItem
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserRequest,
    UserItem,
    UserListResponse,
)
from app.utils.security import hash_password


# MySQL ER_DUP_ENTRY：唯一键/主键重复。
_DUPLICATE_ENTRY_ERRNO = 1062


def _is_duplicate_key_error(exc: IntegrityError) -> bool:
    """判断 IntegrityError 是否属于数据库重复键错误。

    仅将 MySQL 重复键错误码（1062）归类为 username 重复；其他完整性
    错误（如非空、外键约束）不在此列，应由调用方继续抛出。
    """
    orig = exc.orig
    args = getattr(orig, "args", ()) if orig is not None else ()
    return bool(args) and args[0] == _DUPLICATE_ENTRY_ERRNO


def _group_sort_key(group: str) -> tuple[int, str]:
    fixed_order = (
        "主席团",
        "办公室",
        "赛事部",
        "新媒体",
        "前端组",
        "后端组",
        "安全组",
        "Python组",
        "算法组",
    )
    known_index = (
        fixed_order.index(group)
        if group in fixed_order
        else len(fixed_order)
    )
    return (known_index, "".join(lazy_pinyin(group)).lower())


def _build_public_members_response(
    users: Sequence[User],
) -> MemberListResponse:
    grouped: dict[str, list[User]] = {}
    for user in users:
        if not (user.display_name or "").strip():
            continue
        raw_group = user.member_group
        group = raw_group.strip() if raw_group else ""
        if not group:
            continue
        grouped.setdefault(group, []).append(user)

    ordered_groups = sorted(grouped, key=_group_sort_key)
    members = [
        MemberPublicItem(
            id=user.id,
            display_name=user.display_name,
            avatar=user.avatar,
            position=user.position,
            desc=user.desc,
            group=group,
        )
        for group in ordered_groups
        for user in sorted(grouped[group], key=lambda item: item.id)
    ]
    return MemberListResponse(data=members, groups=ordered_groups)


async def list_public_members(db: AsyncSession) -> MemberListResponse:
    stmt = select(User).where(
        User.status == UserStatus.ACTIVE,
        User.member_group.is_not(None),
    )
    users = (await db.scalars(stmt)).all()
    return _build_public_members_response(users)


async def list_admin_users(db: AsyncSession) -> UserListResponse:
    """查询全部后台用户（含 disabled），按 id 升序返回。"""
    stmt = (
        select(User)
        .options(
            load_only(
                User.username,
                User.display_name,
                User.avatar,
                User.role,
                User.position,
                User.desc,
                User.status,
                User.created_at,
            )
        )
        .order_by(User.id.asc())
    )
    users = (await db.scalars(stmt)).all()
    return UserListResponse(
        root=[UserItem.model_validate(user) for user in users]
    )


async def create_user(
    db: AsyncSession,
    actor: User,
    payload: CreateUserRequest,
) -> None:
    # TODO: 接入公共审计日志组件（write_audit_log 尚未实现），届时使用 actor 记录操作者。
    stmt = select(User.id).where(User.username == payload.username)
    existing = (await db.scalars(stmt)).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="用户名已存在")

    try:
        password_hash = hash_password(payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    user = User(
        username=payload.username,
        password_hash=password_hash,
        display_name=payload.display_name or "",
        role=payload.role,
        position=payload.position,
        desc=payload.desc,
        avatar=payload.avatar,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        if not _is_duplicate_key_error(exc):
            raise
        raise HTTPException(status_code=400, detail="用户名已存在") from exc


async def update_user(
    db: AsyncSession,
    actor: User,
    user_id: int,
    payload: UpdateUserRequest,
) -> None:
    # TODO: 更新请求中提供的字段；如包含新密码则加密，并记录审计日志。
    _ = db, actor, user_id, payload
    raise NotImplementedError
