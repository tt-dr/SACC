"""
审计日志数据模型 —— 对齐 SACC api-doc.json 中 AuditLogItem schema。

API 字段             SACC 数据库字段 (model.AuditLog)
─────────────────    ─────────────────────────────────
id                    ID
module                Resource        ← 需做映射
action                Action
actor                 ActorName       ← 需做映射
detail                Detail
timestamp             CreatedAt       ← 需做映射
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AuditAction(str, Enum):
    """操作类型枚举，对应 api-doc.json 中 action 字段的 enum 约束。"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class AuditLogItem(BaseModel):
    """单条审计日志记录。"""

    id: int = Field(..., description="日志 ID")
    module: str = Field(
        ..., description="操作模块，例如 news / docs / projects / users / about"
    )
    action: AuditAction = Field(..., description="操作类型：create / update / delete")
    actor: str = Field(..., description="操作人姓名")
    detail: str = Field(..., description="操作详情描述")
    timestamp: datetime = Field(..., description="操作时间（ISO 8601）")
