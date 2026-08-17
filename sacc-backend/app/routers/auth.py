from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DbSession
from app.schemas import EmptyResult, Result
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
)
from app.services.auth import authenticate_user, change_user_password
from app.utils.security import create_access_token


router = APIRouter()


@router.post(
    "/api/v1/auth/login",
    response_model=Result[LoginResponse],
    summary="管理员登录",
    tags=["认证"],
)
async def login(payload: LoginRequest, db: DbSession) -> Result[LoginResponse]:
    user = await authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    data = LoginResponse(
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
        position=user.position,
        desc=user.desc,
        avatar=user.avatar,
        token=create_access_token(str(user.id), {"role": user.role.value}),
    )
    return Result(code=200, message="登录成功", data=data)


@router.get(
    "/api/v1/admin/me",
    response_model=Result[MeResponse],
    summary="获取当前登录用户信息",
    tags=["管理接口 - 认证"],
)
async def get_me(current_user: CurrentUser) -> Result[MeResponse]:
    data = MeResponse(
        user_id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        role=current_user.role,
        position=current_user.position,
        desc=current_user.desc,
        avatar=current_user.avatar,
    )
    return Result(code=200, message="获取成功", data=data)


@router.put(
    "/api/v1/admin/password",
    response_model=EmptyResult,
    summary="修改当前用户密码",
    tags=["管理接口 - 认证"],
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> EmptyResult:
    try:
        await change_user_password(
            db, current_user, payload.old_password, payload.new_password
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return EmptyResult(code=200, message="密码修改成功", data=None)
