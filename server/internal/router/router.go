package router

import (
	"sacc.com/server/internal/handler"
	"sacc.com/server/internal/middleware"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

// Dependencies 路由层依赖聚合
type Dependencies struct {
	AuthHandler *handler.AuthHandler
	AuthService *service.AuthService
	// 后续可扩展其他 Handler 和 Service
}

// New 创建并配置 Gin 路由引擎
func New(deps Dependencies) *gin.Engine {
	engine := gin.Default()

	// API v1 路由组
	v1 := engine.Group("/api/v1")
	{
		// 管理员路由（需要 JWT 认证）
		admin := v1.Group("/admin")
		admin.Use(middleware.Auth(deps.AuthService))
		{
			// 修改当前用户密码
			admin.PUT("/password", deps.AuthHandler.ChangePassword)
		}
	}

	return engine
}
