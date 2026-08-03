# SACC 后端 API 契约骨架

> [!IMPORTANT]
> `feature/api-contract` 分支只用于固化项目目录、API 路由、请求/响应模型与数据库表结构等项目契约，不用于实际功能开发或生产部署。

当前业务逻辑仅保留接口骨架和中文 `TODO` 实现要求；未实现的接口会返回 `501 Not Implemented`。契约确认后，请从适当的开发分支实现业务功能，不要直接在本分支继续功能开发。

## 目录

- `app/routers/`：按 API 规范组织的路由契约。
- `app/schemas/`：请求和响应数据模型。
- `app/models/`：数据库 ORM 模型。
- `app/services/`：待实现的业务服务边界。
- `alembic/`：数据库迁移骨架。
- `tests/`：路由契约校验。

数据库初始化脚本位于仓库根目录的 `database-scripts/001_init.sql`。
