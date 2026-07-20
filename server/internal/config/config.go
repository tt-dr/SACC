package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	App       AppConfig
	Server    ServerConfig
	Security  SecurityConfig
	Database  DatabaseConfig
	Redis     RedisConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
	Seed      SeedConfig
}

type AppConfig struct {
	Name string
	Env  string
}

type ServerConfig struct {
	Host            string
	Port            int
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

type SecurityConfig struct {
	JWTSecret      string
	AccessTokenTTL time.Duration
}

type DatabaseConfig struct {
	DSN          string
	MaxOpenConns int
	MaxIdleConns int
	MaxIdleTime  time.Duration
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	ExposedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

type RateLimitConfig struct {
	Enabled         bool
	RequestsPerSec  float64
	Burst           int
	CleanupInterval time.Duration
	EntryTTL        time.Duration
}

type SeedConfig struct {
	Enabled     bool
	AdminUser   string
	AdminPass   string
	DisplayName string
	Role        string
}

func Load() (Config, error) {
	cfg := Config{
		App: AppConfig{
			Name: getEnv("APP_NAME", "sacc-api"),
			Env:  getEnv("APP_ENV", "development"),
		},
		Server: ServerConfig{
			Host:            getEnv("SERVER_HOST", "0.0.0.0"),
			Port:            getEnvInt("SERVER_PORT", 8080),
			ReadTimeout:     getEnvDuration("SERVER_READ_TIMEOUT", 10*time.Second),
			WriteTimeout:    getEnvDuration("SERVER_WRITE_TIMEOUT", 15*time.Second),
			IdleTimeout:     getEnvDuration("SERVER_IDLE_TIMEOUT", 60*time.Second),
			ShutdownTimeout: getEnvDuration("SERVER_SHUTDOWN_TIMEOUT", 10*time.Second),
		},
		Security: SecurityConfig{
			JWTSecret:      getEnv("JWT_SECRET", ""),
			AccessTokenTTL: getEnvDuration("ACCESS_TOKEN_TTL", 12*time.Hour),
		},
		Database: DatabaseConfig{
			DSN:          getEnv("MYSQL_DSN", defaultMySQLDSN()),
			MaxOpenConns: getEnvInt("MYSQL_MAX_OPEN_CONNS", 25),
			MaxIdleConns: getEnvInt("MYSQL_MAX_IDLE_CONNS", 10),
			MaxIdleTime:  getEnvDuration("MYSQL_MAX_IDLE_TIME", 5*time.Minute),
		},
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "127.0.0.1:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		CORS: CORSConfig{
			AllowedOrigins:   splitAndTrim(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")),
			AllowedMethods:   splitAndTrim(getEnv("CORS_ALLOWED_METHODS", "GET,POST,PUT,PATCH,DELETE,OPTIONS")),
			AllowedHeaders:   splitAndTrim(getEnv("CORS_ALLOWED_HEADERS", "Authorization,Content-Type,X-Requested-With,X-Request-ID")),
			ExposedHeaders:   splitAndTrim(getEnv("CORS_EXPOSED_HEADERS", "X-Request-ID")),
			AllowCredentials: getEnvBool("CORS_ALLOW_CREDENTIALS", false),
			MaxAge:           getEnvInt("CORS_MAX_AGE", 300),
		},
		RateLimit: RateLimitConfig{
			Enabled:         getEnvBool("RATE_LIMIT_ENABLED", true),
			RequestsPerSec:  getEnvFloat("RATE_LIMIT_RPS", 15.0),
			Burst:           getEnvInt("RATE_LIMIT_BURST", 30),
			CleanupInterval: getEnvDuration("RATE_LIMIT_CLEANUP_INTERVAL", 2*time.Minute),
			EntryTTL:        getEnvDuration("RATE_LIMIT_ENTRY_TTL", 5*time.Minute),
		},
		Seed: SeedConfig{
			Enabled:     getEnvBool("SEED_ENABLED", true),
			AdminUser:   getEnv("SEED_ADMIN_USERNAME", "admin"),
			AdminPass:   getEnv("SEED_ADMIN_PASSWORD", "ChangeMe_Strong_Password_123"),
			DisplayName: getEnv("SEED_ADMIN_DISPLAY_NAME", "Super Admin"),
			Role:        getEnv("SEED_ADMIN_ROLE", "super_admin"),
		},
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func (c Config) Validate() error {
	if c.Security.JWTSecret == "" {
		return errors.New("JWT_SECRET must be provided")
	}
	if len(c.Security.JWTSecret) < 16 {
		return errors.New("JWT_SECRET must be at least 16 characters")
	}
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid SERVER_PORT: %d", c.Server.Port)
	}
	if c.RateLimit.RequestsPerSec <= 0 {
		return errors.New("RATE_LIMIT_RPS must be greater than 0")
	}
	if c.RateLimit.Burst <= 0 {
		return errors.New("RATE_LIMIT_BURST must be greater than 0")
	}
	return nil
}

func (c Config) ServerAddress() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
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

func getEnvFloat(key string, fallback float64) float64 {
	raw := getEnv(key, "")
	if raw == "" {
		return fallback
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return fallback
	}
	return value
}

func getEnvBool(key string, fallback bool) bool {
	raw := strings.ToLower(getEnv(key, ""))
	if raw == "" {
		return fallback
	}
	switch raw {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
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

func splitAndTrim(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	chunks := strings.Split(raw, ",")
	result := make([]string, 0, len(chunks))
	for _, chunk := range chunks {
		value := strings.TrimSpace(chunk)
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}
