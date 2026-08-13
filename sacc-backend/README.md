# SACC FastAPI 后端

> [!IMPORTANT]
> `feature/api-contract` 分支只用于固化项目目录、API 路由、请求/响应模型与数据库表结构等项目契约，不用于实际功能开发或生产部署。

已实现就绪检查、站点完整配置、管理员登录、用户软禁用、仪表盘统计，以及管理端内容管理和阿里云 OSS 图片上传。其余保留中文 `TODO` 的接口仍返回 `501 Not Implemented`。

## 目录

- `app/routers/`：按 API 规范组织的路由契约。
- `app/schemas/`：请求和响应数据模型。
- `app/models/`：数据库 ORM 模型。
- `app/services/`：待实现的业务服务边界。
- `alembic/`：数据库迁移骨架。
- `tests/`：路由契约校验。

数据库初始化脚本位于仓库根目录的 `database-scripts/001_init.sql`。

## 同步站点配置

前端 `fallbackSiteContent` 变更后，从 `sacc-backend/` 目录运行：

```powershell
node --experimental-strip-types scripts/export_site_content.mjs
```
