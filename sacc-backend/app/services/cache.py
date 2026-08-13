from collections.abc import Awaitable, Callable
from typing import TypeVar

from pydantic import BaseModel

from app.redis_client import create_redis_client


ModelT = TypeVar("ModelT", bound=BaseModel)


async def get_or_set_model(
    *,
    key: str,
    ttl_seconds: int,
    model_type: type[ModelT],
    loader: Callable[[], Awaitable[ModelT]],
) -> ModelT:
    client = create_redis_client()
    try:
        try:
            cached = await client.get(key)
        except Exception:
            cached = None
        if cached:
            try:
                return model_type.model_validate_json(cached)
            except ValueError:
                pass

        value = await loader()
        try:
            await client.setex(key, ttl_seconds, value.model_dump_json(by_alias=True))
        except Exception:
            pass
        return value
    finally:
        await client.aclose()
