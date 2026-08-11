"""
管理员相关路由定义

对齐 SACC 项目 router/router.go:
    admin := v1.Group("/admin")
    admin.Use(middleware.Auth(deps.AuthService))
    {
        admin.GET("/me", deps.AuthHandler.Me)
        ...
    }

所有 /api/v1/admin/* 路由均需要 Bearer Token 认证。
"""

from fastapi import APIRouter, Depends
from middlewares.auth import get_current_user
from controllers.admin_controller import get_current_user_info
from models.user import AuthClaims

# ---------------------------------------------------------------------------
# 创建路由实例（对齐 SACC router.go: admin := v1.Group("/admin")）
# ---------------------------------------------------------------------------
router = APIRouter(
    prefix="/api/v1/admin",
    tags=["管理接口 - 认证"],  # 对齐 SACC api-doc.json tags
)


# ---------------------------------------------------------------------------
# GET /api/v1/admin/me  —  获取当前登录用户信息
# 对齐 SACC:
#   - router:  admin.GET("/me", deps.AuthHandler.Me)
#   - handler: auth_handler.go::Me()
#   - spec:    api-doc.json → /api/v1/admin/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    summary="获取当前登录用户信息",
    description="""
用于前端验证 Token 有效性并刷新用户信息。
每次加载管理端页面时调用。若 Token 无效或过期返回 401，前端自动跳转登录页。

**认证方式:** Bearer Token (JWT) — 通过 POST /api/v1/auth/login 获取。

**成功响应 (200):**
```json
{
    "data": {
        "userId": 1,
        "username": "admin",
        "displayName": "Super Admin",
        "role": "super_admin",
        "position": "前端组组长",
        "desc": "一句话简介",
        "avatar": "/uploads/avatars/admin.png"
    }
}
```

**失败响应 (401):**
```json
{
    "message": "invalid token"
}
```
    """,
)
async def me(
    # Depends(get_current_user) 触发 JWT 认证中间件
    # 认证通过 → claims 为 AuthClaims(uid, uname, role)
    # 认证失败 → 自动返回 401 {"message": "invalid token"}
    claims: AuthClaims = Depends(get_current_user),
):
    """
    获取当前登录用户信息。

    该接口不需要额外参数，用户身份完全由 JWT Token 承载。
    对齐 SACC frontend AuthContext.jsx 的调用方式:
        fetch('/api/v1/admin/me', { headers: { Authorization: `Bearer ${token}` } })
    """
    return await get_current_user_info(claims)
