"""
FastAPI 应用入口 —— SACC 审计日志 API。

启动方式：
    uvicorn main:app --reload
或：
    python main.py

OpenAPI 文档自动生成于：
    http://localhost:8000/docs      (Swagger UI)
    http://localhost:8000/redoc     (ReDoc)
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.routers.admin import router as admin_router

app = FastAPI(
    title="SACC 操作审计日志 API",
    description="管理端操作审计日志接口服务 — 对齐 SACC server/ 项目约定",
    version="1.0.0",
)

# 注册路由
app.include_router(admin_router)


# ---------------------------------------------------------------------------
# 全局 401 处理 —— 将 HTTPException(detail="...") 映射为 {"message": "..."}
# 与 SACC 项目 middleware/auth.go 的 c.AbortWithStatusJSON 格式一致
# ---------------------------------------------------------------------------
@app.exception_handler(401)
async def unauthorized_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"message": exc.detail if hasattr(exc, "detail") else "unauthorized"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
