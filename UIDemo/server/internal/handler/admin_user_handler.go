package handler

import (
	"errors"
	"net/http"
	"strconv"

	"sacc.com/server/internal/service"

	"github.com/gin-gonic/gin"
)

type AdminUserHandler struct {
	userService *service.AdminUserService
}

type CreateUserRequest struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Role        string `json:"role"`
}

type UpdateUserRequest struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Role        string `json:"role"`
}

func NewAdminUserHandler(userService *service.AdminUserService) *AdminUserHandler {
	return &AdminUserHandler{userService: userService}
}

func (h *AdminUserHandler) List(c *gin.Context) {
	users, err := h.userService.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to fetch users"})
		return
	}

	payload := make([]gin.H, 0, len(users))
	for _, u := range users {
		payload = append(payload, gin.H{
			"id":          u.ID,
			"username":    u.Username,
			"displayName": u.DisplayName,
			"role":        u.Role,
			"status":      u.Status,
			"createdAt":   u.CreatedAt.UTC().String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": payload})
}

func (h *AdminUserHandler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	user, err := h.userService.Create(c.Request.Context(), service.CreateUserInput{
		Username:    req.Username,
		DisplayName: req.DisplayName,
		Password:    req.Password,
		Role:        req.Role,
	})
	if err != nil {
		status := http.StatusBadRequest
		if !errors.Is(err, service.ErrInvalidUserInput) {
			status = http.StatusInternalServerError
		}
		c.JSON(status, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"displayName": user.DisplayName,
			"role":        user.Role,
			"status":      user.Status,
			"createdAt":   user.CreatedAt.UTC().String(),
		},
	})
}

func (h *AdminUserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request payload"})
		return
	}

	user, err := h.userService.Update(c.Request.Context(), service.UpdateUserInput{
		ID:          uint(id),
		Username:    req.Username,
		DisplayName: req.DisplayName,
		Password:    req.Password,
		Role:        req.Role,
	})
	if err != nil {
		status := http.StatusBadRequest
		if !errors.Is(err, service.ErrInvalidUserInput) {
			status = http.StatusInternalServerError
		}
		c.JSON(status, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"displayName": user.DisplayName,
			"role":        user.Role,
			"status":      user.Status,
		},
	})
}

func (h *AdminUserHandler) Disable(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	if err := h.userService.Disable(c.Request.Context(), uint(id)); err != nil {
		status := http.StatusBadRequest
		if !errors.Is(err, service.ErrInvalidUserInput) {
			status = http.StatusInternalServerError
		}
		c.JSON(status, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user disabled"})
}
