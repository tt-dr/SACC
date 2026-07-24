package handler

import (
	"errors"
	"net/http"
	"strings"

	"sacc.com/server/internal/pkg/contextkey"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	result, err := h.authService.Login(c.Request.Context(), strings.TrimSpace(req.Username), req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid username or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "login failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *AuthHandler) Me(c *gin.Context) {
	rawClaims, exists := c.Get(contextkey.AuthUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	claims, ok := rawClaims.(*service.AuthClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"userId":   claims.UserID,
			"username": claims.Username,
			"role":     claims.Role,
		},
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	rawClaims, exists := c.Get(contextkey.AuthUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	claims, ok := rawClaims.(*service.AuthClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	if err := h.authService.ChangePassword(c.Request.Context(), claims.UserID, req.OldPassword, req.NewPassword); err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid old password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to change password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password changed"})
}
