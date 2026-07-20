package middleware

import (
	"net/http"
	"sync"
	"time"

	"sacc.com/server/internal/config"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type visitorEntry struct {
	limiter    *rate.Limiter
	lastAccess time.Time
}

func RateLimit(cfg config.RateLimitConfig) gin.HandlerFunc {
	if !cfg.Enabled {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	var (
		mu       sync.Mutex
		visitors = map[string]*visitorEntry{}
	)

	// Clean old entries periodically to avoid unbounded memory growth.
	go func() {
		ticker := time.NewTicker(cfg.CleanupInterval)
		defer ticker.Stop()

		for range ticker.C {
			cutoff := time.Now().Add(-cfg.EntryTTL)

			mu.Lock()
			for key, entry := range visitors {
				if entry.lastAccess.Before(cutoff) {
					delete(visitors, key)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		key := c.ClientIP()
		now := time.Now()

		mu.Lock()
		entry, ok := visitors[key]
		if !ok {
			entry = &visitorEntry{
				limiter:    rate.NewLimiter(rate.Limit(cfg.RequestsPerSec), cfg.Burst),
				lastAccess: now,
			}
			visitors[key] = entry
		}
		entry.lastAccess = now
		allowed := entry.limiter.Allow()
		mu.Unlock()

		if !allowed {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "too many requests",
			})
			return
		}

		c.Next()
	}
}
