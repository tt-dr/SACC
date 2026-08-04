from fastapi import APIRouter

from app.dependencies import DbSession, SuperAdmin, not_implemented
from app.schemas import EmptyResult, Result
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserListResponse


router = APIRouter(prefix="/api/v1/admin/users", tags=["管理接口 - 用户"])


@router.get("", response_model=Result[UserListResponse], summary="用户列表")
async def list_users(admin: SuperAdmin, db: DbSession) -> Result[UserListResponse]:
    # TODO: 返回正常及已禁用用户，响应中不得包含 password_hash。
    _ = admin, db
    not_implemented("查询全部后台用户")


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
    # TODO: 校验 username 唯一性，使用 bcrypt 加密密码，持久化并记录创建操作。
    _ = payload, admin, db
    not_implemented("创建后台用户")


@router.put("/{id}", response_model=EmptyResult, summary="修改用户")
async def update_user(
    id: int,
    payload: UpdateUserRequest,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    # TODO: 更新请求中提供的字段，对非空密码进行哈希，并记录更新操作。
    _ = id, payload, admin, db
    not_implemented("更新后台用户")


@router.delete("/{id}", response_model=EmptyResult, summary="禁用/删除用户")
async def disable_user(
    id: int,
    admin: SuperAdmin,
    db: DbSession,
) -> EmptyResult:
    # TODO: 禁止用户禁用自身；设置 status=disabled，撤销令牌并记录审计日志。
    _ = id, admin, db
    not_implemented("软删除后台用户")
