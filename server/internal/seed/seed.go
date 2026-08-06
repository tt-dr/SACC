package seed

import (
	"context"
	"log"

	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"

	"gorm.io/gorm"
)

// SeedAdminUser 种子数据：创建默认管理员用户（仅当不存在时）
func SeedAdminUser(db *gorm.DB, username, password, displayName, role string) {
	ctx := context.Background()
	repo := repository.NewAdminUserRepository(db)

	existing, err := repo.FindByUsername(ctx, username)
	if err != nil {
		log.Printf("检查管理员用户失败: %v", err)
		return
	}
	if existing != nil {
		log.Println("管理员用户已存在，跳过种子数据")
		return
	}

	passwordHash, err := model.NewPasswordHash(password)
	if err != nil {
		log.Printf("生成密码哈希失败: %v", err)
		return
	}

	user := &model.AdminUser{
		Username:     username,
		DisplayName:  displayName,
		PasswordHash: passwordHash,
		Role:         role,
		Status:       "active",
	}

	if err := db.Create(user).Error; err != nil {
		log.Printf("创建管理员用户失败: %v", err)
		return
	}

	log.Printf("种子数据：管理员用户 %s 已创建", username)
}
