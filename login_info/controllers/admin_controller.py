"""
管理员相关接口的控制器（Handler）

对齐 SACC 项目 handler/auth_handler.go 中的 Me 方法。

设计原则（对齐 SACC）:
  - JWT claims 仅包含认证三元组 (uid, uname, role)。
  - /me 端点根据 claims.uid 从"数据库"查询完整用户信息，
    补全 displayName, position, desc, avatar 后返回 7 个字段。
  - 当前为演示实现，使用内存模拟数据库查询；
    实际项目应对接 MySQL（如 SACC 使用 GORM + AdminUserRepository）。
"""

from models.user import AuthClaims, UserProfileData
from utils.response import success_response


# ---------------------------------------------------------------------------
# 模拟用户数据库（对齐 SACC model.AdminUser + seed.go）
#
# 生产环境中，这些数据应来自:
#   repository.AdminUserRepository.FindByID(ctx, uid)
#   → model.AdminUser{ID, Username, DisplayName, Role, ...}
# ---------------------------------------------------------------------------

# 模拟用户表 — 对齐 SACC seed.go 中创建的默认管理员
_MOCK_USERS: dict[int, dict] = {
    1: {
        "userId": 1,
        "username": "admin",
        "displayName": "Super Admin",
        "role": "super_admin",
        "position": "前端组组长",
        "desc": "一句话简介",
        "avatar": "/uploads/avatars/admin.png",
    },
    2: {
        "userId": 2,
        "username": "editor",
        "displayName": "Editor Zhang",
        "role": "editor",
        "position": "后端组组员",
        "desc": "专注内容管理",
        "avatar": "/uploads/avatars/editor.png",
    },
}


# ---------------------------------------------------------------------------
# 模拟数据库查询
# ---------------------------------------------------------------------------

async def _find_user_by_id(uid: int) -> dict | None:
    """
    根据用户 ID 查询完整用户信息。

    对齐 SACC:
        repository/admin_user_repository.go::FindByID(ctx, id)
        → SELECT * FROM admin_users WHERE id = ? AND status = 'active'

    参数:
        uid: 用户唯一 ID（来自 JWT claims.uid）。

    返回:
        用户完整信息 dict，若用户不存在则返回 None。
    """
    return _MOCK_USERS.get(uid)


# ---------------------------------------------------------------------------
# Handler: 获取当前登录用户信息
# ---------------------------------------------------------------------------

async def get_current_user_info(claims: AuthClaims) -> dict:
    """
    获取当前登录用户的完整信息（7 个字段）。

    对齐 SACC handler/auth_handler.go::Me():
        claims := c.Get(contextkey.AuthUserKey).(*service.AuthClaims)
        c.JSON(200, gin.H{"data": gin.H{
            "userId": claims.UserID, "username": claims.Username, "role": claims.Role,
        }})

    ⚠️ 注意: SACC 当前 Go 代码的 Me() 仅返回 3 个字段 (userId, username, role)，
    但其 api-doc.json 的 MeResponse schema 定义了完整的 7 个字段。
    本实现按 api-doc.json 的目标规范返回全部 7 个字段。

    参数:
        claims: JWT 中间件解析的 AuthClaims（uid, uname, role）。

    返回:
        SACC 风格响应: {"data": {userId, username, displayName, role, position, desc, avatar}}
    """
    # ------------------------------------------------------------------
    # 步骤 1: 根据 JWT claims.uid 查询完整用户信息
    #         对齐 SACC: user := repository.FindByID(ctx, claims.UserID)
    # ------------------------------------------------------------------
    user = await _find_user_by_id(claims.uid)

    if not user:
        from middlewares.auth import UnauthorizedError
        raise UnauthorizedError("invalid token")

    # ------------------------------------------------------------------
    # 步骤 2: 构造 UserProfileData（Pydantic 模型 → dict）
    # ------------------------------------------------------------------
    user_profile = UserProfileData(
        userId=user["userId"],
        username=user["username"],
        displayName=user["displayName"],
        role=user["role"],
        position=user["position"],
        desc=user["desc"],
        avatar=user["avatar"],
    )

    # ------------------------------------------------------------------
    # 步骤 3: 包装为 SACC 风格响应 { "data": {...} }
    #         对齐 SACC: c.JSON(http.StatusOK, gin.H{"data": gin.H{...}})
    # ------------------------------------------------------------------
    return success_response(data=user_profile.model_dump())
