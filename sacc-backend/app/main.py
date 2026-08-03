from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import (
    admin_content,
    admin_dashboard,
    admin_users,
    auth,
    health,
    public,
)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="NJUPT SACC official website backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: 添加结构化请求日志、请求 ID、耗时统计和全局异常处理。
app.mount(
    "/uploads",
    StaticFiles(directory=settings.upload_dir, check_dir=False),
    name="uploads",
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin_content.router)
app.include_router(admin_users.router)
app.include_router(admin_dashboard.router)
