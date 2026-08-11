"""
FastAPI 依赖注入 —— JWT 认证。

对齐 SACC 项目 internal/middleware/auth.go：
- 从 Authorization: Bearer <token> 头解析 Token
- 401 时返回 {"message": "..."} 格式（与 Go 中间件一致）
- 校验通过后将用户信息存入 request.state，供路由使用
"""

from typing import Optional

import jwt
from fastapi import Header, HTTPException, Request

from app.config import JWT_ALGORITHM, JWT_SECRET


class CurrentUser:
    """
    当前登录用户信息。

    对应 SACC 项目的 service.AuthClaims 结构：
      type AuthClaims struct {
          UserID   uint   `json:"uid"`
          Username string `json:"uname"`
          Role     string `json:"role"`
          jwt.RegisteredClaims
      }
    """

    def __init__(self, user_id: int, username: str, role: str = ""):
        self.user_id = user_id
        self.username = username
        self.role = role


async def get_current_user(request: Request) -> CurrentUser:
    """
    从 Authorization 头解析 JWT Token 并返回当前用户。

    Token 缺失 / 无效 / 过期均返回 401，
    响应体格式与 Go 中间件一致：{"message": "missing or invalid bearer token"}。
    """
    authorization = request.headers.get("Authorization")

    if not authorization:
        raise HTTPException(
            status_code=401, detail="missing or invalid bearer token"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401, detail="missing or invalid bearer token"
        )

    token = parts[1]
    if not token.strip():
        raise HTTPException(
            status_code=401, detail="missing bearer token"
        )

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid token")

    # AuthClaims 字段对齐：uid / uname / role
    user_id = payload.get("uid") or payload.get("user_id")
    username = payload.get("uname") or payload.get("username", "")
    role = payload.get("role", "")

    if user_id is None:
        raise HTTPException(status_code=401, detail="invalid token")

    return CurrentUser(user_id=int(user_id), username=username, role=role)
