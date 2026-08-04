from collections.abc import Sequence

from pypinyin import lazy_pinyin
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserStatus
from app.schemas.content import MemberListResponse, MemberPublicItem
from app.schemas.user import CreateUserRequest, UpdateUserRequest


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
