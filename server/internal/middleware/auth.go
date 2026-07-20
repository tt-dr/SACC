package middleware

import (
	"errors"
	"net/http"
	"strings"

	"sacc.com/server/internal/pkg/contextkey"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

func Auth(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing or invalid bearer token"})
			return
		}

		token := strings.TrimSpace(header[len("Bearer "):])
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing bearer token"})
			return
		}

		claims, err := authService.ParseToken(token)
		if err != nil {
			status := http.StatusUnauthorized
			if !errors.Is(err, service.ErrInvalidToken) {
				status = http.StatusInternalServerError
			}
			c.AbortWithStatusJSON(status, gin.H{"message": "invalid token"})
			return
		}

		c.Set(contextkey.AuthUserKey, claims)
		c.Next()
	}
}
