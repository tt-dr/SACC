package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewHealthHandler(db *gorm.DB, redisClient *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redisClient,
	}
}

func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"time":   time.Now().UTC(),
	})
}

func (h *HealthHandler) Readiness(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "up"
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.PingContext(ctx) != nil {
		dbStatus = "down"
	}

	redisStatus := "up"
	if err := h.redis.Ping(ctx).Err(); err != nil {
		redisStatus = "down"
	}

	statusCode := http.StatusOK
	if dbStatus != "up" || redisStatus != "up" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, gin.H{
		"status": map[bool]string{true: "ready", false: "degraded"}[statusCode == http.StatusOK],
		"checks": gin.H{
			"mysql": dbStatus,
			"redis": redisStatus,
		},
		"time": time.Now().UTC(),
	})
}
