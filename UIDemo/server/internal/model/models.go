package model

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminUser struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
	Username     string         `gorm:"size:64;uniqueIndex;not null"`
	DisplayName  string         `gorm:"size:128;not null"`
	PasswordHash string         `gorm:"size:255;not null"`
	Role         string         `gorm:"size:64;index;not null"`
	Status       string         `gorm:"size:32;index;not null;default:active"`
}

func (u *AdminUser) CheckPassword(rawPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(rawPassword))
}

func NewPasswordHash(rawPassword string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

type ContentItem struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
	Module      string         `gorm:"size:64;index;not null"`
	Slug        string         `gorm:"size:160;index;not null"`
	Title       string         `gorm:"size:255;not null"`
	Category    string         `gorm:"size:64;index"`
	Summary     string         `gorm:"type:text"`
	Body        string         `gorm:"type:longtext"`
	Tags        string         `gorm:"size:1024"`
	Status      string         `gorm:"size:32;index;not null;default:draft"`
	Author      string         `gorm:"size:128;index"`
	Role        string         `gorm:"size:64"`
	RepoURL     string         `gorm:"size:512"`
	Progress    string         `gorm:"size:20"`
	TechStack   string         `gorm:"size:1024"`
	SortOrder   int            `gorm:"default:0"`
	Views       int            `gorm:"default:0"`
	PublishedAt *time.Time
}

type AuditLog struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`
	ActorID   uint      `gorm:"index"`
	ActorName string    `gorm:"size:128"`
	Action    string    `gorm:"size:128;index"`
	Resource  string    `gorm:"size:128;index"`
	Detail    string    `gorm:"type:text"`
	RequestID string    `gorm:"size:128;index"`
	IP        string    `gorm:"size:64"`
}
