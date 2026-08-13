from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies import CurrentUser, DbSession, not_implemented
from app.schemas import Result
from app.schemas.content import AuditLogResponse, DashboardResponse
from app.services.cache import get_or_set_model
from app.services.dashboard import get_dashboard_stats


router = APIRouter(prefix="/api/v1/admin", tags=["管理接口 - 仪表盘"])


@router.get(
    "/dashboard",
    response_model=Result[DashboardResponse],
    summary="获取仪表盘统计数据",
)
async def get_dashboard(
    current_user: CurrentUser,
    db: DbSession,
) -> Result[DashboardResponse]:
    _ = current_user
    data = await get_or_set_model(
        key="admin:dashboard",
        ttl_seconds=60,
        model_type=DashboardResponse,
        loader=lambda: get_dashboard_stats(db),
    )
    return Result(code=0, message="ok", data=data)


@router.get(
    "/audit-log",
    response_model=Result[AuditLogResponse],
    summary="获取操作审计日志",
    tags=["管理接口 - 审计日志"],
)
async def list_audit_log(
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 12,
) -> Result[AuditLogResponse]:
    # TODO: 按操作时间倒序返回最近的审计日志。
    _ = current_user, db, limit
    not_implemented("查询最近的审计日志")
