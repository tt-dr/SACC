package middleware

import (
	"log/slog"
	"time"

	"sacc.com/server/internal/pkg/contextkey"

	"github.com/gin-gonic/gin"
)

func AccessLog(appLogger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		latency := time.Since(start)
		requestID, _ := c.Get(contextkey.RequestIDKey)

		appLogger.Info("http request",
			"requestID", requestID,
			"status", c.Writer.Status(),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"query", c.Request.URL.RawQuery,
			"ip", c.ClientIP(),
			"userAgent", c.Request.UserAgent(),
			"latencyMs", latency.Milliseconds(),
		)
	}
}
