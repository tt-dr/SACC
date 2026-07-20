package repository

import (
	"context"
	"errors"
	"strings"

	"sacc.com/server/internal/model"

	"gorm.io/gorm"
)

type ContentFilter struct {
	Module   string
	Status   string
	Keyword  string
	Page     int
	PageSize int
}

type ContentRepository struct {
	db *gorm.DB
}

func NewContentRepository(db *gorm.DB) *ContentRepository {
	return &ContentRepository{db: db}
}

func (r *ContentRepository) List(ctx context.Context, filter ContentFilter) ([]model.ContentItem, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.ContentItem{})

	if filter.Module != "" {
		query = query.Where("module = ?", filter.Module)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Keyword != "" {
		keyword := "%" + strings.TrimSpace(filter.Keyword) + "%"
		query = query.Where("(title LIKE ? OR summary LIKE ? OR author LIKE ?)", keyword, keyword, keyword)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := max(filter.Page, 1)
	pageSize := clamp(filter.PageSize, 1, 100)
	offset := (page - 1) * pageSize

	items := make([]model.ContentItem, 0, pageSize)
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *ContentRepository) GetByID(ctx context.Context, id uint) (*model.ContentItem, error) {
	var item model.ContentItem
	err := r.db.WithContext(ctx).First(&item, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *ContentRepository) Create(ctx context.Context, item *model.ContentItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *ContentRepository) Update(ctx context.Context, item *model.ContentItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func clamp(value, minValue, maxValue int) int {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}
