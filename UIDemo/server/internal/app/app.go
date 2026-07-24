package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sacc.com/server/internal/bootstrap"
	"sacc.com/server/internal/config"
	"sacc.com/server/internal/handler"
	"sacc.com/server/internal/repository"
	"sacc.com/server/internal/router"
	"sacc.com/server/internal/seed"
	"sacc.com/server/internal/service"
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	appLogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	appLogger.Info("bootstrapping app", "name", cfg.App.Name, "env", cfg.App.Env)

	db, err := bootstrap.NewMySQL(cfg.Database, appLogger)
	if err != nil {
		return err
	}

	redisClient, err := bootstrap.NewRedisClient(cfg.Redis, appLogger)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := redisClient.Close(); closeErr != nil {
			appLogger.Error("close redis connection", "error", closeErr)
		}
	}()

	seedCtx, seedCancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer seedCancel()

	if err := seed.MigrateAndSeed(seedCtx, db, cfg.Seed, appLogger); err != nil {
		return fmt.Errorf("migrate and seed: %w", err)
	}

	adminUserRepo := repository.NewAdminUserRepository(db)
	contentRepo := repository.NewContentRepository(db)

	authService := service.NewAuthService(adminUserRepo, cfg.Security)
	contentService := service.NewContentService(contentRepo)
	adminUserService := service.NewAdminUserService(adminUserRepo)

	healthHandler := handler.NewHealthHandler(db, redisClient)
	siteHandler := handler.NewSiteHandler()
	authHandler := handler.NewAuthHandler(authService)
	contentHandler := handler.NewContentHandler(contentService)
	adminUserHandler := handler.NewAdminUserHandler(adminUserService)
	uploadHandler := handler.NewUploadHandler()

	engine := router.New(router.Dependencies{
		Config:           cfg,
		Logger:           appLogger,
		HealthHandler:    healthHandler,
		SiteHandler:      siteHandler,
		AuthHandler:      authHandler,
		AdminUserHandler: adminUserHandler,
		ContentHandler:   contentHandler,
		UploadHandler:    uploadHandler,
		AuthService:      authService,
	})

	httpServer := &http.Server{
		Addr:         cfg.ServerAddress(),
		Handler:      engine,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	serverErrChan := make(chan error, 1)
	go func() {
		appLogger.Info("http server listening", "addr", cfg.ServerAddress())
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrChan <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErrChan:
		return fmt.Errorf("http server crashed: %w", err)
	case sig := <-quit:
		appLogger.Info("shutdown signal received", "signal", sig.String())
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("graceful shutdown failed: %w", err)
	}

	appLogger.Info("server gracefully stopped")
	return nil
}
