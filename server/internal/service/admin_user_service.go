package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"
)

var ErrInvalidUserInput = errors.New("invalid user input")

type AdminUserService struct {
	repo *repository.AdminUserRepository
}

type CreateUserInput struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Role        string `json:"role"`
}

type UpdateUserInput struct {
	ID          uint
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Role        string `json:"role"`
}

func NewAdminUserService(repo *repository.AdminUserRepository) *AdminUserService {
	return &AdminUserService{repo: repo}
}

func (s *AdminUserService) List(ctx context.Context) ([]model.AdminUser, error) {
	return s.repo.List(ctx)
}

func (s *AdminUserService) Create(ctx context.Context, input CreateUserInput) (*model.AdminUser, error) {
	username := strings.TrimSpace(input.Username)
	if username == "" {
		return nil, fmt.Errorf("%w: username required", ErrInvalidUserInput)
	}
	role := strings.TrimSpace(input.Role)
	if role != "super_admin" && role != "editor" {
		role = "editor"
	}

	existing, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("check username: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("%w: username already exists", ErrInvalidUserInput)
	}

	passwordHash, err := model.NewPasswordHash(input.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &model.AdminUser{
		Username:     username,
		DisplayName:  strings.TrimSpace(input.DisplayName),
		PasswordHash: passwordHash,
		Role:         role,
		Status:       "active",
	}

	if user.DisplayName == "" {
		user.DisplayName = username
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return user, nil
}

func (s *AdminUserService) Update(ctx context.Context, input UpdateUserInput) (*model.AdminUser, error) {
	user, err := s.repo.FindByID(ctx, input.ID)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("%w: user not found", ErrInvalidUserInput)
	}

	if username := strings.TrimSpace(input.Username); username != "" && username != user.Username {
		existing, err := s.repo.FindByUsername(ctx, username)
		if err != nil {
			return nil, fmt.Errorf("check username: %w", err)
		}
		if existing != nil && existing.ID != user.ID {
			return nil, fmt.Errorf("%w: username already exists", ErrInvalidUserInput)
		}
		user.Username = username
	}

	if displayName := strings.TrimSpace(input.DisplayName); displayName != "" {
		user.DisplayName = displayName
	}

	if input.Password != "" {
		passwordHash, err := model.NewPasswordHash(input.Password)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}
		user.PasswordHash = passwordHash
	}

	if role := strings.TrimSpace(input.Role); role == "super_admin" || role == "editor" {
		user.Role = role
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}

	return user, nil
}

func (s *AdminUserService) Disable(ctx context.Context, id uint) error {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("%w: user not found", ErrInvalidUserInput)
	}
	return s.repo.Delete(ctx, id)
}
