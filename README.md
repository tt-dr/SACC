# SACC.com

SACC 官网项目已经从“前端读取设计稿运行”升级为一个可继续扩展的全栈工程骨架。

## 当前结构

- `sacc-home/`
  官网前台，React + Vite，已经改为显式路由 + 稳定内容模型，支持从后端 `bootstrap` 接口读取站点配置，并在接口不可用时自动回退到本地兜底内容。
- `sacc-admin/`
  现阶段的后台前端原型，保留原有管理页界面，用于后续逐步接入服务端 API。
- `server/`
  Gin + Gorm + Redis + MySQL 的后端骨架，包含配置加载、鉴权、内容 CRUD、健康检查、中间件和种子数据。
- `deploy/`
  Docker Compose、API Dockerfile、Nginx 反向代理配置。
- `docs/`
  设计对照审计、技术栈说明和项目说明。

## 已完成的关键修正

1. 官网不再运行时依赖 `SACC.pen` 解析路由和交互。
2. 首页、关于、活动、项目、团队、动态、相册、FAQ、加入我们均改成显式组件页面。
3. 官网前台已经接入 API 预留口：`VITE_API_BASE_URL + /api/v1/public/bootstrap`。
4. 后端补齐 Gin + Gorm + Redis + MySQL 基础能力，并通过本地构建验证。
5. 文档和部署配置补齐，便于后续上线到 `sacchome.ttdr.top.ttdr.top` / `123.56.221.147`。

## 本地启动

### 官网前台

```bash
cd sacc-home
npm install
npm run dev
```

### 管理端

```bash
cd sacc-admin
npm install
npm run dev
```

### 后端 API

```bash
cp .env.example .env
cd server
go run ./cmd/api
```

### 生产部署

```bash
cp .env.example .env
docker compose -f deploy/docker-compose.yml up -d --build
```

启动后：

- `/` 为官网前台
- `/admin/` 为管理后台
- `/api/` 为后端 API
- `/healthz` 与 `/readyz` 为健康检查

## 验证结果

- `cd sacc-home && npm test`
- `cd sacc-home && npm run build`
- `cd sacc-admin && npm run build`
- `cd server && go test ./...`
- `cd server && go build ./cmd/api`
- `docker compose -f deploy/docker-compose.yml config`

更完整的上线说明见 [deployment.md](/d:/SACC/SACC_Woc/Front_UI/SACC.com/docs/deployment.md)。

## 下一步建议

- 把 `sacc-admin` 从 `localStorage` 原型逐步切换到 `server/` 提供的鉴权和内容接口。
- 补正式 RBAC、刷新令牌、审计日志写入链路和 SQL 迁移版本管理。
- 将设计资源迁移到独立 `design/` 目录，进一步收敛根目录结构。
