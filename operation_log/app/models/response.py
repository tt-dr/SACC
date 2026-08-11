"""
统一响应格式。

与 SACC 项目 api-doc.json 及现有 Go handler 约定对齐：
- 成功响应：{"data": <payload>}
- 失败响应：{"message": "<error description>"}

不包含 code 字段 —— 该项目所有 OpenAPI schema（AuditLogResponse、
LoginResponse、MeResponse 等）均仅使用 data 属性包装。
"""
