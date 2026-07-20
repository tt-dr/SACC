package bootstrap

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"sacc.com/server/internal/config"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg config.RedisConfig, appLogger *slog.Logger) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         cfg.Addr,
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	appLogger.Info("redis connected", "addr", cfg.Addr, "db", cfg.DB)
	return client, nil
}
