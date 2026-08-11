"""
应用入口 — SACC 风格「获取当前登录用户信息」API

对齐 SACC 项目 (github.com/tt-dr/SACC) 的整体架构:
  - Go + Gin                 → Python + FastAPI
  - router/router.go         → routes/admin.py
  - middleware/auth.go       → middlewares/auth.py
  - handler/auth_handler.go  → controllers/admin_controller.py
  - service/auth_service.go  → (JWT 逻辑内置于 middleware)
  - model/models.go          → models/user.py

启动方式:
    python app.py
    或
    uvicorn app:app --reload --host 0.0.0.0 --port 8080

访问 Swagger 文档:
    http://localhost:8080/docs

对照 SACC 路由表:
    GET  /healthz                       → 存活探测
    GET  /readyz                        → 就绪检查
    POST /api/v1/auth/login             → 登录 (开发用)
    GET  /api/v1/admin/me               → 获取当前用户信息
"""

import time
import jwt
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from config import settings
from routes.admin import router as admin_router
from utils.response import error_response


# ---------------------------------------------------------------------------
# 创建 FastAPI 应用实例
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SACC API",
    version="2.0.0",
    description="南邮计软院科协官网后端接口 — Python 参考实现。所有管理接口均需 Bearer Token 认证。",
)

# ---------------------------------------------------------------------------
# 注册管理路由
# ---------------------------------------------------------------------------

app.include_router(admin_router)


# ---------------------------------------------------------------------------
# 全局 401 异常处理器 — 对齐 SACC middleware/auth.go 的错误响应格式
# ---------------------------------------------------------------------------

@app.exception_handler(401)
async def unauthorized_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    将认证失败异常转换为 SACC 风格的 401 响应。

    对齐 SACC middleware/auth.go:
        c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
    """
    detail = str(exc.detail) if hasattr(exc, "detail") else "invalid token"
    return JSONResponse(
        status_code=401,
        content=error_response(message=detail),
    )


# ---------------------------------------------------------------------------
# 健康检查端点（对齐 SACC router.go）
# ---------------------------------------------------------------------------

@app.get("/healthz", tags=["健康检查"])
async def liveness():
    """
    存活探测 — 对齐 SACC handler/health_handler.go::Liveness()

    Kubernetes / Docker 健康检查端点，不依赖任何外部服务。
    """
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@app.get("/readyz", tags=["健康检查"])
async def readiness():
    """
    就绪检查 — 对齐 SACC handler/health_handler.go::Readiness()

    检查所有依赖服务是否就绪（MySQL、Redis 等）。
    当前演示版本仅标记为 ready。
    """
    return {
        "status": "ready",
        "checks": {"mysql": "up", "redis": "up"},
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ---------------------------------------------------------------------------
# 开发专用 — 模拟登录端点
# 对齐 SACC:
#   - router:  v1.POST("/auth/login", deps.AuthHandler.Login)
#   - handler: auth_handler.go::Login()
#   - service: auth_service.go::Login() → issueToken()
#
# ⚠️ 仅用于开发调试，生产环境务必移除！
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/login", tags=["Dev Only"])
async def dev_login(username: str = "admin", password: str = ""):
    """
    模拟登录，返回 SACC 格式的 JWT Token。

    对齐 SACC auth_service.go::issueToken():
        claims := &AuthClaims{
            UserID: user.ID, Username: user.Username, Role: user.Role,
            RegisteredClaims: jwt.RegisteredClaims{
                Subject: fmt.Sprintf("%d", user.ID),
                IssuedAt: jwt.NewNumericDate(now),
                ExpiresAt: jwt.NewNumericDate(expiresAt),
            },
        }

    JWT claims 使用 SACC 短键名:
        uid   → 用户 ID
        uname → 用户名
        role  → 角色
        sub   → 主题（用户 ID 字符串）
        iat   → 签发时间
        exp   → 过期时间

    警告: 生产环境务必移除该端点！
    """
    now = datetime.now(timezone.utc)
    exp = now.timestamp() + settings.ACCESS_TOKEN_EXPIRE_SECONDS

    # 构造 SACC 风格的 JWT payload（短键名）
    payload = {
        "uid": 1,
        "uname": username,
        "role": "super_admin",
        "sub": "1",
        "iat": int(now.timestamp()),
        "exp": int(exp),
    }

    token = jwt.encode(
        payload=payload,
        key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return {
        "data": {
            "token": token,
            "expiresIn": settings.ACCESS_TOKEN_EXPIRE_SECONDS,
            "userId": 1,
            "username": username,
            "displayName": "Super Admin",
            "role": "super_admin",
        }
    }


# ---------------------------------------------------------------------------
# 直接运行入口
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
