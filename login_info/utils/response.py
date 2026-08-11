"""
统一响应格式工具

对齐 SACC 项目的实际 API 响应格式:
  - 成功 → { "data": {...} }
  - 失败 → { "message": "..." }

对照 SACC 源码:
  - auth_handler.go Me():     c.JSON(200, gin.H{"data": gin.H{...}})
  - auth_handler.go Login():  c.JSON(200, gin.H{"data": result})
  - middleware/auth.go:       c.AbortWithStatusJSON(401, gin.H{"message": "..."})
"""

from typing import Any


def success_response(data: Any = None) -> dict:
    """
    构造 SACC 风格的成功响应体。

    SACC 不使用 {code, message, data} 三层包装，
    而是直接将业务数据挂载在 data 字段下。

    对照:
      SACC auth_handler.go: c.JSON(http.StatusOK, gin.H{"data": ...})

    参数:
        data: 响应中携带的业务数据。

    返回:
        {"data": {...}}
    """
    return {"data": data}


def error_response(message: str = "服务器内部错误") -> dict:
    """
    构造 SACC 风格的错误响应体。

    SACC 错误响应仅包含 message 字段，无 code/data 包装。

    对照:
      SACC middleware/auth.go:
        c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})

    参数:
        message: 人类可读的错误描述。

    返回:
        {"message": "..."}
    """
    return {"message": message}
