package middleware

import (
	"log/slog"
	"net/http"

	"sacc.com/server/internal/pkg/contextkey"

	"github.com/gin-gonic/gin"
)

func Recovery(appLogger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				requestID, _ := c.Get(contextkey.RequestIDKey)
				appLogger.Error("panic recovered",
					"error", recovered,
					"requestID", requestID,
					"path", c.Request.URL.Path,
					"method", c.Request.Method,
				)

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"message":   "internal server error",
					"requestId": requestID,
				})
			}
		}()

		c.Next()
	}
}
