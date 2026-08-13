import pytest
from sqlalchemy.dialects import mysql

from app.services.dashboard import record_site_visit


class RecordingSession:
    def __init__(self) -> None:
        self.statement = None
        self.committed = False

    async def execute(self, statement) -> None:
        self.statement = statement

    async def commit(self) -> None:
        self.committed = True


@pytest.mark.asyncio
async def test_record_site_visit_uses_atomic_upsert() -> None:
    session = RecordingSession()
    await record_site_visit(session)
    sql = str(
        session.statement.compile(
            dialect=mysql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )
    assert "ON DUPLICATE KEY UPDATE" in sql
    assert session.committed
