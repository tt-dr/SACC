from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies import DbSession, not_implemented
from app.schemas.content import (
    BootstrapData,
    ContentItemResponse,
    ContentListResponse,
    ContentModule,
    MemberListResponse,
)


router = APIRouter(tags=["公开接口"])


@router.get(
    "/api/v1/content",
    response_model=ContentListResponse,
    summary="公开内容列表",
)
async def list_public_content(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    module: ContentModule | None = None,
    status_filter: Annotated[str, Query(alias="status")] = "published",
    keyword: str | None = None,
) -> ContentListResponse:
    # TODO: 分页检索已发布内容，并确保列表项不返回 body。
    _ = db, page, page_size, module, status_filter, keyword
    not_implemented("查询公开的已发布内容列表")


@router.get(
    "/api/v1/content/{id}",
    response_model=ContentItemResponse,
    summary="获取单条内容详情",
)
async def get_public_content(id: int, db: DbSession) -> ContentItemResponse:
    # TODO: 仅当内容已发布时返回包含完整 body 的详情。
    _ = id, db
    not_implemented("查询单条已发布内容")


@router.get(
    "/api/v1/public/members",
    response_model=MemberListResponse,
    summary="获取成员列表",
)
async def list_members(db: DbSession) -> MemberListResponse:
    # TODO: 按前端约定的稳定顺序对正常成员分组并返回。
    _ = db
    not_implemented("查询公开成员资料并分组")


@router.get(
    "/api/v1/public/bootstrap",
    response_model=BootstrapData,
    summary="获取站点完整配置（前端唯一数据入口）",
)
async def get_bootstrap(db: DbSession) -> BootstrapData:
    # TODO: 组装与 fallbackSiteContent 兼容的数据，并缓存 5 分钟。
    _ = db
    not_implemented("组装并缓存完整的站点启动数据")
