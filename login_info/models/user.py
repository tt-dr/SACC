"""
用户相关的 Pydantic 模型定义

对齐 SACC api-doc.json 中定义的 schemas:
  - MeResponse   → 当前用户信息响应
  - LoginResponse → 登录成功响应
  - AuthClaims    → JWT Token 内载的认证声明

设计原则（对齐 SACC）:
  - JWT claims 仅存认证三元组 (uid, uname, role)，保持 Token 轻量。
  - 完整用户信息（含 displayName, position, desc, avatar）由 /me 端点
    从数据库查询后返回，不写入 JWT。
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# JWT 认证声明（对齐 SACC service.AuthClaims）
# ---------------------------------------------------------------------------

class AuthClaims(BaseModel):
    """
    JWT Token 内载的认证声明。

    对齐 SACC auth_service.go:
        type AuthClaims struct {
            UserID   uint   `json:"uid"`
            Username string `json:"uname"`
            Role     string `json:"role"`
            jwt.RegisteredClaims
        }

    设计理由: JWT 只存认证必需的三个字段，保持 Token 体积小。
    展示类字段（displayName, position, desc, avatar）从数据库查询。
    """

    uid: int = Field(
        ...,
        description="用户唯一 ID（对应 SACC claims.UserID）",
    )
    uname: str = Field(
        ...,
        description="登录用户名（对应 SACC claims.Username）",
    )
    role: str = Field(
        ...,
        description="用户角色，枚举值：super_admin | editor",
    )


# ---------------------------------------------------------------------------
# 用户完整信息（对齐 SACC MeResponse.data）
# ---------------------------------------------------------------------------

class UserProfileData(BaseModel):
    """
    用户完整信息 — 嵌套在 /me 响应的 `data` 字段中。

    对齐 SACC api-doc.json → MeResponse.data（7 个字段）:
      userId, username, displayName, role, position, desc, avatar
    """

    userId: int = Field(
        ...,
        description="用户唯一 ID",
        examples=[1],
    )
    username: str = Field(
        ...,
        description="登录用户名",
        examples=["admin"],
    )
    displayName: str = Field(
        ...,
        description="用户真实姓名或昵称（用于界面展示）",
        examples=["Super Admin"],
    )
    role: str = Field(
        ...,
        description="用户角色，枚举值：super_admin | editor",
        examples=["super_admin"],
    )
    position: str = Field(
        ...,
        description="社团职务或头衔",
        examples=["前端组组长"],
    )
    desc: str = Field(
        ...,
        description="个人简介",
        examples=["一句话简介"],
    )
    avatar: str = Field(
        ...,
        description="头像链接地址（相对路径或完整 URL）",
        examples=["/uploads/avatars/admin.png"],
    )
