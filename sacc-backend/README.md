# SACC FastAPI 后端

本分支在 API 契约骨架上实现了管理端内容管理和阿里云 OSS 图片上传：

- 管理端内容列表、创建、更新和软删除；
- `docs`、`projects` 内容排序；
- JPG、PNG、GIF、WEBP 图片校验及阿里云 OSS 上传；
- 统一错误响应 `{ code, message, data }`，其中 HTTP 状态码始终与 `code` 一致。

登录、当前用户和密码接口仍保留在契约 TODO 范围内，本分支不实现这些接口。

## 本地运行

```bash
cp .env.example .env
uv venv --python 3.11 --seed .venv
uv pip install --python .venv/bin/python -r requirements.txt
source .venv/bin/activate
uvicorn app.main:app --reload
```

## OSS 配置

上传接口要求配置 `OSS_ENDPOINT`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 和 `OSS_BUCKET_NAME`。公共读 Bucket 建议配置 `OSS_PUBLIC_BASE_URL`；未配置时接口返回有效期一小时的临时签名 URL。

生产环境应使用仅具备目标 Bucket 必要读写权限的 RAM 用户，不要提交真实 AccessKey。

## 验证

```bash
python -m compileall app tests
pytest -q
```
