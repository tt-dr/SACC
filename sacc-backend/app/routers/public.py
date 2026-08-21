from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import DbSession, not_implemented
from app.models.content import Content, ContentStatus as ModelContentStatus
from app.schemas import Result
from app.schemas.content import (
    BootstrapData,
    ContentItemResponse,
    ContentListResponse,
    ContentModule,
    MemberListResponse,
)
from app.services.content import list_published_content
from app.services.user import list_public_members as fetch_public_members


router = APIRouter(tags=["公开接口"])


@router.get(
    "/api/v1/content",
    response_model=Result[ContentListResponse],
    summary="公开内容列表",
)
async def list_public_content(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    module: ContentModule | None = None,
    status: Annotated[Literal["published"], Query()] = "published",
    keyword: str | None = None,
) -> Result[ContentListResponse]:
    data = await list_published_content(
        db,
        page=page,
        page_size=page_size,
        module=module,
        keyword=keyword,
    )
    return Result(code=200, message="获取成功", data=data)


@router.get(
    "/api/v1/content/{id}",
    response_model=Result[ContentItemResponse],
    summary="获取单条内容详情",
)
async def get_public_content(id: int, db: DbSession) -> Result[ContentItemResponse]:
    content = await db.get(Content, id)
    if content is None or content.status != ModelContentStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="内容不存在或未发布",
        )
    data = ContentItemResponse.model_validate(content)
    return Result(code=200, message="获取成功", data=data)


@router.get(
    "/api/v1/public/members",
    response_model=Result[MemberListResponse],
    summary="获取成员列表",
)
async def list_public_members(db: DbSession) -> Result[MemberListResponse]:
    data = await fetch_public_members(db)
    return Result(code=200, message="获取成员列表成功", data=data)


@router.get(
    "/api/v1/public/bootstrap",
    response_model=Result[BootstrapData],
    summary="获取站点完整配置（前端唯一数据入口）",
)
async def get_bootstrap(db: DbSession) -> Result[BootstrapData]:
    # TODO: 组装与 fallbackSiteContent 兼容的数据，并缓存 5 分钟。
    _ = db
    not_implemented("组装并缓存完整的站点启动数据")
