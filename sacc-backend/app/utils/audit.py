from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditAction


async def write_audit_log(
    db: AsyncSession,
    *,
    actor: str,
    module: str,
    action: AuditAction,
    detail: str,
) -> None:
    # TODO: 将审计记录加入调用方事务，不要在此处独立提交。
    _ = db, actor, module, action, detail
    raise NotImplementedError
