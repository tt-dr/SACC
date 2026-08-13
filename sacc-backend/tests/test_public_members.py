from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import Select, text
from sqlalchemy.dialects import mysql

from app.database import AsyncSessionLocal, get_db
from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.services.user import (
    _build_public_members_response,
)


def make_user(
    user_id: int,
    *,
    display_name: str = "成员",
    member_group: str | None = "后端组",
    status: UserStatus = UserStatus.ACTIVE,
) -> User:
    return User(
        id=user_id,
        username=f"user_{user_id}",
        password_hash="unused",
        display_name=display_name,
        role=UserRole.EDITOR,
        status=status,
        member_group=member_group,
    )


class _FakeScalarResult:
    def __init__(self, rows: list[User]) -> None:
        self._rows = rows

    def all(self) -> list[User]:
        return self._rows


class _FakeDb:
    def __init__(self, rows: list[User]) -> None:
        self._rows = rows
        self.statement: Select[tuple[User]] | None = None

    async def scalars(self, stmt: Select[tuple[User]]) -> _FakeScalarResult:
        self.statement = stmt
        return _FakeScalarResult(self._rows)


def test_active_members_are_grouped_in_fixed_order() -> None:
    users = [
        make_user(3, member_group="后端组"),
        make_user(1, member_group="主席团"),
        make_user(2, member_group="前端组"),
    ]

    response = _build_public_members_response(users)

    assert response.groups == ["主席团", "前端组", "后端组"]
    assert [item.id for item in response.data] == [1, 2, 3]
    assert [item.group for item in response.data] == [
        "主席团",
        "前端组",
        "后端组",
    ]


def test_null_empty_and_whitespace_groups_are_excluded() -> None:
    users = [
        make_user(1, member_group=None),
        make_user(2, member_group=""),
        make_user(3, member_group="   "),
        make_user(4, member_group="后端组"),
    ]

    response = _build_public_members_response(users)

    assert [item.id for item in response.data] == [4]
    assert response.groups == ["后端组"]


def test_empty_display_name_is_excluded() -> None:
    users = [
        make_user(1, display_name=""),
        make_user(2, display_name="   "),
        make_user(3, display_name="成员三"),
    ]

    response = _build_public_members_response(users)

    assert [item.id for item in response.data] == [3]
    assert response.groups == ["后端组"]


def test_member_group_leading_and_trailing_spaces_are_stripped() -> None:
    response = _build_public_members_response(
        [make_user(1, member_group="  后端组  ")]
    )

    assert response.data[0].group == "后端组"
    assert response.groups == ["后端组"]


def test_unknown_groups_follow_known_groups_and_sort_by_pinyin() -> None:
    users = [
        make_user(1, member_group="外联组"),
        make_user(2, member_group="后端组"),
        make_user(3, member_group="设计组"),
        make_user(4, member_group="主席团"),
    ]

    response = _build_public_members_response(users)

    # 设计组(shejizu) < 外联组(wailianzu)，按拼音而非 Unicode 码点。
    assert response.groups == ["主席团", "后端组", "设计组", "外联组"]
    assert [item.id for item in response.data] == [4, 2, 3, 1]


def test_members_in_same_group_are_sorted_by_id_ascending() -> None:
    response = _build_public_members_response(
        [
            make_user(10, member_group="后端组"),
            make_user(2, member_group="后端组"),
            make_user(7, member_group="后端组"),
        ]
    )

    assert [item.id for item in response.data] == [2, 7, 10]
    assert response.groups == ["后端组"]


def test_groups_only_contains_present_groups_without_duplicates() -> None:
    response = _build_public_members_response(
        [
            make_user(1, member_group="主席团"),
            make_user(2, member_group="主席团"),
            make_user(3, member_group="后端组"),
        ]
    )

    assert response.groups == ["主席团", "后端组"]


def test_no_members_returns_empty_response() -> None:
    response = _build_public_members_response([])

    assert response.data == []
    assert response.groups == []


@pytest.mark.asyncio
async def test_route_returns_camel_case_public_fields_only() -> None:
    fake_db = _FakeDb(
        [
            User(
                id=1,
                username="member_1",
                password_hash="unused",
                display_name="成员一",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
                member_group="后端组",
                position="组长",
                desc="介绍",
            )
        ]
    )

    async def override_get_db() -> Any:
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.get("/api/v1/public/members")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["message"] == "获取成员列表成功"
    item = body["data"]["data"][0]
    assert item["displayName"] == "成员一"
    assert "display_name" not in item
    assert {"username", "password_hash", "role", "status", "created_at", "updated_at"} & set(
        item
    ) == set()
    assert set(item) == {"id", "displayName", "avatar", "position", "desc", "group"}
    assert fake_db.statement is not None
    compiled_sql = str(fake_db.statement.compile(dialect=mysql.dialect()))
    assert "users.status" in compiled_sql
    assert "users.member_group IS NOT NULL" in compiled_sql


@pytest.mark.asyncio
async def test_route_returns_200_with_empty_arrays_when_no_members() -> None:
    fake_db = _FakeDb([])

    async def override_get_db() -> Any:
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.get("/api/v1/public/members")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert resp.status_code == 200
    assert resp.json()["data"] == {"data": [], "groups": []}


@pytest.mark.asyncio
async def test_members_route_end_to_end_with_mysql() -> None:
    async with AsyncSessionLocal() as probe_session:
        try:
            (await probe_session.execute(text("SELECT 1"))).scalar_one()
        except Exception as exc:
            pytest.skip(f"MySQL 不可用，跳过端到端集成测试：{exc!r}")

    rows = [
        User(
            username="presidium_1",
            password_hash="unused",
            display_name="主席甲",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="主席团",
        ),
        User(
            username="presidium_2",
            password_hash="unused",
            display_name="主席乙",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="主席团",
        ),
        User(
            username="frontend_1",
            password_hash="unused",
            display_name="前端甲",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="前端组",
        ),
        User(
            username="backend_1",
            password_hash="unused",
            display_name="后端甲",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group=" 后端组 ",
        ),
        User(
            username="security_1",
            password_hash="unused",
            display_name="安全甲",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group=" 安全组 ",
        ),
        User(
            username="unknown_z",
            password_hash="unused",
            display_name="未知Z",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="Z组",
        ),
        User(
            username="unknown_a",
            password_hash="unused",
            display_name="未知A",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="A组",
        ),
        User(
            username="backend_disabled",
            password_hash="unused",
            display_name="禁用成员",
            role=UserRole.EDITOR,
            status=UserStatus.DISABLED,
            member_group="后端组",
        ),
        User(
            username="no_group_null",
            password_hash="unused",
            display_name="无分组",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group=None,
        ),
        User(
            username="no_group_empty",
            password_hash="unused",
            display_name="空分组",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="",
        ),
        User(
            username="no_group_spaces",
            password_hash="unused",
            display_name="空格分组",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="   ",
        ),
        User(
            username="no_name_empty",
            password_hash="unused",
            display_name="",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="后端组",
        ),
        User(
            username="no_name_spaces",
            password_hash="unused",
            display_name="   ",
            role=UserRole.EDITOR,
            status=UserStatus.ACTIVE,
            member_group="后端组",
        ),
    ]

    async with AsyncSessionLocal() as session:
        session.add_all(rows)
        await session.flush()
        ids = {row.username: row.id for row in rows}

        async def override_get_db() -> Any:
            yield session

        app.dependency_overrides[get_db] = override_get_db
        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                resp = await client.get("/api/v1/public/members")
        finally:
            app.dependency_overrides.pop(get_db, None)
            await session.rollback()

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["groups"] == [
        "主席团",
        "前端组",
        "后端组",
        "安全组",
        "A组",
        "Z组",
    ]
    assert [item["id"] for item in body["data"]["data"]] == [
        ids["presidium_1"],
        ids["presidium_2"],
        ids["frontend_1"],
        ids["backend_1"],
        ids["security_1"],
        ids["unknown_a"],
        ids["unknown_z"],
    ]
    assert [item["group"] for item in body["data"]["data"]] == [
        "主席团",
        "主席团",
        "前端组",
        "后端组",
        "安全组",
        "A组",
        "Z组",
    ]
    assert body["data"]["data"][0]["displayName"] == "主席甲"
    assert body["data"]["data"][0]["position"] is None
    assert body["data"]["data"][0]["desc"] is None
    assert body["data"]["data"][0]["avatar"] is None
    for item in body["data"]["data"]:
        assert "display_name" not in item
        assert {"username", "password_hash", "role", "status", "created_at", "updated_at"} & set(
            item
        ) == set()
