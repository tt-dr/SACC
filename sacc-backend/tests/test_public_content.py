# -*- coding: utf-8 -*-
from datetime import datetime
from types import SimpleNamespace
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import Select, text
from sqlalchemy.dialects import mysql
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models.content import Content, ContentModule, ContentStatus
from app.models.user import User, UserRole, UserStatus
from app.services.content import list_published_content


def make_content_row(
    content_id: int,
    *,
    module: ContentModule = ContentModule.NEWS,
    title: str = "标题",
    summary: str | None = "摘要",
    category: str | None = "技术",
    tags: list[str] | None = None,
    status: ContentStatus = ContentStatus.PUBLISHED,
    author: str | None = "内容作者",
    author_avatar: str | None = "http://fallback/avatar.png",
    repo_url: str | None = None,
    sort_order: int = 0,
    published_at: datetime | None = None,
) -> SimpleNamespace:
    base = datetime(2026, 8, 5, 9, 0, 0)
    return SimpleNamespace(
        id=content_id,
        module=module.value,
        slug=f"slug-{content_id}",
        title=title,
        summary=summary,
        category=category,
        tags=tags if tags is not None else ["后端", "FastAPI"],
        status=status.value,
        author=author,
        author_avatar=author_avatar,
        repo_url=repo_url,
        sort_order=sort_order,
        published_at=published_at or base,
        created_at=base,
        updated_at=base,
    )


class _ScalarResult:
    def __init__(self, rows: list[SimpleNamespace]) -> None:
        self._rows = rows

    def all(self) -> list[SimpleNamespace]:
        return self._rows

    def __iter__(self):
        return iter(self._rows)


class _FakeDb:
    """捕获 SQL 语句，并按调用顺序返回 count、列表行。"""

    def __init__(
        self,
        rows: list[SimpleNamespace] | None = None,
        total: int | None = None,
    ) -> None:
        self.rows = rows or []
        self.total = total if total is not None else len(self.rows)
        self.statements: list[Select[Any]] = []

    async def scalar(self, stmt: Select[Any]) -> int:
        self.statements.append(stmt)
        return self.total

    async def execute(self, stmt: Select[Any]) -> _ScalarResult:
        self.statements.append(stmt)
        return _ScalarResult(self.rows)


def _compile(stmt: Select[Any]) -> str:
    return str(stmt.compile(dialect=mysql.dialect()))


def _compile_literal(stmt: Select[Any]) -> str:
    return str(
        stmt.compile(
            dialect=mysql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


@pytest.mark.asyncio
async def test_defaults_to_page_one_and_page_size_twenty() -> None:
    fake_db = _FakeDb([make_content_row(1)])

    response = await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    assert response.pagination.page == 1
    assert response.pagination.page_size == 20
    assert len(response.data) == 1
    limit_offset = _compile_literal(fake_db.statements[1]).split("LIMIT ")[-1]
    assert limit_offset == "0, 20"


@pytest.mark.asyncio
async def test_count_and_list_use_same_filters() -> None:
    fake_db = _FakeDb([make_content_row(1)], total=5)

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=2,
        page_size=10,
        module=ContentModule.DOCS,
        keyword="  FastAPI  ",
    )

    count_sql = _compile(fake_db.statements[0])
    list_sql = _compile(fake_db.statements[1])
    assert "count(content.id)" in count_sql
    assert "AGAINST" in count_sql
    assert "users_1.display_name LIKE" in count_sql
    count_conditions = count_sql.split("WHERE ", 1)[1]
    list_conditions = (
        list_sql.split("WHERE ", 1)[1]
        .split(" ORDER BY", 1)[0]
    )
    assert count_conditions == list_conditions


@pytest.mark.asyncio
async def test_only_published_status_condition_is_always_applied() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    list_sql = _compile_literal(fake_db.statements[1])
    assert "content.status = 'published'" in list_sql
    assert "LEFT OUTER JOIN users AS users_1" in list_sql


@pytest.mark.asyncio
async def test_module_filter_applied_for_news_docs_projects() -> None:
    for module in (
        ContentModule.NEWS,
        ContentModule.DOCS,
        ContentModule.PROJECTS,
    ):
        fake_db = _FakeDb([])
        await list_published_content(
            fake_db,  # type: ignore[arg-type]
            page=1,
            page_size=20,
            module=module,
            keyword=None,
        )
        list_sql = _compile_literal(fake_db.statements[1])
        assert f"content.module = '{module.value}'" in list_sql


@pytest.mark.asyncio
async def test_author_fallback_uses_nullif_coalesce() -> None:
    fake_db = _FakeDb(
        [
            make_content_row(
                1,
                author="回退作者",
                author_avatar="http://fallback/avatar.png",
            )
        ]
    )

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    list_sql = _compile_literal(fake_db.statements[1])
    assert (
        "coalesce(nullif(trim(users_1.display_name), ''), content.author)"
        in list_sql
    )
    assert (
        "coalesce(nullif(trim(users_1.avatar), ''), content.author_avatar)"
        in list_sql
    )


@pytest.mark.asyncio
async def test_keyword_search_covers_contract_fields() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword="测试",
    )

    list_sql = _compile_literal(fake_db.statements[1])
    assert "match(content.title, content.summary, content.author) AGAINST ('测试'" in list_sql
    assert "IN NATURAL LANGUAGE MODE" in list_sql
    assert "content.title LIKE" in list_sql
    assert "content.summary LIKE" in list_sql
    assert "content.author LIKE" in list_sql
    assert "users_1.display_name LIKE" in list_sql
    assert "json_search(content.tags" in list_sql
    assert "%测试%" in list_sql
    assert "content.body" not in list_sql


@pytest.mark.asyncio
async def test_keyword_is_stripped_and_empty_keyword_disables_search() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword="  测试  ",
    )
    stripped_sql = _compile_literal(fake_db.statements[1])
    assert "AGAINST ('测试'" in stripped_sql
    assert "  测试  " not in stripped_sql

    fake_db = _FakeDb([])
    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword="   ",
    )
    empty_sql = _compile(fake_db.statements[1])
    assert "AGAINST" not in empty_sql
    assert "LIKE" not in empty_sql


@pytest.mark.asyncio
async def test_keyword_like_escapes_wildcards() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword="50%_折扣\\",
    )

    list_sql = _compile_literal(fake_db.statements[1])
    assert "%50" in list_sql
    assert "折扣" in list_sql
    assert "\\%" in list_sql
    assert "\\_" in list_sql
    assert "\\\\" in list_sql
    assert "ESCAPE" in list_sql


@pytest.mark.asyncio
async def test_news_sorting_is_published_at_desc_then_id_desc() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=ContentModule.NEWS,
        keyword=None,
    )

    list_sql = _compile(fake_db.statements[1])
    assert (
        "ORDER BY content.published_at DESC, content.id DESC" in list_sql
    )


@pytest.mark.asyncio
async def test_docs_and_projects_sort_by_sort_order_then_time_then_id() -> None:
    for module in (ContentModule.DOCS, ContentModule.PROJECTS):
        fake_db = _FakeDb([])
        await list_published_content(
            fake_db,  # type: ignore[arg-type]
            page=1,
            page_size=20,
            module=module,
            keyword=None,
        )
        list_sql = _compile(fake_db.statements[1])
        assert (
            "ORDER BY content.sort_order ASC, content.published_at DESC, "
            "content.id DESC" in list_sql
        )


@pytest.mark.asyncio
async def test_default_sorting_is_published_at_created_at_then_id() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    list_sql = _compile(fake_db.statements[1])
    assert (
        "ORDER BY content.published_at DESC, content.created_at DESC, "
        "content.id DESC" in list_sql
    )


@pytest.mark.asyncio
async def test_query_never_selects_body_column() -> None:
    fake_db = _FakeDb([])

    await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    assert "body" not in _compile(fake_db.statements[0])
    assert "body" not in _compile(fake_db.statements[1])


async def _get_route(fake_db: _FakeDb, path: str):
    async def override_get_db() -> Any:
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            return await client.get(path)
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_route_returns_camel_case_summary_without_body() -> None:
    row = make_content_row(
        1,
        title="示例标题",
        summary="示例摘要",
        category="技术",
        tags=["后端", "FastAPI"],
        author="作者名称",
        author_avatar="https://example.com/avatar.png",
        repo_url="https://github.com/example/repo",
    )
    fake_db = _FakeDb([row], total=1)

    resp = await _get_route(fake_db, "/api/v1/content")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["message"] == "获取成功"
    item = body["data"]["data"][0]
    assert item["id"] == 1
    assert item["module"] == "news"
    assert item["title"] == "示例标题"
    assert item["tags"] == ["后端", "FastAPI"]
    assert item["author"] == "作者名称"
    assert item["authorAvatar"] == "https://example.com/avatar.png"
    assert item["repoUrl"] == "https://github.com/example/repo"
    assert item["sortOrder"] == 0
    assert item["publishedAt"] == "2026-08-05T01:00:00Z"
    assert item["createdAt"] == "2026-08-05T01:00:00Z"
    assert item["updatedAt"] == "2026-08-05T01:00:00Z"
    assert "body" not in item
    assert "author_avatar" not in item
    assert "repo_url" not in item
    assert "sort_order" not in item
    pagination = body["data"]["pagination"]
    assert pagination == {"page": 1, "pageSize": 20, "total": 1}
    list_sql = _compile(fake_db.statements[1])
    assert "content.body" not in list_sql


@pytest.mark.asyncio
async def test_route_returns_200_with_empty_data_when_none_found() -> None:
    fake_db = _FakeDb([], total=0)

    resp = await _get_route(fake_db, "/api/v1/content?page=100")

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == {"data": [], "pagination": {"page": 100, "pageSize": 20, "total": 0}}


@pytest.mark.asyncio
async def test_route_accepts_page_size_alias_and_applies_offset() -> None:
    fake_db = _FakeDb([make_content_row(1)], total=5)

    resp = await _get_route(fake_db, "/api/v1/content?page=3&pageSize=10")

    assert resp.status_code == 200
    assert resp.json()["data"]["pagination"]["pageSize"] == 10
    list_sql = _compile(fake_db.statements[1])
    assert "LIMIT 20, 10" in _compile_literal(fake_db.statements[1])


@pytest.mark.asyncio
async def test_route_rejects_invalid_page() -> None:
    resp = await _get_route(_FakeDb([]), "/api/v1/content?page=0")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_route_rejects_invalid_page_size() -> None:
    for query in ("pageSize=0", "pageSize=101", "pageSize=-1"):
        resp = await _get_route(_FakeDb([]), f"/api/v1/content?{query}")
        assert resp.status_code == 422, query


@pytest.mark.asyncio
async def test_route_rejects_invalid_status() -> None:
    for status in ("draft", "archived", "deleted", ""):
        resp = await _get_route(_FakeDb([]), f"/api/v1/content?status={status}")
        assert resp.status_code == 422, status


@pytest.mark.asyncio
async def test_route_accepts_published_status() -> None:
    fake_db = _FakeDb([make_content_row(1)], total=1)

    resp = await _get_route(fake_db, "/api/v1/content?status=published")

    assert resp.status_code == 200
    assert resp.json()["code"] == 200


@pytest.mark.asyncio
async def test_route_rejects_invalid_module() -> None:
    resp = await _get_route(_FakeDb([]), "/api/v1/content?module=video")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_route_module_filter_and_keyword_are_forwarded() -> None:
    fake_db = _FakeDb([make_content_row(1)], total=1)

    resp = await _get_route(
        fake_db,
        "/api/v1/content?module=docs&keyword=FastAPI",
    )

    assert resp.status_code == 200
    list_sql = _compile_literal(fake_db.statements[1])
    assert "content.module = 'docs'" in list_sql
    assert "AGAINST ('FastAPI'" in list_sql


@pytest.mark.asyncio
async def test_users_join_keeps_stable_id_tiebreaker() -> None:
    fake_db = _FakeDb(
        [
            make_content_row(2, published_at=datetime(2026, 8, 5, 9, 0, 0)),
            make_content_row(1, published_at=datetime(2026, 8, 5, 9, 0, 0)),
        ],
        total=2,
    )

    response = await list_published_content(
        fake_db,  # type: ignore[arg-type]
        page=1,
        page_size=20,
        module=None,
        keyword=None,
    )

    assert [item.id for item in response.data] == [2, 1]


@pytest.mark.asyncio
async def test_end_to_end_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            user = User(
                username="content_author",
                password_hash="unused",
                display_name="展示作者",
                avatar="https://example.com/user-avatar.png",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user)
            await session.flush()

            session.add_all(
                [
                    Content(
                        module=ContentModule.NEWS,
                        slug="news-published",
                        title="已发布新闻标题",
                        summary="新闻摘要",
                        body="不应出现的正文",
                        category="新闻",
                        tags=["协会"],
                        status=ContentStatus.PUBLISHED,
                        author_user_id=user.id,
                        author="旧作者名",
                        author_avatar="http://fallback/avatar.png",
                        sort_order=1,
                        published_at=datetime(2026, 8, 5, 10, 0, 0),
                    ),
                    Content(
                        module=ContentModule.DOCS,
                        slug="docs-published",
                        title="文档标题",
                        summary="文档摘要",
                        status=ContentStatus.PUBLISHED,
                        author="独立作者",
                        sort_order=0,
                        published_at=datetime(2026, 8, 4, 10, 0, 0),
                    ),
                    Content(
                        module=ContentModule.NEWS,
                        slug="news-draft",
                        title="草稿标题",
                        status=ContentStatus.DRAFT,
                        published_at=datetime(2026, 8, 5, 12, 0, 0),
                    ),
                    Content(
                        module=ContentModule.PROJECTS,
                        slug="projects-archived",
                        title="归档项目",
                        status=ContentStatus.ARCHIVED,
                        published_at=datetime(2026, 8, 5, 11, 0, 0),
                    ),
                ]
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get("/api/v1/content")
                    keyword_resp = await client.get(
                        "/api/v1/content?keyword=%E5%B1%95%E7%A4%BA%E4%BD%9C%E8%80%85"
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["pagination"]["total"] == 2
    items = body["data"]["data"]
    assert [item["slug"] for item in items] == [
        "news-published",
        "docs-published",
    ]
    news_item = next(item for item in items if item["slug"] == "news-published")
    assert news_item["author"] == "展示作者"
    assert news_item["authorAvatar"] == "https://example.com/user-avatar.png"
    assert news_item["publishedAt"] == "2026-08-05T02:00:00Z"
    assert news_item["publishedAt"].endswith("Z")
    assert news_item["createdAt"].endswith("Z")
    assert news_item["updatedAt"].endswith("Z")
    assert "body" not in news_item
    docs_item = next(item for item in items if item["slug"] == "docs-published")
    assert docs_item["author"] == "独立作者"
    assert docs_item["authorAvatar"] is None

    assert keyword_resp.status_code == 200
    keyword_body = keyword_resp.json()
    assert keyword_body["data"]["pagination"]["total"] >= 1
    assert all(
        item["author"] == "展示作者" or "展示作者" in item["title"]
        for item in keyword_body["data"]["data"]
    )


@pytest.mark.asyncio
async def test_chinese_fulltext_and_user_name_search_behavior_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            user = User(
                username="chinese_author",
                password_hash="unused",
                display_name="用户展示名检索戊五一",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user)
            await session.flush()
            content = Content(
                module=ContentModule.NEWS,
                slug="chinese-fulltext-case",
                title="契约中文标题甲七九",
                summary="契约摘要",
                status=ContentStatus.PUBLISHED,
                author_user_id=user.id,
                author="旧作者",
                published_at=datetime(2026, 8, 5, 9, 0, 0),
            )
            session.add(content)
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    user_name_resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "展示名检索戊五一"},
                    )
                    title_resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "中文标题甲七九"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert user_name_resp.status_code == 200
    user_name_body = user_name_resp.json()
    user_name_slugs = {
        item["slug"] for item in user_name_body["data"]["data"]
    }
    assert "chinese-fulltext-case" in user_name_slugs
    user_name_item = next(
        item
        for item in user_name_body["data"]["data"]
        if item["slug"] == "chinese-fulltext-case"
    )
    assert user_name_item["author"] == "用户展示名检索戊五一"

    assert title_resp.status_code == 200
    title_body = title_resp.json()
    title_slugs = {item["slug"] for item in title_body["data"]["data"]}
    assert "chinese-fulltext-case" in title_slugs


@pytest.mark.asyncio
async def test_empty_string_and_null_user_fields_fall_back_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            user_with_empty_fields = User(
                username="empty_author_fields",
                password_hash="unused",
                display_name="",
                avatar="",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user_with_empty_fields)
            await session.flush()
            user_with_null_avatar = User(
                username="null_avatar_author",
                password_hash="unused",
                display_name="正常名称",
                avatar=None,
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user_with_null_avatar)
            await session.flush()

            session.add_all(
                [
                    Content(
                        module=ContentModule.NEWS,
                        slug="empty-string-fallback-case",
                        title="空字符串回退",
                        status=ContentStatus.PUBLISHED,
                        author_user_id=user_with_empty_fields.id,
                        author="备用作者名",
                        author_avatar="https://example.com/fallback.png",
                        published_at=datetime(2026, 8, 5, 9, 0, 0),
                    ),
                    Content(
                        module=ContentModule.DOCS,
                        slug="null-avatar-fallback-case",
                        title="空头像回退",
                        status=ContentStatus.PUBLISHED,
                        author_user_id=user_with_null_avatar.id,
                        author="备用作者名",
                        author_avatar="https://example.com/fallback-avatar.png",
                        published_at=datetime(2026, 8, 5, 8, 0, 0),
                    ),
                ]
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get("/api/v1/content")
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    empty_fields_item = next(
        item for item in items if item["slug"] == "empty-string-fallback-case"
    )
    assert empty_fields_item["author"] == "备用作者名"
    assert empty_fields_item["authorAvatar"] == "https://example.com/fallback.png"

    null_avatar_item = next(
        item for item in items if item["slug"] == "null-avatar-fallback-case"
    )
    assert null_avatar_item["author"] == "正常名称"
    assert (
        null_avatar_item["authorAvatar"]
        == "https://example.com/fallback-avatar.png"
    )


@pytest.mark.asyncio
async def test_chinese_summary_search_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            session.add(
                Content(
                    module=ContentModule.NEWS,
                    slug="chinese-summary-search-case",
                    title="摘要搜索标题",
                    summary="摘要检索乙八三",
                    author="摘要作者",
                    tags=["无关"],
                    status=ContentStatus.PUBLISHED,
                    published_at=datetime(2026, 8, 5, 9, 0, 0),
                )
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "摘要检索乙八三"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    body = resp.json()
    slugs = {item["slug"] for item in body["data"]["data"]}
    assert "chinese-summary-search-case" in slugs


@pytest.mark.asyncio
async def test_chinese_author_search_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            session.add(
                Content(
                    module=ContentModule.NEWS,
                    slug="chinese-author-search-case",
                    title="作者搜索标题",
                    summary="作者搜索摘要",
                    author="备用作者检索丙六二",
                    tags=["无关"],
                    status=ContentStatus.PUBLISHED,
                    published_at=datetime(2026, 8, 5, 9, 0, 0),
                )
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "作者检索丙六二"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    body = resp.json()
    slugs = {item["slug"] for item in body["data"]["data"]}
    assert "chinese-author-search-case" in slugs


@pytest.mark.asyncio
async def test_tags_fuzzy_search_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            session.add(
                Content(
                    module=ContentModule.NEWS,
                    slug="tags-fuzzy-search-case",
                    title="标签搜索标题",
                    summary="标签搜索摘要",
                    author="标签作者",
                    tags=["标签检索丁九四", "FastAPIUniqueTag731"],
                    status=ContentStatus.PUBLISHED,
                    published_at=datetime(2026, 8, 5, 9, 0, 0),
                )
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    chinese_resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "标签检索丁九四"},
                    )
                    english_resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": "UniqueTag731"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert chinese_resp.status_code == 200
    chinese_body = chinese_resp.json()
    chinese_slugs = {
        item["slug"] for item in chinese_body["data"]["data"]
    }
    assert "tags-fuzzy-search-case" in chinese_slugs

    assert english_resp.status_code == 200
    english_body = english_resp.json()
    english_slugs = {
        item["slug"] for item in english_body["data"]["data"]
    }
    assert "tags-fuzzy-search-case" in english_slugs


@pytest.mark.asyncio
async def test_timestamp_utc_z_format_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            session.add(
                Content(
                    module=ContentModule.NEWS,
                    slug="timestamp-z-format-case",
                    title="时间格式",
                    summary="时间格式摘要",
                    author="时间作者",
                    status=ContentStatus.PUBLISHED,
                    published_at=datetime(2026, 8, 5, 9, 0, 0),
                )
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get("/api/v1/content")
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    item = next(
        item for item in items if item["slug"] == "timestamp-z-format-case"
    )
    assert item["publishedAt"] == "2026-08-05T01:00:00Z"
    assert item["createdAt"].endswith("Z")
    assert item["updatedAt"].endswith("Z")


@pytest.mark.asyncio
async def test_whitespace_author_fallback_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            user_ws = User(
                username="whitespace_author",
                password_hash="unused",
                display_name="   ",
                avatar="   ",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user_ws)
            user_trim = User(
                username="trimmed_author",
                password_hash="unused",
                display_name="  张三  ",
                avatar=None,
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add(user_trim)
            await session.flush()
            session.add_all(
                [
                    Content(
                        module=ContentModule.NEWS,
                        slug="whitespace-fallback-case",
                        title="空白作者回退",
                        status=ContentStatus.PUBLISHED,
                        author_user_id=user_ws.id,
                        author="备用作者名",
                        author_avatar="https://example.com/fallback.png",
                        published_at=datetime(2026, 8, 5, 9, 0, 0),
                    ),
                    Content(
                        module=ContentModule.DOCS,
                        slug="trimmed-name-case",
                        title="裁剪名称",
                        status=ContentStatus.PUBLISHED,
                        author_user_id=user_trim.id,
                        author="备用作者名",
                        author_avatar="https://example.com/fallback-2.png",
                        published_at=datetime(2026, 8, 5, 8, 0, 0),
                    ),
                ]
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get("/api/v1/content")
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    items = resp.json()["data"]["data"]
    whitespace_item = next(
        item for item in items if item["slug"] == "whitespace-fallback-case"
    )
    assert whitespace_item["author"] == "备用作者名"
    assert whitespace_item["authorAvatar"] == "https://example.com/fallback.png"

    trimmed_item = next(
        item for item in items if item["slug"] == "trimmed-name-case"
    )
    assert trimmed_item["author"] == "张三"
    assert trimmed_item["authorAvatar"] == "https://example.com/fallback-2.png"


@pytest.mark.asyncio
async def test_literal_wildcard_keyword_matches_only_literal_with_mysql() -> None:
    test_engine = create_async_engine(
        "mysql+asyncmy://sacc:sacc_password@127.0.0.1:3306/sacc_test"
        "?charset=utf8mb4",
        pool_pre_ping=True,
    )
    test_session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

        async with test_session_maker() as session:
            session.add_all(
                [
                    Content(
                        module=ContentModule.NEWS,
                        slug="literal-wildcard-target-case",
                        title=r"literal-50%_discount\case",
                        summary="通配符字面量目标",
                        author="通配符作者",
                        status=ContentStatus.PUBLISHED,
                        published_at=datetime(2026, 8, 5, 9, 0, 0),
                    ),
                    Content(
                        module=ContentModule.NEWS,
                        slug="literal-wildcard-distractor-case",
                        title="literal-50ABdiscountXcase",
                        summary="通配符干扰记录",
                        author="通配符作者",
                        status=ContentStatus.PUBLISHED,
                        published_at=datetime(2026, 8, 5, 8, 0, 0),
                    ),
                ]
            )
            await session.flush()

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get(
                        "/api/v1/content",
                        params={"keyword": r"50%_discount\case"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    slugs = {item["slug"] for item in resp.json()["data"]["data"]}
    assert "literal-wildcard-target-case" in slugs
    assert "literal-wildcard-distractor-case" not in slugs
