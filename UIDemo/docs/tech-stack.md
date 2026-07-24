# 技术栈说明

## 官网前台

- React 19
- Vite 7
- React Router 7
- Lucide React
- Vitest + Testing Library

## 管理端原型

- React 19
- Vite 7
- React Router 7

## 后端

- Go
- Gin
- Gorm
- Redis
- MySQL

## 部署

- Docker Compose
- Nginx

## 设计资产

- `SACC.pen` 作为设计对照源

## 当前原则

1. 设计稿只负责设计对照，不直接作为线上路由和页面运行时数据源。
2. 前台页面优先使用显式组件和稳定数据模型。
3. 内容同步能力通过后端 API 承接，而不是继续散落在前端硬编码里。
