import asyncio

from sqlalchemy import text

from app.database import engine
from app.redis_client import create_redis_client


async def check_mysql() -> bool:
    try:
        async with asyncio.timeout(2):
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def check_redis() -> bool:
    client = create_redis_client()
    try:
        async with asyncio.timeout(2):
            return bool(await client.ping())
    except Exception:
        return False
    finally:
        await client.aclose()
