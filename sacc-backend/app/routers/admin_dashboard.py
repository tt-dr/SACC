from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession, not_implemented
from app.models.audit_log import AuditLog
from app.schemas import Result
from app.schemas.content import AuditLogItem, AuditLogResponse, DashboardResponse


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
    # TODO: 聚合访问量、活跃成员数、各模块内容总数及草稿数。
    _ = current_user, db
    not_implemented("聚合并缓存仪表盘统计数据")


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
    rows = (
        await db.execute(
            select(AuditLog)
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(limit)
        )
    ).scalars().all()
    data = AuditLogResponse(
        [
            AuditLogItem(
                id=row.id,
                module=row.module,
                action=row.action.value,
                actor=row.actor,
                detail=row.detail,
                timestamp=row.created_at,
            )
            for row in rows
        ]
    )
    return Result(code=200, message="获取成功", data=data)
