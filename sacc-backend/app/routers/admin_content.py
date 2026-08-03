from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile, status

from app.dependencies import CurrentUser, DbSession, not_implemented
from app.schemas import MessageResponse
from app.schemas.content import (
    ContentItemResponse,
    ContentListResponse,
    ContentModule,
    ContentStatus,
    ReorderRequest,
    UpsertContentRequest,
    UploadResponse,
)


router = APIRouter(prefix="/api/v1/admin", tags=["管理接口 - 内容"])


@router.get(
    "/content",
    response_model=ContentListResponse,
    summary="管理端内容列表",
)
async def list_admin_content(
    current_user: CurrentUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    module: ContentModule | None = None,
    status_filter: Annotated[ContentStatus | None, Query(alias="status")] = None,
    keyword: str | None = None,
) -> ContentListResponse:
    # TODO: 分页检索所有状态的内容，并校验 editor 可管理的模块范围。
    _ = current_user, db, page, page_size, module, status_filter, keyword
    not_implemented("查询管理端内容列表")


@router.post(
    "/content",
    response_model=ContentItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建内容",
)
async def create_content(
    payload: UpsertContentRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ContentItemResponse:
    # TODO: 生成唯一 slug，持久化内容，记录审计日志并使 bootstrap 缓存失效。
    _ = payload, current_user, db
    not_implemented("创建内容并写入审计日志")


@router.put(
    "/content/reorder",
    response_model=MessageResponse,
    summary="调整内容排序",
)
async def reorder_content(
    payload: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    # TODO: 根据 orderedIds 的索引，原子更新 docs/projects 内容的 sortOrder。
    _ = payload, current_user, db
    not_implemented("调整内容排序、记录审计日志并使 bootstrap 缓存失效")


@router.put(
    "/content/{id}",
    response_model=ContentItemResponse,
    summary="更新内容",
)
async def update_content(
    id: int,
    payload: UpsertContentRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ContentItemResponse:
    # TODO: 应用允许的字段变更，记录审计日志并使 bootstrap 缓存失效。
    _ = id, payload, current_user, db
    not_implemented("更新内容并写入审计日志")


@router.delete(
    "/content/{id}",
    response_model=MessageResponse,
    summary="删除内容",
)
async def delete_content(
    id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    # TODO: 将状态设为 archived 以软删除内容，记录审计日志并使 bootstrap 缓存失效。
    _ = id, current_user, db
    not_implemented("归档内容并写入审计日志")


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="上传图片",
    tags=["管理接口 - 文件"],
)
async def upload_image(
    current_user: CurrentUser,
    file: Annotated[UploadFile, File(description="jpg/png/gif/webp, max 10MB")],
) -> UploadResponse:
    # TODO: 校验 MIME 类型、文件签名和大小，生成随机文件名后安全保存。
    _ = current_user, file
    not_implemented("校验并保存上传的图片")
