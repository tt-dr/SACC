package seed

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"sacc.com/server/internal/config"
	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"

	"gorm.io/gorm"
)

func MigrateAndSeed(ctx context.Context, db *gorm.DB, cfg config.SeedConfig, appLogger *slog.Logger) error {
	if err := db.WithContext(ctx).AutoMigrate(
		&model.AdminUser{},
		&model.ContentItem{},
		&model.AuditLog{},
	); err != nil {
		return fmt.Errorf("auto migrate schema: %w", err)
	}

	if !cfg.Enabled {
		appLogger.Info("seed disabled")
		return nil
	}

	userRepo := repository.NewAdminUserRepository(db)
	existing, err := userRepo.FindByUsername(ctx, cfg.AdminUser)
	if err != nil {
		return fmt.Errorf("check seed admin exists: %w", err)
	}
	if existing != nil {
		appLogger.Info("seed admin already exists", "username", cfg.AdminUser)
		return nil
	}

	passwordHash, err := model.NewPasswordHash(cfg.AdminPass)
	if err != nil {
		return fmt.Errorf("hash seed admin password: %w", err)
	}

	user := &model.AdminUser{
		Username:     cfg.AdminUser,
		DisplayName:  cfg.DisplayName,
		PasswordHash: passwordHash,
		Role:         cfg.Role,
		Status:       "active",
	}
	if err := userRepo.Create(ctx, user); err != nil {
		return fmt.Errorf("create seed admin user: %w", err)
	}

	if err := seedContents(ctx, db); err != nil {
		return err
	}

	appLogger.Info("seed completed", "adminUsername", cfg.AdminUser)
	return nil
}

func seedContents(ctx context.Context, db *gorm.DB) error {
	var count int64
	if err := db.WithContext(ctx).Model(&model.ContentItem{}).Count(&count).Error; err != nil {
		return fmt.Errorf("count content items: %w", err)
	}
	if count > 0 {
		return nil
	}

	now := time.Now()
	items := []model.ContentItem{
		{
			Module:      "news",
			Slug:        "sacc-launch",
			Title:       "SACC Platform API Initialized",
			Summary:     "Backend bootstrap based on Gin + Gorm + Redis + MySQL is now online.",
			Body:        "This is a seeded content item for the initial deployment.",
			Tags:        "bootstrap,api,platform",
			Status:      "published",
			Author:      "system",
			PublishedAt: &now,
		},
	}

	if err := db.WithContext(ctx).Create(&items).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil
		}
		return fmt.Errorf("seed content items: %w", err)
	}
	return nil
}
