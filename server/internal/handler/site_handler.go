package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type SiteHandler struct{}

func NewSiteHandler() *SiteHandler {
	return &SiteHandler{}
}

func (h *SiteHandler) Bootstrap(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"site": gin.H{
				"name":      "SACC",
				"fullName":  "Science Association of Computer College",
				"tagline":   "探索科学之美，创造技术未来，成就卓越人生",
				"domain":    "sacchome.ttdr.top.ttdr.top",
				"publicIp":  "123.56.221.147",
				"email":     "hello@sacchome.ttdr.top.ttdr.top",
				"logoUrl":   "/image.png",
			},
		},
	})
}
