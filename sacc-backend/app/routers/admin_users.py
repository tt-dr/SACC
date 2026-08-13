from fastapi import APIRouter

from app.dependencies import DbSession, SuperAdmin, not_implemented
from app.schemas import EmptyResult, Result
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserListResponse
from app.services.user import create_user as create_admin_user
from app.services.user import list_admin_users
from app.services.user import update_user as update_admin_user


router = APIRouter(prefix="/api/v1/admin/users", tags=["管理接口 - 用户"])


@router.get("", response_model=Result[UserListResponse], summary="用户列表")
async def list_users(admin: SuperAdmin, db: DbSession) -> Result[UserListResponse]:
    data = await list_admin_users(db)
    return Result(code=200, message="获取用户列表成功", data=data)


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
    await create_admin_user(db, admin, payload)
    return EmptyResult(
        code=200,
        message="创建成功",
        data=None,
    )


@router.put("/{id}", response_model=EmptyResult, summary="修改用户")
async def update_user(
    id: int,
    payload: UpdateUserRequest,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    await update_admin_user(db, admin, id, payload)
    return EmptyResult(
        code=200,
        message="修改成功",
        data=None,
    )


@router.delete("/{id}", response_model=EmptyResult, summary="禁用/删除用户")
async def disable_user(
    id: int,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    # TODO: 禁止用户禁用自身；设置 status=disabled，撤销令牌并记录审计日志。
    _ = id, admin, db
    not_implemented("软删除后台用户")
