from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditAction, AuditLog


async def write_audit_log(
    db: AsyncSession,
    *,
    actor: str,
    module: str,
    action: AuditAction,
    detail: str,
) -> None:
    db.add(
        AuditLog(
            actor=actor,
            module=module,
            action=action,
            detail=detail[:255],
        )
    )
