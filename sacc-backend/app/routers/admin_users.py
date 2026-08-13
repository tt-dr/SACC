from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import DbSession, SuperAdmin
from app.models.user import User
from app.schemas import EmptyResult, Result
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserRequest,
    UserItem,
    UserListResponse,
)
from app.services import user as user_service


router = APIRouter(prefix="/api/v1/admin/users", tags=["管理接口 - 用户"])


@router.get("", response_model=Result[UserListResponse], summary="用户列表")
async def list_users(admin: SuperAdmin, db: DbSession) -> Result[UserListResponse]:
    _ = admin
    users = (await db.scalars(select(User).order_by(User.id))).all()
    data = UserListResponse(
        [
            UserItem(
                id=user.id,
                username=user.username,
                display_name=user.display_name,
                avatar=user.avatar,
                role=user.role.value,
                position=user.position,
                desc=user.desc,
                status=user.status.value,
                created_at=user.created_at,
            )
            for user in users
        ]
    )
    return Result(code=0, message="ok", data=data)


@router.post(
    "",
    response_model=EmptyResult,
    summary="创建用户",
)
async def create_user(
    payload: CreateUserRequest,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    try:
        await user_service.create_user(db, admin, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return EmptyResult(code=0, message="用户创建成功", data=None)


@router.put("/{id}", response_model=EmptyResult, summary="修改用户")
async def update_user(
    id: int,
    payload: UpdateUserRequest,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    try:
        await user_service.update_user(db, admin, id, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return EmptyResult(code=0, message="用户更新成功", data=None)


@router.delete("/{id}", response_model=EmptyResult, summary="禁用/删除用户")
async def disable_user(
    id: int,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    try:
        await user_service.disable_user(db, admin, id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    return EmptyResult(code=0, message="用户已禁用", data=None)
