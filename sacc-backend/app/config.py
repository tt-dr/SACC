from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SACC API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False

    database_url: str = (
        "mysql+asyncmy://sacc:sacc_password@mysql:3306/sacc"
        "?charset=utf8mb4"
    )
    redis_url: str = "redis://redis:6379/0"

    jwt_secret_key: str = "replace-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_seconds: int = 43_200

    cors_origins: list[str] = ["http://localhost:5173"]
    upload_dir: str = "uploads"
    max_upload_size: int = 10 * 1024 * 1024

    oss_endpoint: str | None = None
    oss_access_key_id: str | None = None
    oss_access_key_secret: str | None = None
    oss_bucket_name: str | None = None
    oss_bucket_prefix: str = "sacc/"
    oss_public_base_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
