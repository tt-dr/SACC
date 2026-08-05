# -*- coding: utf-8 -*-
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient, Response
from jose import jwt
from sqlalchemy import Select, text
from sqlalchemy.dialects import mysql
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import get_db
from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.services.user import list_admin_users


EXPECTED_USER_KEYS = {
    "id",
    "username",
    "displayName",
    "avatar",
    "role",
    "position",
    "desc",
    "status",
    "createdAt",
}
SENSITIVE_KEYS = {
    "password",
    "passwordHash",
    "password_hash",
    "memberGroup",
    "member_group",
    "updatedAt",
    "updated_at",
}


def make_user(
    user_id: int,
    *,
    username: str | None = None,
    role: UserRole = UserRole.EDITOR,
    status: UserStatus = UserStatus.ACTIVE,
    display_name: str = "成员",
) -> User:
    return User(
        id=user_id,
        username=username or f"user_{user_id}",
        password_hash="unused",
        display_name=display_name,
        role=role,
        status=status,
        position="负责人",
        desc="简介",
        created_at=datetime(2026, 8, 5, 12, 0, 0),
    )


def make_token(
    *,
    sub: Any = "1",
    include_sub: bool = True,
    include_jti: bool = True,
    include_iat: bool = True,
    include_exp: bool = True,
    jti: str = "test-jti",
    exp_delta: timedelta = timedelta(hours=1),
) -> str:
    now = int(datetime.now(timezone.utc).timestamp())
    payload: dict[str, Any] = {}
    if include_exp:
        payload["exp"] = now + int(exp_delta.total_seconds())
    if include_jti:
        payload["jti"] = jti
    if include_iat:
        payload["iat"] = now
    if include_sub:
        payload["sub"] = sub
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


class _FakeScalarResult:
    def __init__(self, rows: list[User]) -> None:
        self._rows = rows

    def all(self) -> list[User]:
        return self._rows


class _FakeDb:
    """按 id 提供 get 查询，并捕获传给 scalars 的列表查询语句。"""

    def __init__(
        self,
        users: list[User] | None = None,
        *,
        list_rows: list[User] | None = None,
    ) -> None:
        self._users = {user.id: user for user in (users or [])}
        self._list_rows = (
            list_rows if list_rows is not None else list(self._users.values())
        )
        self.statements: list[Select[Any]] = []

    async def get(self, model: type[User], ident: int) -> User | None:
        return self._users.get(ident)

    async def scalars(self, stmt: Select[Any]) -> _FakeScalarResult:
        self.statements.append(stmt)
        return _FakeScalarResult(list(self._list_rows))


async def get_users(
    token: str | None,
    fake_db: _FakeDb,
) -> Response:
    async def override_get_db() -> Any:
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            return await client.get("/api/v1/admin/users", headers=headers)
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_list_admin_users_returns_all_users_sorted_by_id() -> None:
    fake_db = _FakeDb(
        [
            make_user(2, status=UserStatus.DISABLED),
            make_user(1, status=UserStatus.ACTIVE),
        ]
    )

    response = await list_admin_users(fake_db)  # type: ignore[arg-type]

    assert {item.id for item in response.root} == {1, 2}
    assert {item.status.value for item in response.root} == {
        "active",
        "disabled",
    }
    sql = str(fake_db.statements[0].compile(dialect=mysql.dialect()))
    assert "WHERE" not in sql
    assert "ORDER BY users.id ASC" in sql
    assert "users.password_hash" not in sql
    assert "users.member_group" not in sql
    assert "users.updated_at" not in sql


@pytest.mark.asyncio
async def test_list_admin_users_with_no_rows_returns_empty_list() -> None:
    response = await list_admin_users(_FakeDb([]))  # type: ignore[arg-type]

    assert response.root == []


@pytest.mark.asyncio
async def test_super_admin_gets_all_users_with_camel_case_fields() -> None:
    users = [
        make_user(
            1,
            username="admin",
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
            display_name="管理员",
        ),
        make_user(
            2,
            username="disabled_editor",
            role=UserRole.EDITOR,
            status=UserStatus.DISABLED,
            display_name="禁用编辑",
        ),
    ]
    fake_db = _FakeDb(users)

    resp = await get_users(make_token(sub="1"), fake_db)

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["message"] == "获取用户列表成功"
    assert isinstance(body["data"], list)
    assert [item["id"] for item in body["data"]] == [1, 2]
    assert {item["status"] for item in body["data"]} == {
        "active",
        "disabled",
    }
    for item in body["data"]:
        assert set(item) == EXPECTED_USER_KEYS
        assert SENSITIVE_KEYS & set(item) == set()
        assert "display_name" not in item
        assert "created_at" not in item
    admin_item = body["data"][0]
    assert admin_item["username"] == "admin"
    assert admin_item["displayName"] == "管理员"
    assert admin_item["role"] == "super_admin"
    assert admin_item["createdAt"] == "2026-08-05T12:00:00"
    sql = str(fake_db.statements[0].compile(dialect=mysql.dialect()))
    assert "WHERE" not in sql
    assert "ORDER BY users.id ASC" in sql
    assert "users.password_hash" not in sql
    assert "users.member_group" not in sql
    assert "users.updated_at" not in sql


@pytest.mark.asyncio
async def test_super_admin_gets_empty_array_when_no_users() -> None:
    fake_db = _FakeDb(
        [make_user(1, role=UserRole.SUPER_ADMIN)],
        list_rows=[],
    )

    resp = await get_users(make_token(sub="1"), fake_db)

    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_no_token_returns_401_with_www_authenticate() -> None:
    resp = await get_users(None, _FakeDb([make_user(1)]))

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_invalid_token_returns_401() -> None:
    resp = await get_users("not-a-valid-jwt", _FakeDb([make_user(1)]))

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_expired_token_returns_401() -> None:
    token = make_token(exp_delta=timedelta(hours=-1))

    resp = await get_users(token, _FakeDb([make_user(1)]))

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_missing_sub_returns_401() -> None:
    resp = await get_users(
        make_token(include_sub=False),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.parametrize("sub", ["abc", "-1", "1.5", "", "1_0", "+1", " 1"])
@pytest.mark.asyncio
async def test_token_with_invalid_sub_returns_401(sub: Any) -> None:
    resp = await get_users(
        make_token(sub=sub),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_for_missing_user_returns_401() -> None:
    resp = await get_users(
        make_token(sub="999"),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_disabled_user_returns_401() -> None:
    resp = await get_users(
        make_token(sub="1"),
        _FakeDb([make_user(1, status=UserStatus.DISABLED)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_signed_with_wrong_key_returns_401() -> None:
    now = int(datetime.now(timezone.utc).timestamp())
    token = jwt.encode(
        {"sub": "1", "jti": "wrong-key-jti", "iat": now, "exp": now + 3600},
        "a-completely-different-secret",
        algorithm=settings.jwt_algorithm,
    )

    resp = await get_users(token, _FakeDb([make_user(1)]))

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_missing_jti_returns_401() -> None:
    resp = await get_users(
        make_token(include_jti=False),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_missing_iat_returns_401() -> None:
    resp = await get_users(
        make_token(include_iat=False),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_token_missing_exp_returns_401() -> None:
    resp = await get_users(
        make_token(include_exp=False),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_active_editor_returns_403() -> None:
    resp = await get_users(
        make_token(sub="1"),
        _FakeDb([make_user(1)]),
    )

    assert resp.status_code == 403
    assert resp.json() == {"detail": "权限不足"}
    assert "data" not in resp.json()


@pytest.mark.asyncio
async def test_jwt_role_claim_is_not_trusted_for_authorization() -> None:
    now = int(datetime.now(timezone.utc).timestamp())
    token = jwt.encode(
        {
            "sub": "1",
            "jti": "spoofed-role-jti",
            "iat": now,
            "exp": now + 3600,
            "role": "super_admin",
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    resp = await get_users(token, _FakeDb([make_user(1)]))

    assert resp.status_code == 403
    assert resp.json() == {"detail": "权限不足"}


@pytest.mark.asyncio
async def test_active_super_admin_can_access_user_list() -> None:
    fake_db = _FakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await get_users(make_token(sub="1"), fake_db)

    assert resp.status_code == 200
    assert resp.json()["code"] == 200


@pytest.mark.asyncio
async def test_empty_string_avatar_and_null_position_desc_are_returned_raw() -> None:
    user = make_user(1, role=UserRole.SUPER_ADMIN)
    user.avatar = ""
    user.position = None
    user.desc = None

    resp = await get_users(make_token(sub="1"), _FakeDb([user]))

    assert resp.status_code == 200
    item = resp.json()["data"][0]
    assert item["avatar"] == ""
    assert item["position"] is None
    assert item["desc"] is None


@pytest.mark.asyncio
async def test_admin_users_route_end_to_end_with_mysql() -> None:
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
            admin = User(
                username=f"e2e_admin_{uuid4().hex[:8]}",
                password_hash="unused",
                display_name="列表管理员",
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE,
                position="负责人",
                desc="系统管理员",
            )
            disabled_editor = User(
                username=f"e2e_disabled_{uuid4().hex[:8]}",
                password_hash="unused",
                display_name="禁用编辑",
                role=UserRole.EDITOR,
                status=UserStatus.DISABLED,
            )
            session.add_all([admin, disabled_editor])
            await session.flush()
            token = make_token(
                sub=str(admin.id),
                jti=f"e2e-list-{uuid4().hex[:8]}",
            )

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.get(
                        "/api/v1/admin/users",
                        headers={"Authorization": f"Bearer {token}"},
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)
                await session.rollback()
    finally:
        await test_engine.dispose()

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["message"] == "获取用户列表成功"
    items = {item["username"]: item for item in body["data"]}
    assert admin.username in items
    assert disabled_editor.username in items
    admin_item = items[admin.username]
    assert admin_item["displayName"] == "列表管理员"
    assert admin_item["role"] == "super_admin"
    assert admin_item["status"] == "active"
    assert set(admin_item) == EXPECTED_USER_KEYS
    assert SENSITIVE_KEYS & set(admin_item) == set()
    assert items[disabled_editor.username]["status"] == "disabled"
    ids = [item["id"] for item in body["data"]]
    assert ids == sorted(ids)
