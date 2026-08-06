package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config 应用配置
type Config struct {
	App      AppConfig
	Server   ServerConfig
	Security SecurityConfig
	Database DatabaseConfig
}

// AppConfig 应用基本配置
type AppConfig struct {
	Name string
	Env  string
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int
	Mode string
}

// SecurityConfig 安全相关配置
type SecurityConfig struct {
	JWTSecret      string
	AccessTokenTTL time.Duration
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	DSN          string
	MaxOpenConns int
	MaxIdleConns int
	MaxIdleTime  time.Duration
}

// Load 加载配置（从环境变量读取，带默认值）
func Load() (Config, error) {
	cfg := Config{
		App: AppConfig{
			Name: getEnv("APP_NAME", "sacc-api"),
			Env:  getEnv("APP_ENV", "development"),
		},
		Server: ServerConfig{
			Port: getEnvInt("SERVER_PORT", 8080),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Security: SecurityConfig{
			JWTSecret:      getEnv("JWT_SECRET", "change-me-in-production-please"),
			AccessTokenTTL: getEnvDuration("ACCESS_TOKEN_TTL", 12*time.Hour),
		},
		Database: DatabaseConfig{
			DSN:          getEnv("MYSQL_DSN", defaultMySQLDSN()),
			MaxOpenConns: getEnvInt("MYSQL_MAX_OPEN_CONNS", 25),
			MaxIdleConns: getEnvInt("MYSQL_MAX_IDLE_CONNS", 10),
			MaxIdleTime:  getEnvDuration("MYSQL_MAX_IDLE_TIME", 5*time.Minute),
		},
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

// Validate 校验必要配置项
func (c Config) Validate() error {
	if c.Security.JWTSecret == "" || c.Security.JWTSecret == "change-me-in-production-please" {
		return errors.New("JWT_SECRET must be configured with a secure value")
	}
	if len(c.Security.JWTSecret) < 16 {
		return errors.New("JWT_SECRET must be at least 16 characters")
	}
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid SERVER_PORT: %d", c.Server.Port)
	}
	return nil
}

// ServerAddress 返回服务器监听地址
func (c Config) ServerAddress() string {
	return fmt.Sprintf(":%d", c.Server.Port)
}

func defaultMySQLDSN() string {
	host := getEnv("MYSQL_HOST", "127.0.0.1")
	port := getEnv("MYSQL_PORT", "3306")
	user := getEnv("MYSQL_USER", "sacc")
	pass := getEnv("MYSQL_PASSWORD", "sacc_password")
	name := getEnv("MYSQL_DATABASE", "sacc")
	params := getEnv("MYSQL_PARAMS", "charset=utf8mb4&parseTime=True&loc=Local")
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?%s", user, pass, host, port, name, params)
}

// ---- 环境变量辅助函数 ----

func getEnv(key, fallback string) string {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}

func getEnvInt(key string, fallback int) int {
	raw := getEnv(key, "")
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	raw := getEnv(key, "")
	if raw == "" {
		return fallback
	}
	value, err := time.ParseDuration(raw)
	if err != nil {
		return fallback
	}
	return value
}
