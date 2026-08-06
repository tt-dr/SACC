package repository

import (
	"context"
	"errors"

	"sacc.com/server/internal/model"

	"gorm.io/gorm"
)

// AdminUserRepository 管理员用户数据访问层
type AdminUserRepository struct {
	db *gorm.DB
}

// NewAdminUserRepository 创建 AdminUserRepository 实例
func NewAdminUserRepository(db *gorm.DB) *AdminUserRepository {
	return &AdminUserRepository{db: db}
}

// FindByID 根据 ID 查找有效用户
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

// FindByUsername 根据用户名查找有效用户
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

// UpdatePassword 更新用户密码哈希
func (r *AdminUserRepository) UpdatePassword(ctx context.Context, id uint, passwordHash string) error {
	return r.db.WithContext(ctx).Model(&model.AdminUser{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}
