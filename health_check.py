#!/usr/bin/env python3
"""
存活探测（Health Check）HTTP 客户端
===================================
接口: GET /healthz
Base URL: http://sacchome.ttdr.top.ttdr.top

响应结构（来自 API 文档 — UIDemo/api-doc.json）:
    成功 (200):
        {
            "status": "ok",
            "time": "2026-07-16T12:00:00Z"
        }

    该端点无需认证，不依赖任何外部服务，直接返回服务是否存活。

用法:
    python health_check.py
    python health_check.py --url http://localhost:8080
"""

import argparse
import sys
import json
import requests


# ── 配置 ────────────────────────────────────────────────────────────
DEFAULT_BASE_URL = "http://sacchome.ttdr.top.ttdr.top"   # 默认服务地址
HEALTHZ_PATH = "/healthz"                   # 存活探测路径
REQUEST_TIMEOUT = 10                         # 请求超时（秒）


# ── 状态码 → 语义说明映射 ──────────────────────────────────────────
HTTP_STATUS_LABEL: dict[int, str] = {
    200: "请求成功",
    400: "请求错误",
    401: "未授权",
    403: "禁止访问",
    404: "路径不存在",
    405: "方法不允许",
    408: "请求超时",
    429: "请求过于频繁",
    500: "服务器内部错误",
    502: "网关错误",
    503: "服务暂不可用",
    504: "网关超时",
}


def status_label(http_code: int) -> str:
    """根据 HTTP 状态码返回中文说明。"""
    if http_code in HTTP_STATUS_LABEL:
        return HTTP_STATUS_LABEL[http_code]
    if 200 <= http_code < 300:
        return "成功"
    if 400 <= http_code < 500:
        return "客户端错误"
    if 500 <= http_code < 600:
        return "服务端错误"
    return "未知状态"


def health_check(base_url: str = DEFAULT_BASE_URL) -> bool:
    """
    执行存活探测。

    根据 API 文档规范校验响应：
      - 成功 (200): {"status": "ok", "time": "..."}
      - 失败 (非 200): {"message": "..."}

    Args:
        base_url: 服务基础地址

    Returns:
        True  探测通过
        False 探测失败
    """
    url = f"{base_url.rstrip('/')}{HEALTHZ_PATH}"

    print("存活探测")
    print(f"   URL:  {url}")
    print()

    session = requests.Session()

    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT)
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] 连接失败 —— 无法访问 {url}")
        print(f"   请确认服务已启动，地址与端口正确。")
        return False
    except requests.exceptions.Timeout:
        print(f"[ERROR] 请求超时（{REQUEST_TIMEOUT}s）")
        return False
    except requests.exceptions.RequestException as exc:
        print(f"[ERROR] 网络异常: {type(exc).__name__}: {exc}")
        return False
    finally:
        session.close()

    http_code = response.status_code
    reason = response.reason

    try:
        body: dict | None = response.json() if response.text else None
    except json.JSONDecodeError:
        body = None

    label = status_label(http_code)
    print(f"HTTP {http_code} {reason} —— {label}")
    print()

    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"   {key}: {value}")
    print()

    print("Response Body:")
    print(json.dumps(body, indent=2, ensure_ascii=False) if body else "(空)")
    print()

    if 200 <= http_code < 300:
        if not isinstance(body, dict):
            print(f"[WARN] 结构异常: 响应体应为 JSON 对象")
            return False

        status = body.get("status", "N/A")
        server_time = body.get("time", "N/A")

        print(f"[OK] 存活探测通过")
        print(f"   status:  {status}")
        print(f"   time:    {server_time}")
        return True
    else:
        msg = body.get("message", label) if isinstance(body, dict) else label
        print(f"[ERROR] 存活探测失败 —— {msg}")
        return False


# ── 入口 ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="存活探测 HTTP 客户端 —— GET /healthz",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "示例:\n"
            "  python health_check.py\n"
            "  python health_check.py --url http://localhost:8080\n"
        ),
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_BASE_URL,
        help="服务基础地址 (默认: %(default)s)",
    )
    args = parser.parse_args()

    success = health_check(base_url=args.url)
    sys.exit(0 if success else 1)
