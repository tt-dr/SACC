package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"sacc.com/server/internal/model"
	"sacc.com/server/internal/repository"
	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

type ContentHandler struct {
	contentService *service.ContentService
}

type UpsertContentRequest struct {
	Module      string   `json:"module"`
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Category    string   `json:"category"`
	Summary     string   `json:"summary"`
	Body        string   `json:"body"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status"`
	Author      string   `json:"author"`
	Role        string   `json:"role"`
	RepoURL     string   `json:"repoUrl"`
	Progress    string   `json:"progress"`
	TechStack   []string `json:"techStack"`
	SortOrder   int      `json:"sortOrder"`
	PublishedAt string   `json:"publishedAt"`
}

func NewContentHandler(contentService *service.ContentService) *ContentHandler {
	return &ContentHandler{contentService: contentService}
}

func (h *ContentHandler) List(c *gin.Context) {
	page := parseIntOrDefault(c.Query("page"), 1)
	pageSize := parseIntOrDefault(c.Query("pageSize"), 20)

	filter := repository.ContentFilter{
		Module:   strings.TrimSpace(c.Query("module")),
		Status:   strings.TrimSpace(c.Query("status")),
		Keyword:  strings.TrimSpace(c.Query("keyword")),
		Page:     page,
		PageSize: pageSize,
	}

	items, total, err := h.contentService.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to fetch content list"})
		return
	}

	payload := make([]gin.H, 0, len(items))
	for _, item := range items {
		payload = append(payload, mapContentItem(item))
	}

	c.JSON(http.StatusOK, gin.H{
		"data": payload,
		"pagination": gin.H{
			"page":     page,
			"pageSize": pageSize,
			"total":    total,
		},
	})
}

func (h *ContentHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	item, err := h.contentService.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to fetch content item"})
		return
	}
	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "content not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mapContentItem(*item)})
}

func (h *ContentHandler) Create(c *gin.Context) {
	var req UpsertContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	item, err := h.contentService.Upsert(c.Request.Context(), toUpsertInput(0, req))
	if err != nil {
		status := http.StatusInternalServerError
		if err == service.ErrInvalidContentInput {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"message": "failed to create content item"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": mapContentItem(*item)})
}

func (h *ContentHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var req UpsertContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	item, err := h.contentService.Upsert(c.Request.Context(), toUpsertInput(uint(id), req))
	if err != nil {
		status := http.StatusInternalServerError
		if err == service.ErrInvalidContentInput {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"message": "failed to update content item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mapContentItem(*item)})
}

func toUpsertInput(id uint, req UpsertContentRequest) service.UpsertContentInput {
	var publishedAt *time.Time
	if strings.TrimSpace(req.PublishedAt) != "" {
		if parsed, err := time.Parse(time.RFC3339, req.PublishedAt); err == nil {
			publishedAt = &parsed
		}
	}

	return service.UpsertContentInput{
		ID:          id,
		Module:      req.Module,
		Slug:        req.Slug,
		Title:       req.Title,
		Category:    req.Category,
		Summary:     req.Summary,
		Body:        req.Body,
		Tags:        req.Tags,
		Status:      req.Status,
		Author:      req.Author,
		Role:        req.Role,
		RepoURL:     req.RepoURL,
		Progress:    req.Progress,
		TechStack:   req.TechStack,
		SortOrder:   req.SortOrder,
		PublishedAt: publishedAt,
	}
}

func mapContentItem(item model.ContentItem) gin.H {
	var publishedAt *string
	if item.PublishedAt != nil {
		formatted := item.PublishedAt.UTC().Format(time.RFC3339)
		publishedAt = &formatted
	}

	return gin.H{
		"id":          item.ID,
		"module":      item.Module,
		"slug":        item.Slug,
		"title":       item.Title,
		"category":    item.Category,
		"summary":     item.Summary,
		"body":        item.Body,
		"tags":        service.ParseTags(item.Tags),
		"status":      item.Status,
		"author":      item.Author,
		"role":        item.Role,
		"repoUrl":     item.RepoURL,
		"progress":    item.Progress,
		"techStack":   service.ParseTags(item.TechStack),
		"sortOrder":   item.SortOrder,
		"views":       item.Views,
		"publishedAt": publishedAt,
		"createdAt":   item.CreatedAt.UTC().Format(time.RFC3339),
		"updatedAt":   item.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func parseIntOrDefault(raw string, fallback int) int {
	if strings.TrimSpace(raw) == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}
