import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.schemas import APIModel
from app.services.health import check_mysql, check_redis


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
    return HealthResponse(status="ok", time=datetime.now(timezone.utc))


@router.get(
    "/readyz",
    response_model=ReadyResponse,
    responses={503: {"model": ReadyResponse}},
    summary="就绪检查",
)
async def readyz() -> ReadyResponse | JSONResponse:
    mysql_up, redis_up = await asyncio.gather(check_mysql(), check_redis())
    response = ReadyResponse(
        status="ready" if mysql_up and redis_up else "degraded",
        checks=DependencyChecks(
            mysql="up" if mysql_up else "down",
            redis="up" if redis_up else "down",
        ),
        time=datetime.now(timezone.utc),
    )
    if mysql_up and redis_up:
        return response
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=response.model_dump(mode="json", by_alias=True),
    )
