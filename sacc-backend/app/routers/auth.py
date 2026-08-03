from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DbSession, not_implemented
from app.schemas import MessageResponse
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
)


router = APIRouter()


@router.post(
    "/api/v1/auth/login",
    response_model=LoginResponse,
    summary="管理员登录",
    tags=["认证"],
)
async def login(payload: LoginRequest, db: DbSession) -> LoginResponse:
    # TODO: 校验正常用户的 bcrypt 密码哈希，并签发有效期 12 小时的 JWT。
    _ = payload, db
    not_implemented("认证管理员并签发 JWT")


@router.get(
    "/api/v1/admin/me",
    response_model=MeResponse,
    summary="获取当前登录用户信息",
    tags=["管理接口 - 认证"],
)
async def get_me(current_user: CurrentUser) -> MeResponse:
    # TODO: 序列化当前登录用户，响应中不得包含 password_hash。
    _ = current_user
    not_implemented("返回当前登录用户信息")


@router.put(
    "/api/v1/admin/password",
    response_model=MessageResponse,
    summary="修改当前用户密码",
    tags=["管理接口 - 认证"],
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    # TODO: 校验 oldPassword，使用 bcrypt 加密 newPassword，提交后将旧 JWT 加入黑名单。
    _ = payload, current_user, db
    not_implemented("修改密码并撤销当前令牌")
