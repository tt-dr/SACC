"""
JWT 认证中间件

对齐 SACC 项目 middleware/auth.go 的认证逻辑:
  1. 从 Authorization 头提取 Bearer Token。
  2. 调用 AuthService.ParseToken() 校验签名与过期时间。
  3. 解析成功后，将 AuthClaims 注入 gin.Context（FastAPI 中注入到路由参数）。
  4. Token 缺失 / 格式错误 / 无效 → 返回 401 + {"message": "..."}。

对照 SACC 源码:
  - middleware/auth.go::Auth()      — Gin 中间件
  - service/auth_service.go::ParseToken() — JWT 解析
  - service/auth_service.go::AuthClaims   — JWT claims 结构 (uid, uname, role)
"""

import jwt
from fastapi import Request, HTTPException, Depends
from config import settings
from models.user import AuthClaims


# ---------------------------------------------------------------------------
# 自定义异常 — 认证失败时抛出
# ---------------------------------------------------------------------------

class UnauthorizedError(HTTPException):
    """
    认证失败异常。

    status_code 固定为 401，前端据此跳转登录页。
    对齐 SACC middleware/auth.go 的错误处理。
    """

    def __init__(self, detail: str = "invalid token"):
        super().__init__(status_code=401, detail=detail)


# ---------------------------------------------------------------------------
# 从请求头提取 Bearer Token（对齐 SACC middleware/auth.go）
# ---------------------------------------------------------------------------

def _extract_token(request: Request) -> str:
    """
    从 Authorization 请求头中提取 Bearer Token。

    对齐 SACC middleware/auth.go:
        header := strings.TrimSpace(c.GetHeader("Authorization"))
        if !strings.HasPrefix(strings.ToLower(header), "bearer ") { ... }
        token := strings.TrimSpace(header[len("Bearer "):])

    参数:
        request: FastAPI Request 对象。

    返回:
        提取到的 JWT 字符串。

    异常:
        UnauthorizedError — 缺失或格式不正确时抛出。
    """
    auth_header: str | None = request.headers.get("Authorization")

    if not auth_header:
        raise UnauthorizedError("missing or invalid bearer token")

    # 不区分大小写匹配 "Bearer " 前缀（对齐 SACC strings.HasPrefix + strings.ToLower）
    if not auth_header.lower().startswith("bearer "):
        raise UnauthorizedError("missing or invalid bearer token")

    token = auth_header[len("Bearer "):].strip()
    if not token:
        raise UnauthorizedError("missing bearer token")

    return token


# ---------------------------------------------------------------------------
# 校验 JWT Token（对齐 SACC service/auth_service.go::ParseToken）
# ---------------------------------------------------------------------------

def _verify_token(token: str) -> AuthClaims:
    """
    校验 JWT Token 的签名与有效期，返回 AuthClaims。

    对齐 SACC auth_service.go::ParseToken():
        claims := &AuthClaims{}
        token, err := jwt.ParseWithClaims(tokenString, claims, ...)
        return claims, nil

    参数:
        token: JWT 字符串。

    返回:
        AuthClaims — 包含 uid, uname, role 的认证声明。

    异常:
        UnauthorizedError — Token 无效、过期或签名不匹配时抛出。
    """
    try:
        payload: dict = jwt.decode(
            token,
            key=settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # 构造 AuthClaims — JWT payload 使用 SACC 短键名 (uid, uname, role)
        return AuthClaims(
            uid=payload["uid"],
            uname=payload["uname"],
            role=payload["role"],
        )

    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("invalid token")

    except (jwt.InvalidTokenError, KeyError):
        # KeyError: payload 中缺少 uid/uname/role 字段
        raise UnauthorizedError("invalid token")


# ---------------------------------------------------------------------------
# FastAPI 依赖 — 获取当前登录用户的认证声明
# ---------------------------------------------------------------------------

async def get_current_user(request: Request) -> AuthClaims:
    """
    FastAPI 依赖函数 — 从 JWT 中解析 AuthClaims 并注入路由。

    对齐 SACC 的认证中间件链路:
      middleware/auth.go  →  c.Set(contextkey.AuthUserKey, claims)
      auth_handler.go Me  →  c.Get(contextkey.AuthUserKey) → *AuthClaims

    使用方式:
        @router.get("/me")
        async def me(claims: AuthClaims = Depends(get_current_user)):
            ...

    参数:
        request: FastAPI 自动注入的 Request 对象。

    返回:
        AuthClaims — 包含 uid (int), uname (str), role (str)。

    异常:
        UnauthorizedError — 认证链路中任意环节失败时抛出。
    """
    # 步骤 1: 提取 Token（对齐 SACC middleware/auth.go）
    token = _extract_token(request)

    # 步骤 2: 校验 Token 并返回 AuthClaims（对齐 SACC ParseToken）
    claims = _verify_token(token)

    # 步骤 3: 可选 — 数据库校验用户状态
    # 对齐 SACC repository/admin_user_repository.go::FindByID
    # user = await db.find_user_by_id(claims.uid)
    # if not user or user.status != "active":
    #     raise UnauthorizedError("invalid token")

    return claims
