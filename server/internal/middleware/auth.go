package middleware

import (
	"errors"
	"net/http"
	"strings"

	"sacc.com/server/internal/pkg/contextkey"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

// Auth JWT 认证中间件
// 从 Authorization Header 中提取 Bearer Token，解析后将 AuthClaims 注入上下文
func Auth(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "未授权或 Token 已过期"})
			return
		}

		token := strings.TrimSpace(header[len("Bearer "):])
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "未授权或 Token 已过期"})
			return
		}

		claims, err := authService.ParseToken(token)
		if err != nil {
			status := http.StatusUnauthorized
			if !errors.Is(err, service.ErrInvalidToken) {
				status = http.StatusInternalServerError
			}
			c.AbortWithStatusJSON(status, gin.H{"message": "未授权或 Token 已过期"})
			return
		}

		c.Set(contextkey.AuthUserKey, claims)
		c.Next()
	}
}
