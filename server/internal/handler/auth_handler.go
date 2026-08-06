package handler

import (
	"errors"
	"net/http"
	"strings"

	"sacc.com/server/internal/pkg/contextkey"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证相关接口处理器
type AuthHandler struct {
	authService *service.AuthService
}

// ChangePasswordRequest 修改密码请求体
type ChangePasswordRequest struct {
	OldPassword     string `json:"oldPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// ChangePassword 修改当前用户密码
// PUT /api/v1/admin/password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	// 1. 从上下文获取当前用户认证信息（由 Auth 中间件注入）
	rawClaims, exists := c.Get(contextkey.AuthUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "未授权或 Token 已过期"})
		return
	}

	claims, ok := rawClaims.(*service.AuthClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "未授权或 Token 已过期"})
		return
	}

	// 2. 解析请求体
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "参数错误"})
		return
	}

	// 3. 调用 Service 修改密码
	if err := h.authService.ChangePassword(c.Request.Context(), claims.UserID, req.OldPassword, req.NewPassword, req.ConfirmPassword); err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusBadRequest, gin.H{"message": "旧密码错误"})
			return
		}
		// 其他业务错误（密码不一致、强度不足等）
		if strings.Contains(err.Error(), "新密码") {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "密码修改失败"})
		return
	}

	// 4. 返回成功
	c.JSON(http.StatusOK, gin.H{"message": "密码修改成功"})
}
