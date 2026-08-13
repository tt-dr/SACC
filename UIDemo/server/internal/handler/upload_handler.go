package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	maxUploadSize = 10 << 20 // 10MB
	uploadDir     = "public/images"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "缺少上传文件"})
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"message": "文件过大，最大 10MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"message": "不支持的格式，仅允许 png/jpg/jpeg/gif/webp"})
		return
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(header, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "文件保存失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"url":      fmt.Sprintf("/images/%s", filename),
			"filename": filename,
			"size":     header.Size,
			"uploadedAt": time.Now().UTC().Format(time.RFC3339),
		},
	})
}
