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

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthService struct {
	userRepo *repository.AdminUserRepository
	cfg      config.SecurityConfig
}

type LoginResult struct {
	Token       string `json:"token"`
	ExpiresIn   int64  `json:"expiresIn"`
	UserID      uint   `json:"userId"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
}

type AuthClaims struct {
	UserID   uint   `json:"uid"`
	Username string `json:"uname"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthService(userRepo *repository.AdminUserRepository, cfg config.SecurityConfig) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("find user by username: %w", err)
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	if err := user.CheckPassword(password); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, expiresAt, err := s.issueToken(user)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		Token:       token,
		ExpiresIn:   int64(time.Until(expiresAt).Seconds()),
		UserID:      user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Role:        user.Role,
	}, nil
}

func (s *AuthService) ChangePassword(ctx context.Context, userID uint, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("find user by id: %w", err)
	}
	if user == nil {
		return ErrInvalidCredentials
	}

	if err := user.CheckPassword(oldPassword); err != nil {
		return ErrInvalidCredentials
	}

	passwordHash, err := model.NewPasswordHash(newPassword)
	if err != nil {
		return fmt.Errorf("hash new password: %w", err)
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, passwordHash); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	return nil
}

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

func (s *AuthService) issueToken(user *model.AdminUser) (string, time.Time, error) {
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
