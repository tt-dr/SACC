package app

import (
	"fmt"
	"log"

	"sacc.com/server/internal/bootstrap"
	"sacc.com/server/internal/config"
	"sacc.com/server/internal/handler"
	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"
	"sacc.com/server/internal/router"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

// Run 启动 API 服务
func Run() error {
	// 1. 加载配置
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	// 2. 设置 Gin 运行模式
	gin.SetMode(cfg.Server.Mode)

	// 3. 初始化数据库
	db := bootstrap.InitDB(cfg.Database)
	bootstrap.Migrate(db, &model.AdminUser{})

	// 4. 初始化 Repository
	userRepo := repository.NewAdminUserRepository(db)

	// 5. 初始化 Service
	authService := service.NewAuthService(userRepo, cfg.Security)

	// 6. 初始化 Handler
	authHandler := handler.NewAuthHandler(authService)

	// 7. 初始化路由
	r := router.New(router.Dependencies{
		AuthHandler: authHandler,
		AuthService: authService,
	})

	// 8. 启动服务器
	addr := cfg.ServerAddress()
	log.Printf("服务器启动在 http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		return fmt.Errorf("server run: %w", err)
	}

	return nil
}
