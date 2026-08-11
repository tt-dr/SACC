"""
应用配置模块。
"""

# JWT 密钥 —— 生产环境应从环境变量或密钥管理服务中读取
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

# 审计日志默认 / 最大返回条数
AUDIT_LOG_DEFAULT_LIMIT = 12
AUDIT_LOG_MAX_LIMIT = 50
