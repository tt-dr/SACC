import re
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.audit_log import AuditAction
from app.models.content import (
    Content,
    ContentModule as ModelContentModule,
    ContentStatus as ModelContentStatus,
)
from app.models.user import User
from app.schemas.content import (
    ContentItemSummary,
    ContentListResponse,
    ContentModule,
    Pagination,
    ReorderRequest,
    UpsertContentRequest,
)
from app.utils.audit import write_audit_log
from app.utils.slug import generate_slug


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
    conditions = [Content.status == ModelContentStatus.PUBLISHED]
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


def _slug_value(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "-", value).strip("-").lower()
    return generate_slug(value) if re.search(r"[\u4e00-\u9fff]", value) else value[:240]


async def _unique_slug(
    db: AsyncSession,
    requested: str | None,
    title: str,
    *,
    exclude_id: int | None = None,
) -> str:
    base = _slug_value(requested) if requested else generate_slug(title)
    base = base or "content"
    candidate = base[:240]
    suffix = 1
    while True:
        query = select(Content.id).where(Content.slug == candidate)
        if exclude_id is not None:
            query = query.where(Content.id != exclude_id)
        if (await db.execute(query)).scalar_one_or_none() is None:
            return candidate
        suffix += 1
        candidate = f"{base[: max(1, 240 - len(str(suffix)) - 1)]}-{suffix}"


async def create_content(
    db: AsyncSession,
    actor: User,
    payload: UpsertContentRequest,
) -> Content:
    slug = await _unique_slug(db, payload.slug, payload.title)
    published_at = payload.published_at
    if payload.status.value == "published" and published_at is None:
        published_at = datetime.utcnow()

    next_sort_order = await db.scalar(
        select(func.coalesce(func.max(Content.sort_order), -1) + 1).where(
            Content.module == ModelContentModule(payload.module.value),
            Content.status != "archived",
        )
    )
    content = Content(
        module=ModelContentModule(payload.module.value),
        slug=slug,
        title=payload.title,
        summary=payload.summary,
        body=payload.body,
        category=payload.category,
        tags=payload.tags,
        status=ModelContentStatus(payload.status.value),
        author_user_id=actor.id,
        author=payload.author if payload.author is not None else actor.display_name,
        author_avatar=actor.avatar,
        repo_url=payload.repo_url,
        sort_order=int(next_sort_order or 0),
        published_at=published_at,
    )
    db.add(content)
    await db.flush()
    await write_audit_log(
        db,
        actor=actor.username,
        module=payload.module.value,
        action=AuditAction.CREATE,
        detail=f"创建内容 {content.id}: {content.title}",
    )
    await db.commit()
    await db.refresh(content)
    return content


async def update_content(
    db: AsyncSession,
    actor: User,
    content_id: int,
    payload: UpsertContentRequest,
) -> Content:
    content = await db.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="内容不存在")

    if payload.slug is not None and payload.slug != content.slug:
        content.slug = await _unique_slug(
            db, payload.slug, payload.title, exclude_id=content_id
        )
    elif payload.slug is None and payload.title != content.title:
        content.slug = await _unique_slug(
            db, None, payload.title, exclude_id=content_id
        )

    content.module = ModelContentModule(payload.module.value)
    content.title = payload.title
    content.summary = payload.summary
    content.body = payload.body
    content.category = payload.category
    content.tags = payload.tags
    content.status = ModelContentStatus(payload.status.value)
    content.author = payload.author if payload.author is not None else content.author
    content.repo_url = payload.repo_url
    content.published_at = payload.published_at
    if payload.status.value == "published" and content.published_at is None:
        content.published_at = datetime.utcnow()
    if payload.status.value != "published":
        content.published_at = None

    await write_audit_log(
        db,
        actor=actor.username,
        module=payload.module.value,
        action=AuditAction.UPDATE,
        detail=f"更新内容 {content.id}: {content.title}",
    )
    await db.commit()
    await db.refresh(content)
    return content


async def delete_content(
    db: AsyncSession,
    actor: User,
    content_id: int,
) -> None:
    content = await db.get(Content, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="内容不存在")
    if content.status != ModelContentStatus.ARCHIVED:
        content.status = ModelContentStatus.ARCHIVED
        content.published_at = None
    await write_audit_log(
        db,
        actor=actor.username,
        module=content.module.value,
        action=AuditAction.DELETE,
        detail=f"删除内容 {content.id}: {content.title}",
    )
    await db.commit()


async def reorder_content(
    db: AsyncSession,
    actor: User,
    payload: ReorderRequest,
) -> None:
    if len(set(payload.ordered_ids)) != len(payload.ordered_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="orderedIds 不能包含重复内容",
        )

    module = ModelContentModule(payload.module.value)
    rows = (
        await db.execute(
            select(Content).where(
                Content.module == module,
                Content.id.in_(payload.ordered_ids),
                Content.status != ModelContentStatus.ARCHIVED,
            )
        )
    ).scalars().all()
    if len(rows) != len(payload.ordered_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="orderedIds 包含不存在或不属于该模块的内容",
        )
    rows_by_id = {row.id: row for row in rows}
    for sort_order, content_id in enumerate(payload.ordered_ids):
        rows_by_id[content_id].sort_order = sort_order

    await write_audit_log(
        db,
        actor=actor.username,
        module=payload.module.value,
        action=AuditAction.UPDATE,
        detail=f"调整 {payload.module.value} 内容排序",
    )
    await db.commit()
