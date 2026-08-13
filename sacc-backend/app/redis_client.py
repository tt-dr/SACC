from redis.asyncio import Redis

from app.config import settings


def create_redis_client() -> Redis:
    return Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
