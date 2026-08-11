"""
审计日志服务层。

负责从数据源获取审计日志。
当前为「内存实现」版本，用于前期联调；
后续接入真实数据库时，只需替换本模块的内部实现，对外接口不变。
"""

from datetime import datetime, timedelta, timezone

from app.config import AUDIT_LOG_DEFAULT_LIMIT, AUDIT_LOG_MAX_LIMIT
from app.models.audit_log import AuditLogItem

# ============================================================
# TODO: 替换为真实数据源（数据库 / 外部服务）
# ============================================================
_MOCK_LOGS: list[AuditLogItem] = [
    AuditLogItem(
        id=1,
        module="news",
        action="create",
        actor="林嘉禾",
        detail="发布博客「性能优化实录」",
        timestamp=datetime(2026, 4, 6, 20, 10, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=2,
        module="users",
        action="update",
        actor="张三",
        detail="修改用户「李四」角色",
        timestamp=datetime(2026, 4, 6, 19, 30, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=3,
        module="docs",
        action="delete",
        actor="王小明",
        detail="删除文档「旧版 API 说明」",
        timestamp=datetime(2026, 4, 6, 18, 45, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=4,
        module="projects",
        action="create",
        actor="陈丽丽",
        detail="创建项目「2026 年度规划」",
        timestamp=datetime(2026, 4, 6, 17, 20, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=5,
        module="news",
        action="update",
        actor="林嘉禾",
        detail="编辑博客「团队建设经验」",
        timestamp=datetime(2026, 4, 6, 16, 0, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=6,
        module="about",
        action="update",
        actor="张三",
        detail="修改「关于我们」页面内容",
        timestamp=datetime(2026, 4, 6, 15, 10, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=7,
        module="users",
        action="create",
        actor="管理员",
        detail="创建用户「赵六」",
        timestamp=datetime(2026, 4, 6, 14, 30, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=8,
        module="docs",
        action="create",
        actor="陈丽丽",
        detail="上传文档「新人入职指南」",
        timestamp=datetime(2026, 4, 6, 13, 0, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=9,
        module="projects",
        action="delete",
        actor="王小明",
        detail="归档项目「Q1 复盘」",
        timestamp=datetime(2026, 4, 6, 12, 15, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=10,
        module="news",
        action="delete",
        actor="林嘉禾",
        detail="删除博客「旧版公告」",
        timestamp=datetime(2026, 4, 6, 11, 0, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=11,
        module="users",
        action="update",
        actor="管理员",
        detail="重置用户「张三」密码",
        timestamp=datetime(2026, 4, 6, 10, 30, 0, tzinfo=timezone.utc),
    ),
    AuditLogItem(
        id=12,
        module="about",
        action="create",
        actor="陈丽丽",
        detail="新增「联系我们」入口",
        timestamp=datetime(2026, 4, 6, 9, 0, 0, tzinfo=timezone.utc),
    ),
]


def get_audit_logs(limit: int = AUDIT_LOG_DEFAULT_LIMIT) -> list[AuditLogItem]:
    """
    获取最近的审计日志，按时间倒序排列。

    Args:
        limit: 返回条数，默认 12，上限 50。

    Returns:
        已按 timestamp 降序排列的 AuditLogItem 列表。
    """
    # 按时间倒序
    sorted_logs = sorted(_MOCK_LOGS, key=lambda x: x.timestamp, reverse=True)

    # TODO: 替换为真实数据源查询，例如：
    #   rows = await db.query(
    #       "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", limit
    #   )
    #   return [AuditLogItem.model_validate(row) for row in rows]

    return sorted_logs[:limit]
