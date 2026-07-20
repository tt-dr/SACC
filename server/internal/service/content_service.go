package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"
)

var ErrInvalidContentInput = errors.New("invalid content input")

type ContentService struct {
	repo *repository.ContentRepository
}

type UpsertContentInput struct {
	ID          uint
	Module      string
	Slug        string
	Title       string
	Category    string
	Summary     string
	Body        string
	Tags        []string
	Status      string
	Author      string
	Role        string
	RepoURL     string
	Progress    string
	TechStack   []string
	SortOrder   int
	PublishedAt *time.Time
}

func NewContentService(repo *repository.ContentRepository) *ContentService {
	return &ContentService{repo: repo}
}

func (s *ContentService) List(ctx context.Context, filter repository.ContentFilter) ([]model.ContentItem, int64, error) {
	return s.repo.List(ctx, filter)
}

func (s *ContentService) GetByID(ctx context.Context, id uint) (*model.ContentItem, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ContentService) Upsert(ctx context.Context, input UpsertContentInput) (*model.ContentItem, error) {
	if strings.TrimSpace(input.Module) == "" || strings.TrimSpace(input.Title) == "" {
		return nil, ErrInvalidContentInput
	}

	status := strings.TrimSpace(strings.ToLower(input.Status))
	if status == "" {
		status = "draft"
	}
	if status != "draft" && status != "published" && status != "archived" {
		return nil, ErrInvalidContentInput
	}

	tags := make([]string, 0, len(input.Tags))
	for _, tag := range input.Tags {
		value := strings.TrimSpace(tag)
		if value != "" {
			tags = append(tags, value)
		}
	}
	techStack := make([]string, 0, len(input.TechStack))
	for _, ts := range input.TechStack {
		value := strings.TrimSpace(ts)
		if value != "" {
			techStack = append(techStack, value)
		}
	}

	if input.ID == 0 {
		item := &model.ContentItem{
			Module:      strings.TrimSpace(input.Module),
			Slug:        strings.TrimSpace(input.Slug),
			Title:       strings.TrimSpace(input.Title),
			Category:    strings.TrimSpace(input.Category),
			Summary:     strings.TrimSpace(input.Summary),
			Body:        input.Body,
			Tags:        strings.Join(tags, ","),
			TechStack:   strings.Join(techStack, ","),
			Status:      status,
			Author:      strings.TrimSpace(input.Author),
			Role:        strings.TrimSpace(input.Role),
			RepoURL:     strings.TrimSpace(input.RepoURL),
			Progress:    strings.TrimSpace(input.Progress),
			SortOrder:   input.SortOrder,
			PublishedAt: input.PublishedAt,
		}
		if item.Slug == "" {
			item.Slug = buildSlug(item.Title)
		}
		if err := s.repo.Create(ctx, item); err != nil {
			return nil, fmt.Errorf("create content item: %w", err)
		}
		return item, nil
	}

	existing, err := s.repo.GetByID(ctx, input.ID)
	if err != nil {
		return nil, fmt.Errorf("load content item before update: %w", err)
	}
	if existing == nil {
		return nil, ErrInvalidContentInput
	}

	existing.Module = strings.TrimSpace(input.Module)
	existing.Slug = strings.TrimSpace(input.Slug)
	if existing.Slug == "" {
		existing.Slug = buildSlug(input.Title)
	}
	existing.Title = strings.TrimSpace(input.Title)
	existing.Category = strings.TrimSpace(input.Category)
	existing.Summary = strings.TrimSpace(input.Summary)
	existing.Body = input.Body
	existing.Tags = strings.Join(tags, ",")
	existing.TechStack = strings.Join(techStack, ",")
	existing.Status = status
	existing.Author = strings.TrimSpace(input.Author)
	existing.Role = strings.TrimSpace(input.Role)
	existing.RepoURL = strings.TrimSpace(input.RepoURL)
	existing.Progress = strings.TrimSpace(input.Progress)
	existing.SortOrder = input.SortOrder
	existing.PublishedAt = input.PublishedAt

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("update content item: %w", err)
	}

	return existing, nil
}

func ParseTags(tags string) []string {
	if strings.TrimSpace(tags) == "" {
		return []string{}
	}
	chunks := strings.Split(tags, ",")
	result := make([]string, 0, len(chunks))
	for _, chunk := range chunks {
		value := strings.TrimSpace(chunk)
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}

func buildSlug(input string) string {
	raw := strings.ToLower(strings.TrimSpace(input))
	raw = strings.ReplaceAll(raw, " ", "-")
	raw = strings.ReplaceAll(raw, "_", "-")
	raw = strings.ReplaceAll(raw, "--", "-")
	if raw == "" {
		return "untitled"
	}
	return raw
}
