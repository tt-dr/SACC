package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"sacc.com/server/internal/config"
	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

// Sentinel errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

// AuthService 认证服务
type AuthService struct {
	userRepo *repository.AdminUserRepository
	cfg      config.SecurityConfig
}

// AuthClaims JWT Token 声明
type AuthClaims struct {
	UserID   uint   `json:"uid"`
	Username string `json:"uname"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// NewAuthService 创建认证服务实例
func NewAuthService(userRepo *repository.AdminUserRepository, cfg config.SecurityConfig) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

// ChangePassword 修改用户密码
// 业务流程：查找用户 → 校验旧密码 → 校验新密码一致性 → 加密 → 更新
func (s *AuthService) ChangePassword(ctx context.Context, userID uint, oldPassword, newPassword, confirmPassword string) error {
	// 校验新密码与确认密码是否一致
	if newPassword != confirmPassword {
		return fmt.Errorf("新密码与确认密码不一致")
	}

	// 查找用户
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("find user by id: %w", err)
	}
	if user == nil {
		return ErrInvalidCredentials
	}

	// 校验旧密码
	if err := user.CheckPassword(oldPassword); err != nil {
		return ErrInvalidCredentials
	}

	// 密码强度校验
	if err := validatePasswordStrength(newPassword); err != nil {
		return err
	}

	// 生成新密码哈希
	passwordHash, err := model.NewPasswordHash(newPassword)
	if err != nil {
		return fmt.Errorf("hash new password: %w", err)
	}

	// 更新密码
	if err := s.userRepo.UpdatePassword(ctx, userID, passwordHash); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	return nil
}

// ParseToken 解析并验证 JWT Token
func (s *AuthService) ParseToken(tokenString string) (*AuthClaims, error) {
	claims := &AuthClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

// IssueToken 签发 JWT Token
func (s *AuthService) IssueToken(user *model.AdminUser) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.cfg.AccessTokenTTL)

	claims := &AuthClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign jwt token: %w", err)
	}

	return signed, expiresAt, nil
}

// validatePasswordStrength 密码强度校验
// 要求：长度至少6位，必须包含字母和数字
func validatePasswordStrength(password string) error {
	if len(password) < 6 {
		return fmt.Errorf("新密码长度不能少于6位")
	}

	hasLetter := false
	hasDigit := false

	for _, ch := range password {
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') {
			hasLetter = true
		}
		if ch >= '0' && ch <= '9' {
			hasDigit = true
		}
	}

	if !hasLetter || !hasDigit {
		return fmt.Errorf("新密码必须包含字母和数字")
	}

	return nil
}
