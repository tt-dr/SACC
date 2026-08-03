from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.content import ReorderRequest, UpsertContentRequest


async def create_content(
    db: AsyncSession,
    actor: User,
    payload: UpsertContentRequest,
) -> None:
    # TODO: 生成唯一 slug，持久化内容，记录审计日志并清除 Redis 缓存。
    _ = db, actor, payload
    raise NotImplementedError


async def update_content(
    db: AsyncSession,
    actor: User,
    content_id: int,
    payload: UpsertContentRequest,
) -> None:
    # TODO: 校验模块操作权限并更新指定内容记录。
    _ = db, actor, content_id, payload
    raise NotImplementedError


async def reorder_content(
    db: AsyncSession,
    actor: User,
    payload: ReorderRequest,
) -> None:
    # TODO: 在同一事务中更新全部 sort_order，并写入一条审计日志。
    _ = db, actor, payload
    raise NotImplementedError
