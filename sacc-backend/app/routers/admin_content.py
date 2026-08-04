from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile, status
from sqlalchemy import func, or_, select

from app.dependencies import CurrentUser, DbSession
from app.models.content import Content
from app.schemas import EmptyResult, Result
from app.schemas.content import (
    ContentItemResponse,
    ContentItemSummary,
    ContentListResponse,
    ContentModule,
    ContentStatus,
    Pagination,
    ReorderRequest,
    UpsertContentRequest,
    UploadResponse,
)
from app.services import content as content_service
from app.services.storage import upload_image as upload_image_to_oss


router = APIRouter(prefix="/api/v1/admin", tags=["管理接口 - 内容"])


@router.get(
    "/content",
    response_model=Result[ContentListResponse],
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
) -> Result[ContentListResponse]:
    _ = current_user
    filters = []
    if module is not None:
        filters.append(Content.module == module.value)
    if status_filter is not None:
        filters.append(Content.status == status_filter.value)
    if keyword and keyword.strip():
        pattern = f"%{keyword.strip()}%"
        filters.append(
            or_(
                Content.title.like(pattern),
                Content.summary.like(pattern),
                Content.author.like(pattern),
                Content.slug.like(pattern),
            )
        )

    total = int(await db.scalar(select(func.count(Content.id)).where(*filters)) or 0)
    rows = (
        await db.execute(
            select(Content)
            .where(*filters)
            .order_by(Content.sort_order.asc(), Content.created_at.desc(), Content.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    data = ContentListResponse(
        data=[ContentItemSummary.model_validate(row) for row in rows],
        pagination=Pagination(page=page, page_size=page_size, total=total),
    )
    return Result(code=200, message="获取成功", data=data)


@router.post(
    "/content",
    response_model=Result[ContentItemResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建内容",
)
async def create_content(
    payload: UpsertContentRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> Result[ContentItemResponse]:
    content = await content_service.create_content(db, current_user, payload)
    return Result(
        code=201,
        message="创建成功",
        data=ContentItemResponse.model_validate(content),
    )


@router.put(
    "/content/reorder",
    response_model=EmptyResult,
    summary="调整内容排序",
)
async def reorder_content(
    payload: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> EmptyResult:
    await content_service.reorder_content(db, current_user, payload)
    return EmptyResult(code=200, message="排序更新成功", data=None)


@router.put(
    "/content/{id}",
    response_model=Result[ContentItemResponse],
    summary="更新内容",
)
async def update_content(
    id: int,
    payload: UpsertContentRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> Result[ContentItemResponse]:
    content = await content_service.update_content(db, current_user, id, payload)
    return Result(
        code=200,
        message="更新成功",
        data=ContentItemResponse.model_validate(content),
    )


@router.delete(
    "/content/{id}",
    response_model=EmptyResult,
    summary="删除内容",
)
async def delete_content(
    id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> EmptyResult:
    await content_service.delete_content(db, current_user, id)
    return EmptyResult(code=200, message="删除成功", data=None)


@router.post(
    "/upload",
    response_model=Result[UploadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="上传图片",
    tags=["管理接口 - 文件"],
)
async def upload_image(
    current_user: CurrentUser,
    file: Annotated[UploadFile, File(description="jpg/png/gif/webp, max 10MB")],
) -> Result[UploadResponse]:
    _ = current_user
    uploaded = await upload_image_to_oss(file)
    return Result(code=201, message="上传成功", data=uploaded)
