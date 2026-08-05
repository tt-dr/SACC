from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.user import User
from app.models.content import Content, ContentStatus
from app.schemas.content import (
    ContentItemSummary,
    ContentListResponse,
    ContentModule,
    Pagination,
    ReorderRequest,
    UpsertContentRequest,
)


LIKE_ESCAPE_CHAR = "\\"


def _escape_like_pattern(keyword: str) -> str:
    """转义 LIKE 通配符，避免用户输入 % 或 _ 改变搜索语义。"""
    return (
        keyword.replace(LIKE_ESCAPE_CHAR, LIKE_ESCAPE_CHAR * 2)
        .replace("%", LIKE_ESCAPE_CHAR + "%")
        .replace("_", LIKE_ESCAPE_CHAR + "_")
    )


def _build_keyword_condition(keyword: str, user_alias):
    """构造标题/摘要/作者/展示名称/tags 的关键词 OR 条件。"""
    escaped_keyword = _escape_like_pattern(keyword)
    like_pattern = f"%{escaped_keyword}%"
    fulltext = func.match(
        Content.title,
        Content.summary,
        Content.author,
    ).op("AGAINST")(
        text("(:content_keyword IN NATURAL LANGUAGE MODE)").bindparams(
            content_keyword=keyword,
        )
    )
    return or_(
        fulltext,
        Content.title.like(like_pattern, escape=LIKE_ESCAPE_CHAR),
        Content.summary.like(like_pattern, escape=LIKE_ESCAPE_CHAR),
        Content.author.like(like_pattern, escape=LIKE_ESCAPE_CHAR),
        user_alias.display_name.like(like_pattern, escape=LIKE_ESCAPE_CHAR),
        func.json_search(Content.tags, "one", like_pattern).is_not(None),
    )


DB_TIMEZONE = timezone(timedelta(hours=8), name="Asia/Shanghai")


def _as_utc(value: datetime | None) -> datetime | None:
    """naive datetime 按 Asia/Shanghai 解释，并统一转为 UTC 时区。"""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=DB_TIMEZONE)
    return value.astimezone(timezone.utc)


def _order_by_for(module: ContentModule | None):
    if module == ContentModule.NEWS:
        return [
            Content.published_at.desc(),
            Content.id.desc(),
        ]
    if module in {ContentModule.DOCS, ContentModule.PROJECTS}:
        return [
            Content.sort_order.asc(),
            Content.published_at.desc(),
            Content.id.desc(),
        ]
    return [
        Content.published_at.desc(),
        Content.created_at.desc(),
        Content.id.desc(),
    ]


async def list_published_content(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    module: ContentModule | None,
    keyword: str | None,
) -> ContentListResponse:
    stripped_keyword = keyword.strip() if keyword else ""

    user_alias = aliased(User)
    conditions = [Content.status == ContentStatus.PUBLISHED]
    if module is not None:
        conditions.append(Content.module == module)
    if stripped_keyword:
        conditions.append(
            _build_keyword_condition(stripped_keyword, user_alias)
        )

    count_stmt = (
        select(func.count(Content.id))
        .join(
            user_alias,
            Content.author_user_id == user_alias.id,
            isouter=True,
        )
        .where(*conditions)
    )
    total = await db.scalar(count_stmt)

    columns = (
        Content.id,
        Content.module,
        Content.slug,
        Content.title,
        Content.summary,
        Content.category,
        Content.tags,
        Content.status,
        func.coalesce(
            func.nullif(func.trim(user_alias.display_name), ""),
            Content.author,
        ).label("author"),
        func.coalesce(
            func.nullif(func.trim(user_alias.avatar), ""),
            Content.author_avatar,
        ).label("author_avatar"),
        Content.repo_url,
        Content.sort_order,
        Content.published_at,
        Content.created_at,
        Content.updated_at,
    )
    list_stmt = (
        select(*columns)
        .join(
            user_alias,
            Content.author_user_id == user_alias.id,
            isouter=True,
        )
        .where(*conditions)
        .order_by(*_order_by_for(module))
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    rows = (await db.execute(list_stmt)).all()

    items = [
        ContentItemSummary(
            id=row.id,
            module=row.module,
            slug=row.slug,
            title=row.title,
            summary=row.summary,
            category=row.category,
            tags=row.tags,
            status=row.status,
            author=row.author,
            author_avatar=row.author_avatar,
            repo_url=row.repo_url,
            sort_order=row.sort_order,
            published_at=_as_utc(row.published_at),
            created_at=_as_utc(row.created_at),
            updated_at=_as_utc(row.updated_at),
        )
        for row in rows
    ]
    return ContentListResponse(
        data=items,
        pagination=Pagination(
            page=page,
            page_size=page_size,
            total=total or 0,
        ),
    )


async def create_content(
    db: AsyncSession,
    actor: User,
    payload: UpsertContentRequest,
) -> None:
    # TODO: 生成唯一 slug，持久化内容，记录审计日志并清除 Redis 缓存。
    _ = db, actor, payload
    raise NotImplementedError


async def update_content(
    db: AsyncSession,
    actor: User,
    content_id: int,
    payload: UpsertContentRequest,
) -> None:
    # TODO: 校验模块操作权限并更新指定内容记录。
    _ = db, actor, content_id, payload
    raise NotImplementedError


async def reorder_content(
    db: AsyncSession,
    actor: User,
    payload: ReorderRequest,
) -> None:
    # TODO: 在同一事务中更新全部 sort_order，并写入一条审计日志。
    _ = db, actor, payload
    raise NotImplementedError
