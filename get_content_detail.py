"""
获取单条内容详情 — HTTP 客户端
===================================
"Vibe Coding" 风格：代码如呼吸般自然，每一步都清晰可读。

API 接口 (来源: UIDemo/api-doc.json, OpenAPI 3.0.3)
-----------------------------------------------------
- 方法   : GET
- 路径   : /api/v1/content/{id}
- 标签   : 公开接口 - 内容（无需认证）
- 说明   : 根据 ID 获取单条内容的完整信息，包含 Markdown 正文 body。
           仅返回 status=published 的内容。

服务地址
--------
- 生产环境 : http://sacchome.ttdr.top.ttdr.top    (Nginx → Go :8080)
- 直连备选 : http://123.56.221.147:8080

用法
----
    python get_content_detail.py <content_id>

示例
----
    python get_content_detail.py 123
    python get_content_detail.py 1
"""

import sys
import json
import time
from http import HTTPStatus
from urllib.parse import urljoin

import requests

# ---------------------------------------------------------------------------
# 配置 — 所有可变参数集中于此，方便维护
# ---------------------------------------------------------------------------

# 主地址：经 Nginx 反代到 Gin 后端（无端口号）
BASE_URL = "http://sacchome.ttdr.top.ttdr.top"
# 备选地址：直连后端（Nginx 不可用时使用）
FALLBACK_BASE_URL = "http://123.56.221.147:8080"

ENDPOINT = "/api/v1/content/{id}"       # OpenAPI 确认的公开接口
TIMEOUT = (5, 15)                       # (连接超时, 读取超时) 秒
RETRY_COUNT = 2                         # 可重试错误的额外尝试次数
RETRY_BACKOFF = 1.0                     # 指数退避基数（秒）


# ---------------------------------------------------------------------------
# 核心函数
# ---------------------------------------------------------------------------

def build_urls(content_id: int) -> list[str]:
    """按优先级返回候选请求 URL 列表。"""
    path = ENDPOINT.format(id=content_id)
    return [
        urljoin(BASE_URL, path),
        urljoin(FALLBACK_BASE_URL, path),
    ]


def fetch_content_detail(content_id: int) -> dict | None:
    """
    调用 GET /api/v1/content/{id} 获取单条内容详情。

    返回值
    -------
    - 成功时返回解析后的 JSON 数据（dict）
    - 所有异常情况打印诊断信息并返回 None

    异常处理策略
    ------------
    1. 网络层错误（连接超时、DNS 失败等）→ 自动换备选地址 + 重试
    2. HTTP 4xx 客户端错误            → 打印详情，不重试
    3. HTTP 5xx 服务端错误            → 自动重试
    4. JSON 解析失败                  → 打印原始响应片段
    """
    urls = build_urls(content_id)
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "User-Agent": "SACC-ContentClient/1.0",
    })

    last_exception: Exception | None = None

    # 遍历所有候选 URL，每个 URL 最多重试 RETRY_COUNT 次
    for url_index, url in enumerate(urls):
        print(f"→ 目标: {url}")
        for attempt in range(1 + RETRY_COUNT):
            try:
                print(f"  尝试 [{content_id}] (第 {attempt + 1} 次)")
                response = session.get(url, timeout=TIMEOUT)

                # ---------- 打印响应摘要 ----------
                print_response_summary(response)

                # ---------- 200 OK ----------
                if response.status_code == HTTPStatus.OK:
                    try:
                        body = response.json()
                    except json.JSONDecodeError as je:
                        print(f"✕ 响应体不是合法 JSON: {je}")
                        print(f"  原始内容(前500字符): {response.text[:500]}")
                        return None

                    # 兼容两种响应格式：
                    #   A) { data: ContentItem }                    ← OpenAPI 定义
                    #   B) { code: 200, message: "ok", data: ... }  ← 业务包装
                    code = body.get("code")
                    if code is None or code == 200:
                        print("✓ 请求成功")
                        return body
                    else:
                        print(f"⚠ 业务状态码异常: code={code}, "
                              f"message={body.get('message', 'N/A')}")
                        return body  # 返回给调用方自行决策

                # ---------- 400 — ID 格式错误 ----------
                elif response.status_code == HTTPStatus.BAD_REQUEST:
                    print("✕ 400 Bad Request — 内容 ID 格式错误")
                    _print_response_body(response)
                    return None

                # ---------- 404 — 内容不存在 ----------
                elif response.status_code == HTTPStatus.NOT_FOUND:
                    print("✕ 404 Not Found — 内容不存在或未发布")
                    _print_response_body(response)
                    return None

                # ---------- 5xx — 服务端异常，可重试 ----------
                elif 500 <= response.status_code < 600:
                    print(f"⚠ {response.status_code} Server Error — 准备重试...")
                    last_exception = RuntimeError(
                        f"Server returned {response.status_code}: {response.text[:200]}"
                    )
                    # 落到末尾的重试逻辑

                # ---------- 其他未预期状态码 ----------
                else:
                    print(f"⚠ 未预期的状态码: {response.status_code}")
                    _print_response_body(response)
                    return None

            except requests.exceptions.Timeout as e:
                last_exception = e
                print(f"⚠ 请求超时: {e}")

            except requests.exceptions.ConnectionError as e:
                last_exception = e
                print(f"⚠ 连接失败: {e}")

            except requests.exceptions.RequestException as e:
                # SSLError、TooManyRedirects 等不可重试异常
                print(f"✕ 网络请求异常: {e}")
                # 如果是 SSL 错误但用的是 https，提示用户
                if "SSL" in str(e) and url.startswith("https"):
                    print("  💡 提示: 尝试使用 http:// 协议")
                return None

            # ---------- 重试等待（仅当还有剩余尝试次数时）----------
            if attempt < RETRY_COUNT:
                wait = RETRY_BACKOFF * (2 ** attempt)
                print(f"  ⏳ {wait:.1f}s 后重试...")
                time.sleep(wait)

        # 当前 URL 所有重试均失败，尝试下一个 URL
        print(f"  ↳ 放弃 {url}，尝试备选地址...")

    # 所有 URL 均失败
    print(f"✕ 请求失败，已用尽所有地址和 {1 + RETRY_COUNT} 次尝试")
    if last_exception:
        print(f"  最后错误: {last_exception}")
    return None


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

def print_response_summary(response: requests.Response) -> None:
    """打印响应的状态行和关键响应头。"""
    print(f"    ← HTTP {response.status_code} {response.reason}")
    print(f"       Content-Type  : {response.headers.get('Content-Type', 'N/A')}")
    print(f"       Content-Length: {response.headers.get('Content-Length', 'N/A')}")


def _print_response_body(response: requests.Response) -> None:
    """安全地打印响应体（自动识别 JSON 或纯文本，长内容截断）。"""
    try:
        body = response.json()
        print(f"  响应体: {json.dumps(body, ensure_ascii=False, indent=2)}")
    except json.JSONDecodeError:
        text = response.text
        if len(text) > 500:
            text = text[:500] + f"\n  ... (截断，共 {len(response.text)} 字符)"
        print(f"  响应体(原文): {text}")


def pretty_print(data: dict) -> None:
    """
    以人类可读的卡片形式呈现内容详情。

    兼容两种响应格式：
      - 直接格式: { "data": { "id": 1, "title": "...", ... } }
      - 包装格式: { "code": 200, "message": "ok", "data": { ... } }
    """
    # 提取 data 字段 — 如果响应中直接就是 ContentItem（无外层包装），也能处理
    item = data.get("data") if isinstance(data.get("data"), dict) else data
    if not item or not isinstance(item, dict):
        print("响应中无可解析的内容数据")
        return

    print("\n" + "=" * 56)
    print("   📄 内容详情")
    print("=" * 56)

    # 基本信息
    rows = [
        ("ID",       item.get("id")),
        ("模块",     item.get("module")),
        ("Slug",     item.get("slug")),
        ("标题",     item.get("title")),
        ("摘要",     item.get("summary")),
        ("分类",     item.get("category")),
        ("状态",     item.get("status")),
        ("作者",     item.get("author")),
        ("排序权重", item.get("sortOrder")),
        ("发表日期", item.get("publishedAt")),
        ("创建时间", item.get("createdAt")),
        ("更新时间", item.get("updatedAt")),
    ]
    for label, value in rows:
        print(f"  {label:　<8}: {value if value is not None else 'N/A'}")

    # 标签列表
    tags = item.get("tags") or []
    if tags:
        print(f"  标签     : {', '.join(tags)}")

    # 正文预览（body 仅在详情接口返回，列表接口不含此字段）
    body_md = item.get("body", "")
    if body_md:
        preview = body_md[:200] + ("..." if len(body_md) > 200 else "")
        print(f"  ── 正文预览 (Markdown) ──")
        print(f"  {preview}")

    # 仓库链接（projects 模块专属）
    repo = item.get("repoUrl", "")
    if repo:
        print(f"  ── 仓库链接 ──")
        print(f"  {repo}")

    # 作者头像
    avatar = item.get("authorAvatar", "")
    if avatar:
        print(f"  作者头像 : {avatar}")

    print("=" * 56 + "\n")


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------

def main() -> None:
    # 解析命令行参数
    if len(sys.argv) != 2:
        print("用法: python get_content_detail.py <content_id>")
        print("示例: python get_content_detail.py 123")
        sys.exit(1)

    raw_id = sys.argv[1]

    # 验证 ID 格式 — 必须为正整数（API schema 要求 integer 类型）
    try:
        content_id = int(raw_id)
    except ValueError:
        print(f"✕ 错误: 内容 ID 必须是整数，收到了 '{raw_id}'")
        sys.exit(1)

    if content_id <= 0:
        print(f"✕ 错误: 内容 ID 必须为正整数，收到了 {content_id}")
        sys.exit(1)

    # 发起请求
    result = fetch_content_detail(content_id)

    if result is None:
        print("\n请求未成功，无法获取内容详情。")
        sys.exit(1)

    # 打印完整原始 JSON 响应（满足"输出完整响应内容"的要求）
    print("\n── 原始 JSON 响应 ──")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 业务成功时用友好格式展示
    code = result.get("code")
    if code is None or code == 200:
        pretty_print(result)
    else:
        print(f"\n⚠ 业务状态码: {code}, 消息: {result.get('message', 'N/A')}")


if __name__ == "__main__":
    main()
