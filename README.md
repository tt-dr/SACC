# SACC Backend

南京邮电大学计算机学院科协官网的 FastAPI 后端骨架。目录分层依据 `飞书.md`，接口路径、HTTP 方法、参数和主要 Schema 以 Apifox `SACC API v1.0.0` 为准。

当前阶段只搭设架构：所有业务路由均已注册，但处理函数会返回 `501 Not Implemented`。每个处理函数及 `services/`、`utils/` 中都保留了具体实现要求的 `TODO`。

## 规范差异

飞书策划案与 Apifox 存在冲突时采用 Apifox：

- 健康检查为 `GET /healthz` 和 `GET /readyz`。
- 内容排序为 `PUT /api/v1/admin/content/reorder`。
- 同时包含 Apifox 中的 `GET /api/v1/public/members` 和 `POST /api/v1/admin/upload`。
- 成功响应统一使用 `{ code, message, data }` 包络；列表接口的数组位于 `data` 内。
- 修改密码成功后当前 Token 仍然有效，不进行强制撤销。

## 本地运行

```bash
cp .env.example .env
docker compose up --build
```

服务地址为 `http://localhost:8000`，Swagger UI 为 `http://localhost:8000/docs`。MySQL 首次创建数据卷时会自动执行 `database-scripts/001_init.sql`。

不使用 Docker 时：

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload
```

## 数据库

初始化脚本创建 `users`、`content`、`audit_log` 三张核心表，并补充 API 实际需要的成员分组、内容分类、作者关联、封面图和检索索引。脚本不写入默认管理员，避免仓库内出现共享初始密码；认证实现阶段应提供一次性管理员初始化命令。

后续结构变更使用 Alembic：

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## 验证

```bash
pytest
python -m compileall app tests
```
