"""
应用全局配置

对齐 SACC 项目 (github.com/tt-dr/SACC) 的配置规范。
所有可配置项集中管理，生产环境通过环境变量注入敏感信息。

对照:
  - SACC config.go: SecurityConfig.JWTSecret, AccessTokenTTL (12h)
  - SACC config.go: ServerConfig.Host, Port (8080)
"""

import os


class Settings:
    """
    应用配置类

    对照 SACC config.go 中的 SecurityConfig / ServerConfig 结构。
    """

    # ========== JWT 配置（对齐 SACC SecurityConfig）==========
    # JWT 签名秘钥 — SACC 要求至少 16 字符，生产环境通过 JWT_SECRET 注入
    SECRET_KEY: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

    # JWT 签名算法 — SACC 使用 HS256 (HMAC-SHA256)
    ALGORITHM: str = "HS256"

    # Token 过期时间 — SACC 默认 ACCESS_TOKEN_TTL = 12h
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 12

    # ========== 服务配置（对齐 SACC ServerConfig）==========
    HOST: str = "0.0.0.0"
    PORT: int = 8080  # SACC 默认端口


# 全局单例
settings = Settings()
