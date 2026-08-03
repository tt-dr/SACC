from datetime import datetime

from fastapi import APIRouter

from app.dependencies import not_implemented
from app.schemas import APIModel


class DependencyChecks(APIModel):
    mysql: str
    redis: str


class HealthResponse(APIModel):
    status: str
    time: datetime


class ReadyResponse(HealthResponse):
    checks: DependencyChecks


router = APIRouter(tags=["健康检查"])


@router.get("/healthz", response_model=HealthResponse, summary="存活探测")
async def healthz() -> HealthResponse:
    # TODO: 不检查外部依赖，直接返回 status=ok 和 UTC 服务器时间。
    not_implemented("返回服务存活状态")


@router.get("/readyz", response_model=ReadyResponse, summary="就绪检查")
async def readyz() -> ReadyResponse:
    # TODO: 探测 MySQL 和 Redis；任一依赖异常时返回 503 及 degraded 检查结果。
    not_implemented("检查 MySQL 和 Redis 是否就绪")
