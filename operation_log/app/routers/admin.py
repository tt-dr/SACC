"""
管理端路由 —— 对齐 SACC 项目 internal/router/router.go 中的 admin 路由组。

所有接口均通过 get_current_user 依赖进行 JWT 认证校验，
401 响应格式与 Go 中间件 middleware.Auth 一致。
"""

from fastapi import APIRouter, Depends, Query

from app.config import AUDIT_LOG_DEFAULT_LIMIT, AUDIT_LOG_MAX_LIMIT
from app.dependencies import CurrentUser, get_current_user
from app.services.audit_log import get_audit_logs

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get(
    "/audit-log",
    summary="获取操作审计日志",
    description=(
        "返回最近的操作日志列表，按时间倒序排列。"
        "记录所有管理端的增/删/改操作，包含操作人、模块、动作和详情。"
        "主要用于管理端仪表盘展示和问题追溯。"
    ),
)
async def get_audit_log(
    limit: int = Query(
        default=AUDIT_LOG_DEFAULT_LIMIT,
        ge=1,
        description="返回条数，默认 12，最大 50",
    ),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    GET /api/v1/admin/audit-log

    对应 SACC api-doc.json 中 AuditLogResponse schema：
      {"data": [AuditLogItem, ...]}

    limit 参数处理：
      - 未传 → 默认 12
      - > 50  → 自动截断为 50
      - < 1   → Pydantic ge=1 拦截，返回 422（与其他 handler 行为一致）
    """
    effective_limit = min(limit, AUDIT_LOG_MAX_LIMIT)
    logs = get_audit_logs(limit=effective_limit)

    # 响应格式与 Go handler 一致：{"data": [...]}
    # mode="json" 确保枚举 → 字符串、datetime → ISO 8601
    return {"data": [log.model_dump(mode="json") for log in logs]}
