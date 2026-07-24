package router

import (
	"log/slog"

	"sacc.com/server/internal/config"
	"sacc.com/server/internal/handler"
	"sacc.com/server/internal/middleware"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

type Dependencies struct {
	Config           config.Config
	Logger           *slog.Logger
	HealthHandler    *handler.HealthHandler
	SiteHandler      *handler.SiteHandler
	AuthHandler      *handler.AuthHandler
	AdminUserHandler *handler.AdminUserHandler
	ContentHandler   *handler.ContentHandler
	UploadHandler    *handler.UploadHandler
	AuthService      *service.AuthService
}

func New(deps Dependencies) *gin.Engine {
	if deps.Config.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()
	engine.Use(
		middleware.RequestID(),
		middleware.Recovery(deps.Logger),
		middleware.AccessLog(deps.Logger),
		middleware.CORS(deps.Config.CORS),
		middleware.RateLimit(deps.Config.RateLimit),
	)

	engine.GET("/healthz", deps.HealthHandler.Liveness)
	engine.GET("/readyz", deps.HealthHandler.Readiness)

	v1 := engine.Group("/api/v1")
	{
		public := v1.Group("/public")
		public.GET("/bootstrap", deps.SiteHandler.Bootstrap)

		v1.POST("/auth/login", deps.AuthHandler.Login)
		v1.GET("/content", deps.ContentHandler.List)
		v1.GET("/content/:id", deps.ContentHandler.GetByID)
	}

	admin := v1.Group("/admin")
	admin.Use(middleware.Auth(deps.AuthService))
	{
		admin.GET("/me", deps.AuthHandler.Me)
		admin.PUT("/password", deps.AuthHandler.ChangePassword)
		admin.GET("/users", deps.AdminUserHandler.List)
		admin.POST("/users", deps.AdminUserHandler.Create)
		admin.PUT("/users/:id", deps.AdminUserHandler.Update)
		admin.DELETE("/users/:id", deps.AdminUserHandler.Disable)
		admin.GET("/content", deps.ContentHandler.List)
		admin.POST("/content", deps.ContentHandler.Create)
		admin.PUT("/content/:id", deps.ContentHandler.Update)
		admin.POST("/upload", deps.UploadHandler.Upload)
	}

	return engine
}
