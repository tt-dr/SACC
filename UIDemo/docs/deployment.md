# 部署指南

这份指南对应当前仓库的真实状态：`docker compose` 会同时启动官网前台、管理后台、Gin API、MySQL、Redis、Nginx。

## 访问路径

- `/`
  官网前台
- `/admin/`
  管理后台
- `/api/`
  后端接口
- `/healthz`
  存活检查
- `/readyz`
  就绪检查

## 1. 服务器准备

建议系统：Ubuntu 22.04+

安装基础环境：

```bash
sudo apt update
sudo apt install -y git curl docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

检查：

```bash
docker version
docker compose version
```

## 2. 域名解析

把你的域名解析到公网 IP：

```text
sacchome.ttdr.top.ttdr.top -> 123.56.221.147
```

如果你后续改成别的正式域名，也要同步修改 [nginx.conf](/d:/SACC/SACC_Woc/Front_UI/SACC.com/deploy/nginx/nginx.conf) 里的 `server_name`。

## 3. 拉取代码

```bash
git clone <你的仓库地址> SACC.com
cd SACC.com
```

## 4. 配置环境变量

```bash
cp .env.example .env
nano .env
```

至少要改这些值：

- `JWT_SECRET`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `SEED_ADMIN_PASSWORD`
- `CORS_ALLOWED_ORIGINS`

推荐这样填：

```env
APP_ENV=production
JWT_SECRET=换成至少32位随机字符串
MYSQL_PASSWORD=换成强密码
MYSQL_ROOT_PASSWORD=换成更强密码
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=首次后台登录密码
CORS_ALLOWED_ORIGINS=https://sacchome.ttdr.top.ttdr.top
VITE_API_BASE_URL=
```

说明：

- `VITE_API_BASE_URL=` 留空即可。
- 当前生产部署走同域方案，前台、后台都会直接访问同域 `/api`。

## 5. 首次启动

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

查看状态：

```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api
```

## 6. 启动后验证

验证网关：

```bash
curl http://127.0.0.1/healthz
curl http://127.0.0.1/readyz
```

验证 API：

```bash
curl http://127.0.0.1/api/v1/public/bootstrap
```

浏览器访问：

- `http://123.56.221.147/`
- `http://123.56.221.147/admin/`

如果域名已生效，也可以直接访问：

- `http://sacchome.ttdr.top.ttdr.top/`
- `http://sacchome.ttdr.top.ttdr.top/admin/`

## 7. 管理后台登录

当前后台登录会走后端接口，不再使用前端明文账号密码。

默认管理员来自种子数据：

- 用户名：`.env` 里的 `SEED_ADMIN_USERNAME`
- 密码：`.env` 里的 `SEED_ADMIN_PASSWORD`

登录地址：

- `/admin/login`

## 8. 常用命令

重启：

```bash
docker compose -f deploy/docker-compose.yml restart
```

更新代码并重建：

```bash
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

停止：

```bash
docker compose -f deploy/docker-compose.yml down
```

连数据库：

```bash
docker compose -f deploy/docker-compose.yml exec mysql mysql -usacc -p
```

## 9. 现在还没做的生产项

- HTTPS/SSL 证书自动化
- 正式文件上传与对象存储
- 更完整的 RBAC 权限矩阵
- SQL 迁移版本管理
- 监控、告警、备份策略

## 10. 常见问题

### 1) 浏览器能打开 `/`，但 `/admin/` 白屏

先确认：

```bash
docker compose -f deploy/docker-compose.yml logs nginx
```

并确认你没有手动改坏 `sacc-admin` 的 `basename` 或 Vite `base` 配置。

### 2) 登录后台时报“服务端不可用”

先看 API：

```bash
docker compose -f deploy/docker-compose.yml logs api
curl http://127.0.0.1/api/v1/public/bootstrap
```

通常是：

- `JWT_SECRET` 没配
- MySQL/Redis 没起来
- `api` 容器未成功启动

### 3) Docker 构建失败

先确认服务器上的 Docker daemon 是启动状态：

```bash
sudo systemctl status docker
```

如果是在本机 Windows 上遇到 `dockerDesktopLinuxEngine` 不存在，那是本机 Docker Desktop 没启动，不是仓库配置错误。
