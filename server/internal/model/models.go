package model

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminUser 管理员用户模型
type AdminUser struct {
	ID           uint           `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
	Username     string         `gorm:"size:64;uniqueIndex;not null"`
	DisplayName  string         `gorm:"size:128;not null"`
	PasswordHash string         `gorm:"size:255;not null"`
	Role         string         `gorm:"size:64;index;not null"`
	Status       string         `gorm:"size:32;index;not null;default:active"`
}

// CheckPassword 校验密码是否匹配
func (u *AdminUser) CheckPassword(rawPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(rawPassword))
}

// NewPasswordHash 生成 bcrypt 密码哈希
func NewPasswordHash(rawPassword string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}
