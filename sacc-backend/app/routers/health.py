from datetime import datetime, timezone

from fastapi import APIRouter

from app.dependencies import not_implemented
from app.schemas import APIModel, Result


class DependencyChecks(APIModel):
    mysql: str
    redis: str


class HealthResponse(APIModel):
    status: str
    time: datetime


class ReadyResponse(HealthResponse):
    checks: DependencyChecks


router = APIRouter(tags=["健康检查"])


@router.get("/healthz", response_model=Result[HealthResponse], summary="存活探测")
async def healthz() -> Result[HealthResponse]:
    data = HealthResponse(status="ok", time=datetime.now(timezone.utc))
    return Result(code=200, message="ok", data=data)


@router.get("/readyz", response_model=Result[ReadyResponse], summary="就绪检查")
async def readyz() -> Result[ReadyResponse]:
    # TODO: 探测 MySQL 和 Redis；任一依赖异常时返回 503 及 degraded 检查结果。
    not_implemented("检查 MySQL 和 Redis 是否就绪")
