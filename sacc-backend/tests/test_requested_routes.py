from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.models.user import UserRole, UserStatus
from app.routers import auth, health
from app.schemas.auth import LoginRequest
from app.services import user as user_service


@pytest.mark.asyncio
async def test_readyz_returns_503_when_dependency_is_down(monkeypatch) -> None:
    monkeypatch.setattr(health, "check_mysql", AsyncMock(return_value=False))
    monkeypatch.setattr(health, "check_redis", AsyncMock(return_value=True))
    response = await health.readyz()
    assert response.status_code == 503
    assert b'"status":"degraded"' in response.body
    assert b'"mysql":"down"' in response.body


@pytest.mark.asyncio
async def test_login_returns_contract_user_and_token(monkeypatch) -> None:
    user = SimpleNamespace(
        id=7,
        username="admin",
        display_name="Admin",
        role=UserRole.SUPER_ADMIN,
        position="主席",
        desc="站点管理员",
        avatar=None,
    )
    monkeypatch.setattr(auth, "authenticate_user", AsyncMock(return_value=user))
    monkeypatch.setattr(auth, "create_access_token", lambda *args: "jwt-token")
    response = await auth.login(LoginRequest(username="admin", password="secret"), AsyncMock())
    assert response.code == 0
    assert response.data.token == "jwt-token"
    assert response.data.user_id == 7
    assert response.data.role.value == "super_admin"


@pytest.mark.asyncio
async def test_disable_user_is_soft_delete_and_audited(monkeypatch) -> None:
    actor = SimpleNamespace(id=1, username="root")
    target = SimpleNamespace(id=2, username="editor", status=UserStatus.ACTIVE)
    db = SimpleNamespace(get=AsyncMock(return_value=target), commit=AsyncMock())
    audit = AsyncMock()
    monkeypatch.setattr(user_service, "write_audit_log", audit)
    result = await user_service.disable_user(db, actor, 2)
    assert result is target
    assert target.status == UserStatus.DISABLED
    db.commit.assert_awaited_once()
    audit.assert_awaited_once()


@pytest.mark.asyncio
async def test_disable_user_cannot_disable_self() -> None:
    actor = SimpleNamespace(id=1, username="root")
    db = SimpleNamespace(get=AsyncMock(return_value=actor), commit=AsyncMock())
    with pytest.raises(PermissionError, match="当前登录用户"):
        await user_service.disable_user(db, actor, 1)
    db.commit.assert_not_awaited()
