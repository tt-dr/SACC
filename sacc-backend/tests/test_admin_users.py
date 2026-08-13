# -*- coding: utf-8 -*-
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import bcrypt
import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient, Response
from jose import jwt
from sqlalchemy import Column, Select, delete, func, select, text
from sqlalchemy.dialects import mysql
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.sql.elements import BinaryExpression, BindParameter

from app.config import settings
from app.database import get_db
from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import CreateUserRequest, UpdateUserRequest
from app.services.user import create_user as create_user_service
from app.services.user import list_admin_users
from app.services.user import update_user as update_user_service


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
    assert resp.json() == {"code": 403, "message": "权限不足", "data": None}
    assert resp.json()["data"] is None


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
    assert resp.json() == {"code": 403, "message": "权限不足", "data": None}


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


class _CreateUserScalarResult:
    def __init__(self, rows: list[Any]) -> None:
        self._rows = rows

    def first(self) -> Any | None:
        return self._rows[0] if self._rows else None


class _CreateUserFakeDb:
    """创建用户接口专用 Fake Session，具备 get/scalars/add/commit/rollback。"""

    def __init__(
        self,
        users: list[User] | None = None,
        *,
        commit_error: BaseException | None = None,
    ) -> None:
        self._users = {user.id: user for user in (users or [])}
        self._by_username = {user.username: user for user in (users or [])}
        self.added: list[User] = []
        self.statements: list[Select[Any]] = []
        self.committed = False
        self.rolled_back = False
        self.commit_error = commit_error

    async def get(self, model: type[User], ident: int) -> User | None:
        return self._users.get(ident)

    async def scalars(self, stmt: Select[Any]) -> _CreateUserScalarResult:
        self.statements.append(stmt)
        username = self._lookup_username(stmt)
        if username is None:
            return _CreateUserScalarResult([])
        user = self._by_username.get(username)
        return _CreateUserScalarResult([user.id] if user is not None else [])

    @staticmethod
    def _lookup_username(stmt: Select[Any]) -> str | None:
        """从查询条件中提取按 users.username 等值比较的字面值，不依赖参数命名。"""
        username_column = User.username.property.columns[0]
        matches: list[Any] = []

        def walk(node: Any) -> None:
            if node is None:
                return
            if isinstance(node, BinaryExpression):
                for left, right in (
                    (node.left, node.right),
                    (node.right, node.left),
                ):
                    if (
                        isinstance(left, Column)
                        and left.compare(username_column)
                        and isinstance(right, BindParameter)
                    ):
                        matches.append(right.value)
            for child in node.get_children():
                walk(child)

        walk(stmt.whereclause)
        return matches[0] if matches else None

    def add(self, user: User) -> None:
        self.added.append(user)

    async def commit(self) -> None:
        if self.commit_error is not None:
            raise self.commit_error
        self.committed = True
        for user in self.added:
            self._by_username[user.username] = user
            if user.id is None:
                user.id = max(self._users, default=0) + 1
            self._users[user.id] = user

    async def rollback(self) -> None:
        self.rolled_back = True

    @property
    def created_users(self) -> list[User]:
        return list(self.added)

    @property
    def persisted_users(self) -> list[User]:
        return list(self._users.values())


async def create_user_via_api(
    token: str | None,
    fake_db: _CreateUserFakeDb,
    payload: dict[str, Any] | None = None,
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
            return await client.post(
                "/api/v1/admin/users",
                json=payload or {},
                headers=headers,
            )
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_super_admin_creates_user_successfully() -> None:
    fake_db = _CreateUserFakeDb(
        [make_user(1, role=UserRole.SUPER_ADMIN, username="admin")]
    )
    payload = {
        "username": "linjiahe",
        "displayName": "林嘉禾",
        "password": "pass123",
        "role": "editor",
        "position": "前端组组长",
        "desc": "官网、组件库、工程化，一砖一瓦建起来。",
        "avatar": "/uploads/avatars/linjiahe.png",
    }

    resp = await create_user_via_api(make_token(sub="1"), fake_db, payload)

    assert resp.status_code == 200
    assert resp.json() == {
        "code": 200,
        "message": "创建成功",
        "data": None,
    }
    assert fake_db.committed
    assert len(fake_db.created_users) == 1
    created = fake_db.created_users[0]
    assert created.username == "linjiahe"
    assert created.display_name == "林嘉禾"
    assert created.role == UserRole.EDITOR
    assert created.position == "前端组组长"
    assert created.desc == "官网、组件库、工程化，一砖一瓦建起来。"
    assert created.avatar == "/uploads/avatars/linjiahe.png"
    assert created.status == UserStatus.ACTIVE


@pytest.mark.asyncio
async def test_created_user_password_is_bcrypt_hashed_and_never_returned() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])
    password = "pass123"

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "editor_a", "password": password},
    )

    assert resp.status_code == 200
    assert "password" not in resp.text.lower()
    stored_hash = fake_db.created_users[0].password_hash
    assert stored_hash != password
    assert bcrypt.checkpw(
        password.encode("utf-8"),
        stored_hash.encode("utf-8"),
    )


@pytest.mark.asyncio
async def test_create_user_defaults_role_to_editor() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "editor_b", "password": "pass123"},
    )

    assert resp.status_code == 200
    assert fake_db.created_users[0].role == UserRole.EDITOR


@pytest.mark.asyncio
async def test_duplicate_username_returns_400_without_touching_existing_user() -> None:
    existing = make_user(
        1,
        role=UserRole.SUPER_ADMIN,
        username="linjiahe",
        display_name="林嘉禾",
    )
    fake_db = _CreateUserFakeDb([existing])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {
            "username": "linjiahe",
            "displayName": "新账号",
            "password": "otherpass",
        },
    )

    assert resp.status_code == 400
    assert resp.json() == {"code": 400, "message": "用户名已存在", "data": None}
    assert fake_db.created_users == []
    assert not fake_db.committed
    assert existing.display_name == "林嘉禾"
    assert existing.password_hash == "unused"


@pytest.mark.asyncio
async def test_commit_integrity_error_rolls_back_and_returns_400() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    fake_db = _CreateUserFakeDb(
        [admin],
        commit_error=IntegrityError(
            "INSERT INTO users (username) VALUES (:username)",
            {"username": "race_user"},
            Exception(1062, "Duplicate entry 'race_user' for key 'username'"),
        ),
    )

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "race_user", "password": "pass123"},
    )

    assert resp.status_code == 400
    assert resp.json() == {"code": 400, "message": "用户名已存在", "data": None}
    assert fake_db.rolled_back
    assert fake_db.persisted_users == [admin]


@pytest.mark.asyncio
async def test_non_duplicate_integrity_error_is_re_raised_after_rollback() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    non_duplicate_error = IntegrityError(
        "INSERT INTO users (username, display_name) VALUES "
        "(:username, :display_name)",
        {"username": "bad_user", "display_name": None},
        Exception(1048, "Column 'display_name' cannot be null"),
    )
    fake_db = _CreateUserFakeDb([admin], commit_error=non_duplicate_error)
    payload = CreateUserRequest(username="bad_user", password="pass123")

    with pytest.raises(IntegrityError) as exc_info:
        await create_user_service(fake_db, admin, payload)  # type: ignore[arg-type]

    assert exc_info.value is non_duplicate_error
    assert fake_db.rolled_back
    assert fake_db.persisted_users == [admin]


@pytest.mark.asyncio
async def test_editor_cannot_create_user_returns_403() -> None:
    fake_db = _CreateUserFakeDb([make_user(1)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "hacker", "password": "pass123"},
    )

    assert resp.status_code == 403
    assert resp.json() == {"code": 403, "message": "权限不足", "data": None}
    assert fake_db.created_users == []
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_no_token_cannot_create_user_returns_401() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        None,
        fake_db,
        {"username": "no_auth_user", "password": "pass123"},
    )

    assert resp.status_code == 401
    assert fake_db.created_users == []
    assert not fake_db.committed


@pytest.mark.parametrize(
    "payload",
    [
        {"username": "editor_a", "password": "12345"},
        {"username": "editor_a", "password": "pass123", "role": "viewer"},
        {"username": "", "password": "pass123"},
        {"username": "   ", "password": "pass123"},
        {"username": "a" * 65, "password": "pass123"},
    ],
)
@pytest.mark.asyncio
async def test_create_user_invalid_payload_returns_400(
    payload: dict[str, Any],
) -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(make_token(sub="1"), fake_db, payload)

    assert resp.status_code == 400
    assert fake_db.created_users == []
    assert not fake_db.committed


def test_create_user_openapi_success_response_is_200_not_201() -> None:
    operation = app.openapi()["paths"]["/api/v1/admin/users"]["post"]

    assert "200" in operation["responses"]
    assert "201" not in operation["responses"]


@pytest.mark.asyncio
async def test_create_user_optional_fields_default_to_none() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "optional_user", "password": "pass123"},
    )

    assert resp.status_code == 200
    created = fake_db.created_users[0]
    assert created.position is None
    assert created.desc is None
    assert created.avatar is None
    assert created.display_name == ""


@pytest.mark.asyncio
async def test_create_user_service_queries_only_user_id_by_username() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    fake_db = _CreateUserFakeDb([admin])
    payload = CreateUserRequest(username="linjiahe", password="pass123")

    await create_user_service(fake_db, admin, payload)  # type: ignore[arg-type]

    assert len(fake_db.statements) == 1
    sql = " ".join(
        str(fake_db.statements[0].compile(dialect=mysql.dialect())).split()
    )
    assert "SELECT users.id FROM users" in sql
    assert "WHERE users.username" in sql
    assert "users.password_hash" not in sql


@pytest.mark.asyncio
async def test_create_user_service_rejects_overlong_password_with_422() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    fake_db = _CreateUserFakeDb([admin])
    payload = CreateUserRequest.model_construct(
        username="longpass_user",
        password="a" * 73,
        role=UserRole.EDITOR,
    )

    with pytest.raises(HTTPException) as exc_info:
        await create_user_service(fake_db, admin, payload)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 422
    assert "72 字节" in exc_info.value.detail
    assert fake_db.created_users == []
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_create_user_strips_username_whitespace() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "  linjiahe  ", "password": "pass123"},
    )

    assert resp.status_code == 200
    assert fake_db.created_users[0].username == "linjiahe"


@pytest.mark.asyncio
async def test_create_user_accepts_username_within_limit_after_strip() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": " " + "a" * 63 + " ", "password": "pass123"},
    )

    assert resp.status_code == 200
    assert fake_db.created_users[0].username == "a" * 63


@pytest.mark.asyncio
async def test_super_admin_can_create_super_admin() -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {
            "username": "second_admin",
            "password": "pass123",
            "role": "super_admin",
        },
    )

    assert resp.status_code == 200
    assert fake_db.created_users[0].role == UserRole.SUPER_ADMIN


@pytest.mark.parametrize(
    ("password", "expected_status"),
    [
        ("a" * 72, 200),
        ("a" * 73, 400),
        ("密" * 24, 200),
        ("密" * 25, 400),
    ],
)
@pytest.mark.asyncio
async def test_create_user_password_byte_limit(
    password: str,
    expected_status: int,
) -> None:
    fake_db = _CreateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await create_user_via_api(
        make_token(sub="1"),
        fake_db,
        {"username": "byte_user", "password": password},
    )

    assert resp.status_code == expected_status


def test_create_user_response_schema_has_no_password_fields() -> None:
    document = app.openapi()
    operation = document["paths"]["/api/v1/admin/users"]["post"]
    ref = operation["responses"]["200"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    schema_name = ref.rsplit("/", 1)[-1]
    properties = document["components"]["schemas"][schema_name]["properties"]

    assert "data" in properties
    assert {"password", "passwordHash", "password_hash"} & set(properties) == set()


@pytest.mark.asyncio
async def test_create_user_route_end_to_end_with_mysql() -> None:
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
    admin_username = f"e2e_create_admin_{uuid4().hex[:8]}"
    created_username = f"e2e_created_{uuid4().hex[:8]}"
    duplicate_username = f"e2e_duplicate_{uuid4().hex[:8]}"
    cleanup_usernames = [admin_username, created_username, duplicate_username]
    probe_ok = False
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过创建用户端到端测试：{exc!r}")
        probe_ok = True

        async with test_session_maker() as session:
            admin = User(
                username=admin_username,
                password_hash="unused",
                display_name="创建管理员",
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE,
            )
            duplicate_target = User(
                username=duplicate_username,
                password_hash="unused",
                display_name="已存在用户",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
            )
            session.add_all([admin, duplicate_target])
            await session.flush()
            token = make_token(
                sub=str(admin.id),
                jti=f"e2e-create-{uuid4().hex[:8]}",
            )
            password = "pass123"

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.post(
                        "/api/v1/admin/users",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "username": created_username,
                            "displayName": "创建测试员",
                            "password": password,
                            "role": "editor",
                            "position": "后端组",
                            "desc": "e2e 创建",
                            "avatar": "/uploads/avatars/e2e.png",
                        },
                    )
                    duplicate_resp = await client.post(
                        "/api/v1/admin/users",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "username": duplicate_username,
                            "password": "otherpass",
                        },
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)

            assert resp.status_code == 200
            assert resp.json() == {
                "code": 200,
                "message": "创建成功",
                "data": None,
            }
            created = await session.scalar(
                select(User).where(User.username == created_username)
            )
            assert created is not None
            assert created.display_name == "创建测试员"
            assert created.role == UserRole.EDITOR
            assert created.status == UserStatus.ACTIVE
            assert created.position == "后端组"
            assert created.desc == "e2e 创建"
            assert created.avatar == "/uploads/avatars/e2e.png"
            assert created.password_hash != password
            assert bcrypt.checkpw(
                password.encode("utf-8"),
                created.password_hash.encode("utf-8"),
            )

            assert duplicate_resp.status_code == 400
            assert duplicate_resp.json() == {
                "code": 400,
                "message": "用户名已存在",
                "data": None,
            }
            duplicate_count = await session.scalar(
                select(func.count())
                .select_from(User)
                .where(User.username == duplicate_username)
            )
            assert duplicate_count == 1
    finally:
        if probe_ok:
            async with test_session_maker() as cleanup_session:
                await cleanup_session.execute(
                    delete(User).where(User.username.in_(cleanup_usernames))
                )
                await cleanup_session.commit()
        await test_engine.dispose()


class _UpdateUserScalarResult:
    def __init__(self, rows: list[Any]) -> None:
        self._rows = rows

    def all(self) -> list[Any]:
        return self._rows

    def first(self) -> Any | None:
        return self._rows[0] if self._rows else None


class _UpdateUserFakeDb:
    """修改用户接口专用 Fake Session：get/scalars/commit/rollback。"""

    def __init__(
        self,
        users: list[User] | None = None,
        *,
        commit_error: BaseException | None = None,
    ) -> None:
        self._users = {user.id: user for user in (users or [])}
        self.commit_error = commit_error
        self.statements: list[Select[Any]] = []
        self.committed = False
        self.rolled_back = False

    async def get(self, model: type[User], ident: int) -> User | None:
        return self._users.get(ident)

    async def scalars(self, stmt: Select[Any]) -> _UpdateUserScalarResult:
        self.statements.append(stmt)
        username = self._lookup_username(stmt)
        if username is None:
            return _UpdateUserScalarResult([])
        for user in self._users.values():
            if user.username == username:
                return _UpdateUserScalarResult([user.id])
        return _UpdateUserScalarResult([])

    @staticmethod
    def _lookup_username(stmt: Select[Any]) -> str | None:
        """从查询条件中提取按 users.username 等值比较的字面值。"""
        username_column = User.username.property.columns[0]
        matches: list[Any] = []

        def walk(node: Any) -> None:
            if node is None:
                return
            if isinstance(node, BinaryExpression):
                for left, right in (
                    (node.left, node.right),
                    (node.right, node.left),
                ):
                    if (
                        isinstance(left, Column)
                        and left.compare(username_column)
                        and isinstance(right, BindParameter)
                    ):
                        matches.append(right.value)
            for child in node.get_children():
                walk(child)

        walk(stmt.whereclause)
        return matches[0] if matches else None

    async def commit(self) -> None:
        if self.commit_error is not None:
            raise self.commit_error
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True


async def update_user_via_api(
    token: str | None,
    fake_db: _UpdateUserFakeDb,
    user_id: Any,
    payload: dict[str, Any] | None = None,
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
            return await client.put(
                f"/api/v1/admin/users/{user_id}",
                json=payload or {},
                headers=headers,
            )
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_super_admin_updates_user_profile_successfully() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a", display_name="旧名")
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {
            "displayName": "新名字",
            "role": "editor",
            "position": "后端组组长",
            "desc": "新简介",
            "avatar": "/uploads/avatars/new.png",
        },
    )

    assert resp.status_code == 200
    assert resp.json() == {
        "code": 200,
        "message": "修改成功",
        "data": None,
    }
    assert fake_db.committed
    assert target.display_name == "新名字"
    assert target.role == UserRole.EDITOR
    assert target.position == "后端组组长"
    assert target.desc == "新简介"
    assert target.avatar == "/uploads/avatars/new.png"


@pytest.mark.asyncio
async def test_partial_update_only_changes_submitted_fields() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(
        2,
        username="editor_a",
        role=UserRole.EDITOR,
        display_name="旧名",
    )
    target.position = "负责人"
    target.desc = "简介"
    target.avatar = "/uploads/avatars/old.png"
    target.password_hash = "old-hash"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"displayName": "只改名字"},
    )

    assert resp.status_code == 200
    assert target.display_name == "只改名字"
    assert target.username == "editor_a"
    assert target.role == UserRole.EDITOR
    assert target.position == "负责人"
    assert target.desc == "简介"
    assert target.avatar == "/uploads/avatars/old.png"
    assert target.password_hash == "old-hash"
    assert fake_db.committed


@pytest.mark.asyncio
async def test_explicit_null_username_role_display_name_are_ignored() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(
        2,
        username="editor_a",
        role=UserRole.EDITOR,
        display_name="旧名",
    )
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": None, "role": None, "displayName": None},
    )

    assert resp.status_code == 200
    assert target.username == "editor_a"
    assert target.role == UserRole.EDITOR
    assert target.display_name == "旧名"
    assert fake_db.statements == []
    assert fake_db.committed


@pytest.mark.asyncio
async def test_empty_display_name_clears_the_field() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a", display_name="旧名")
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"displayName": ""},
    )

    assert resp.status_code == 200
    assert target.display_name == ""
    assert fake_db.committed


@pytest.mark.asyncio
async def test_empty_payload_commits_without_changes() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(
        2,
        username="editor_a",
        display_name="旧名",
        role=UserRole.EDITOR,
    )
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(make_token(sub="1"), fake_db, 2, {})

    assert resp.status_code == 200
    assert target.username == "editor_a"
    assert target.role == UserRole.EDITOR
    assert target.display_name == "旧名"
    assert target.password_hash == "unused"
    assert fake_db.statements == []
    assert fake_db.committed


@pytest.mark.asyncio
async def test_password_field_omitted_keeps_original_hash() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"displayName": "改名"},
    )

    assert resp.status_code == 200
    assert target.password_hash == "original-hash"
    assert fake_db.committed


@pytest.mark.parametrize("password", [None, ""])
@pytest.mark.asyncio
async def test_password_not_submitted_or_empty_keeps_original(
    password: Any,
) -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])
    payload: dict[str, Any] = {"displayName": "改名"}
    if password is not None:
        payload["password"] = password

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        payload,
    )

    assert resp.status_code == 200
    assert target.password_hash == "original-hash"
    assert fake_db.committed


@pytest.mark.asyncio
async def test_valid_new_password_is_bcrypt_hashed_and_not_returned() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])
    password = "newpass123"

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"password": password},
    )

    assert resp.status_code == 200
    assert target.password_hash != "original-hash"
    assert target.password_hash != password
    assert bcrypt.checkpw(
        password.encode("utf-8"),
        target.password_hash.encode("utf-8"),
    )
    assert "password" not in resp.text.lower()
    assert fake_db.committed


@pytest.mark.asyncio
async def test_null_position_desc_avatar_clears_database_fields() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    target.position = "负责人"
    target.desc = "简介"
    target.avatar = "/uploads/avatars/old.png"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"position": None, "desc": None, "avatar": None},
    )

    assert resp.status_code == 200
    assert target.position is None
    assert target.desc is None
    assert target.avatar is None
    assert fake_db.committed


@pytest.mark.asyncio
async def test_username_trailing_whitespace_is_stripped() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": "  new_name  "},
    )

    assert resp.status_code == 200
    assert target.username == "new_name"
    assert fake_db.committed


@pytest.mark.asyncio
async def test_updating_to_own_username_does_not_report_duplicate() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": "editor_a"},
    )

    assert resp.status_code == 200
    assert target.username == "editor_a"
    assert fake_db.committed
    assert fake_db.statements == []


@pytest.mark.parametrize("role", ["editor", "super_admin"])
@pytest.mark.asyncio
async def test_super_admin_can_change_role(role: str) -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a", role=UserRole.EDITOR)
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"role": role},
    )

    assert resp.status_code == 200
    assert target.role.value == role
    assert fake_db.committed


@pytest.mark.asyncio
async def test_disabled_user_can_be_updated() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(
        2,
        username="disabled_editor",
        status=UserStatus.DISABLED,
    )
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"displayName": "禁用用户新名"},
    )

    assert resp.status_code == 200
    assert target.display_name == "禁用用户新名"
    assert fake_db.committed


@pytest.mark.asyncio
async def test_missing_target_user_returns_400_without_commit() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    fake_db = _UpdateUserFakeDb([admin])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        999,
        {"displayName": "不存在"},
    )

    assert resp.status_code == 400
    assert resp.json() == {"code": 400, "message": "用户不存在", "data": None}
    assert not fake_db.committed
    assert not fake_db.rolled_back


@pytest.mark.asyncio
async def test_username_taken_by_other_user_returns_400_without_commit() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a", display_name="旧名")
    other = make_user(3, username="taken_name")
    fake_db = _UpdateUserFakeDb([admin, target, other])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": "taken_name", "displayName": "不应生效"},
    )

    assert resp.status_code == 400
    assert resp.json() == {"code": 400, "message": "用户名已存在", "data": None}
    assert target.username == "editor_a"
    assert target.display_name == "旧名"
    assert not fake_db.committed
    assert not fake_db.rolled_back


@pytest.mark.asyncio
async def test_commit_duplicate_key_error_rolls_back_and_returns_400() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    fake_db = _UpdateUserFakeDb(
        [admin, target],
        commit_error=IntegrityError(
            "UPDATE users SET username=:username WHERE users.id = :id",
            {"username": "race_user", "id": 2},
            Exception(1062, "Duplicate entry 'race_user' for key 'username'"),
        ),
    )

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": "race_user"},
    )

    assert resp.status_code == 400
    assert resp.json() == {"code": 400, "message": "用户名已存在", "data": None}
    assert fake_db.rolled_back


@pytest.mark.asyncio
async def test_non_duplicate_integrity_error_is_re_raised_after_rollback() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    non_duplicate_error = IntegrityError(
        "UPDATE users SET position=:position WHERE users.id = :id",
        {"position": "x" * 100, "id": 2},
        Exception(1406, "Data too long for column 'position'"),
    )
    fake_db = _UpdateUserFakeDb(
        [admin, target],
        commit_error=non_duplicate_error,
    )
    payload = UpdateUserRequest.model_construct(position="x" * 100)

    with pytest.raises(IntegrityError) as exc_info:
        await update_user_service(fake_db, admin, 2, payload)  # type: ignore[arg-type]

    assert exc_info.value is non_duplicate_error
    assert fake_db.rolled_back


@pytest.mark.asyncio
async def test_editor_cannot_update_user_returns_403() -> None:
    editor = make_user(1, username="editor")
    target = make_user(2, username="target")
    fake_db = _UpdateUserFakeDb([editor, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"displayName": "越权修改"},
    )

    assert resp.status_code == 403
    assert resp.json() == {"code": 403, "message": "权限不足", "data": None}
    assert target.display_name == "成员"
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_no_token_cannot_update_user_returns_401() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="target")
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(None, fake_db, 2, {"displayName": "匿名"})

    assert resp.status_code == 401
    assert target.display_name == "成员"
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_invalid_role_returns_400() -> None:
    fake_db = _UpdateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"role": "viewer"},
    )

    assert resp.status_code == 400
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_short_password_returns_400_and_keeps_hash() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="target")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"password": "12345"},
    )

    assert resp.status_code == 400
    assert target.password_hash == "original-hash"
    assert not fake_db.committed


@pytest.mark.parametrize(
    "password",
    ["a" * 73, "密" * 25],
)
@pytest.mark.asyncio
async def test_overlong_password_returns_400_and_keeps_hash(
    password: str,
) -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="target")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"password": password},
    )

    assert resp.status_code == 400
    assert target.password_hash == "original-hash"
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_empty_string_password_is_accepted() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="target")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"password": ""},
    )

    assert resp.status_code == 200
    assert target.password_hash == "original-hash"
    assert fake_db.committed


@pytest.mark.parametrize("username", ["", "   "])
@pytest.mark.asyncio
async def test_username_empty_after_strip_returns_400(username: str) -> None:
    fake_db = _UpdateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        2,
        {"username": username},
    )

    assert resp.status_code == 400
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_non_integer_path_id_returns_400() -> None:
    fake_db = _UpdateUserFakeDb([make_user(1, role=UserRole.SUPER_ADMIN)])

    resp = await update_user_via_api(
        make_token(sub="1"),
        fake_db,
        "abc",
        {"displayName": "无效 id"},
    )

    assert resp.status_code == 400
    assert not fake_db.committed


def test_update_user_openapi_contract() -> None:
    document = app.openapi()
    operation = document["paths"]["/api/v1/admin/users/{id}"]["put"]

    assert operation["summary"] == "修改用户"
    assert "200" in operation["responses"]
    assert "201" not in operation["responses"]
    response_ref = operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]["$ref"]
    response_schema_name = response_ref.rsplit("/", 1)[-1]
    response_properties = document["components"]["schemas"][response_schema_name][
        "properties"
    ]
    assert set(response_properties) == {"code", "message", "data"}
    assert {"password", "passwordHash", "password_hash"} & set(
        response_properties
    ) == set()

    request_ref = operation["requestBody"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    request_schema_name = request_ref.rsplit("/", 1)[-1]
    request_properties = document["components"]["schemas"][request_schema_name][
        "properties"
    ]
    assert "displayName" in request_properties
    assert "display_name" not in request_properties
    assert {"passwordHash", "password_hash", "password_hash"} & set(
        request_properties
    ) == set()
    assert set(request_properties) <= {
        "username",
        "displayName",
        "password",
        "role",
        "position",
        "desc",
        "avatar",
    }


@pytest.mark.asyncio
async def test_update_user_service_queries_only_user_id_by_username() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="editor_a")
    fake_db = _UpdateUserFakeDb([admin, target])
    payload = UpdateUserRequest(username="brand_new_name")

    await update_user_service(fake_db, admin, 2, payload)  # type: ignore[arg-type]

    assert len(fake_db.statements) == 1
    sql = " ".join(
        str(fake_db.statements[0].compile(dialect=mysql.dialect())).split()
    )
    assert "SELECT users.id FROM users" in sql
    assert "WHERE users.username" in sql
    assert "users.id != %s" in sql
    assert "users.password_hash" not in sql


@pytest.mark.asyncio
async def test_update_user_service_rejects_overlong_password_with_422() -> None:
    admin = make_user(1, role=UserRole.SUPER_ADMIN, username="admin")
    target = make_user(2, username="target")
    target.password_hash = "original-hash"
    fake_db = _UpdateUserFakeDb([admin, target])
    payload = UpdateUserRequest.model_construct(password="a" * 73)

    with pytest.raises(HTTPException) as exc_info:
        await update_user_service(fake_db, admin, 2, payload)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 422
    assert "72 字节" in exc_info.value.detail
    assert target.password_hash == "original-hash"
    assert not fake_db.committed


@pytest.mark.asyncio
async def test_update_user_route_end_to_end_with_mysql() -> None:
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
    admin_username = f"e2e_update_admin_{uuid4().hex[:8]}"
    target_username = f"e2e_update_target_{uuid4().hex[:8]}"
    cleanup_usernames = [admin_username, target_username]
    probe_ok = False
    try:
        async with test_session_maker() as probe:
            try:
                await probe.execute(text("SELECT 1"))
            except Exception as exc:
                pytest.skip(f"MySQL 不可用，跳过修改用户端到端测试：{exc!r}")
        probe_ok = True

        async with test_session_maker() as session:
            admin = User(
                username=admin_username,
                password_hash="unused",
                display_name="更新管理员",
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE,
            )
            target = User(
                username=target_username,
                password_hash="old-hash",
                display_name="旧名字",
                role=UserRole.EDITOR,
                status=UserStatus.ACTIVE,
                position="旧职位",
                desc="旧简介",
                avatar="/uploads/avatars/old.png",
            )
            session.add_all([admin, target])
            await session.flush()
            token = make_token(
                sub=str(admin.id),
                jti=f"e2e-update-{uuid4().hex[:8]}",
            )
            password = "newpass123"

            async def override_get_db() -> Any:
                yield session

            app.dependency_overrides[get_db] = override_get_db
            try:
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    resp = await client.put(
                        f"/api/v1/admin/users/{target.id}",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "displayName": "新名字",
                            "role": "super_admin",
                            "position": "主席团",
                            "desc": "e2e 更新",
                            "avatar": "/uploads/avatars/new.png",
                            "password": password,
                        },
                    )
            finally:
                app.dependency_overrides.pop(get_db, None)

            assert resp.status_code == 200
            assert resp.json() == {
                "code": 200,
                "message": "修改成功",
                "data": None,
            }
            await session.refresh(target)
            assert target.display_name == "新名字"
            assert target.role == UserRole.SUPER_ADMIN
            assert target.position == "主席团"
            assert target.desc == "e2e 更新"
            assert target.avatar == "/uploads/avatars/new.png"
            assert target.password_hash != password
            assert bcrypt.checkpw(
                password.encode("utf-8"),
                target.password_hash.encode("utf-8"),
            )
    finally:
        if probe_ok:
            async with test_session_maker() as cleanup_session:
                await cleanup_session.execute(
                    delete(User).where(User.username.in_(cleanup_usernames))
                )
                await cleanup_session.commit()
        await test_engine.dispose()
