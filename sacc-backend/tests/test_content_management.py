from datetime import datetime

import pytest
from fastapi import HTTPException

from app.models.audit_log import AuditLog
from app.models.content import Content, ContentModule, ContentStatus
from app.models.user import User, UserRole, UserStatus
from app.schemas.content import ReorderRequest, UpsertContentRequest
from app.services import content as content_service


class FakeScalarResult:
    def __init__(self, value=None, rows=None):
        self.value = value
        self.rows = rows or []

    def scalar_one_or_none(self):
        return self.value

    def scalars(self):
        return self

    def all(self):
        return self.rows


class FakeSession:
    def __init__(self, *, existing=None, rows=None):
        self.existing = existing
        self.rows = rows or []
        self.added = []
        self.commits = 0

    async def execute(self, _):
        return FakeScalarResult(rows=self.rows)

    async def scalar(self, _):
        return 0

    async def get(self, _, __):
        return self.existing

    def add(self, value):
        self.added.append(value)

    async def flush(self):
        for value in self.added:
            if isinstance(value, Content) and value.id is None:
                value.id = 1
                value.created_at = datetime(2026, 8, 4, 12, 0, 0)
                value.updated_at = datetime(2026, 8, 4, 12, 0, 0)

    async def commit(self):
        self.commits += 1

    async def refresh(self, _):
        return None


def actor() -> User:
    return User(
        id=7,
        username="editor",
        password_hash="unused",
        display_name="编辑员",
        role=UserRole.EDITOR,
        status=UserStatus.ACTIVE,
    )


@pytest.mark.asyncio
async def test_create_content_generates_slug_and_audit_log() -> None:
    db = FakeSession()
    payload = UpsertContentRequest(
        module="news",
        title="科协暑期开发",
        status="published",
        tags=["SACC"],
    )

    created = await content_service.create_content(db, actor(), payload)

    assert created.slug == "ke-xie-shu-qi-kai-fa"
    assert created.status == ContentStatus.PUBLISHED
    assert created.author == "编辑员"
    assert created.published_at is not None
    assert any(isinstance(item, AuditLog) for item in db.added)
    assert db.commits == 1


@pytest.mark.asyncio
async def test_reorder_updates_ids_in_requested_order() -> None:
    rows = [
        Content(id=2, module=ContentModule.DOCS, slug="b", title="B"),
        Content(id=1, module=ContentModule.DOCS, slug="a", title="A"),
    ]
    db = FakeSession(rows=rows)

    await content_service.reorder_content(
        db,
        actor(),
        ReorderRequest(module="docs", orderedIds=[1, 2]),
    )

    assert {row.id: row.sort_order for row in rows} == {1: 0, 2: 1}
    assert db.commits == 1


@pytest.mark.asyncio
async def test_reorder_rejects_duplicate_ids() -> None:
    with pytest.raises(HTTPException) as raised:
        await content_service.reorder_content(
            FakeSession(),
            actor(),
            ReorderRequest(module="docs", orderedIds=[1, 1]),
        )
    assert raised.value.status_code == 400


@pytest.mark.asyncio
async def test_delete_archives_content() -> None:
    item = Content(
        id=1,
        module=ContentModule.NEWS,
        slug="news",
        title="News",
        status=ContentStatus.PUBLISHED,
    )
    db = FakeSession(existing=item)

    await content_service.delete_content(db, actor(), 1)

    assert item.status == ContentStatus.ARCHIVED
    assert db.commits == 1
