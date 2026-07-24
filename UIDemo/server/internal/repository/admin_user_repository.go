package repository

import (
	"context"
	"errors"

	"sacc.com/server/internal/model"

	"gorm.io/gorm"
)

type AdminUserRepository struct {
	db *gorm.DB
}

func NewAdminUserRepository(db *gorm.DB) *AdminUserRepository {
	return &AdminUserRepository{db: db}
}

func (r *AdminUserRepository) FindByUsername(ctx context.Context, username string) (*model.AdminUser, error) {
	var user model.AdminUser
	err := r.db.WithContext(ctx).Where("username = ? AND status = ?", username, "active").First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AdminUserRepository) Create(ctx context.Context, user *model.AdminUser) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *AdminUserRepository) FindByID(ctx context.Context, id uint) (*model.AdminUser, error) {
	var user model.AdminUser
	err := r.db.WithContext(ctx).Where("id = ? AND status = ?", id, "active").First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AdminUserRepository) UpdatePassword(ctx context.Context, id uint, passwordHash string) error {
	return r.db.WithContext(ctx).Model(&model.AdminUser{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

func (r *AdminUserRepository) List(ctx context.Context) ([]model.AdminUser, error) {
	var users []model.AdminUser
	err := r.db.WithContext(ctx).Order("id ASC").Find(&users).Error
	return users, err
}

func (r *AdminUserRepository) Update(ctx context.Context, user *model.AdminUser) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *AdminUserRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&model.AdminUser{}).Where("id = ?", id).Update("status", "disabled").Error
}
