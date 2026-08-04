import re

from pypinyin import lazy_pinyin


def generate_slug(title: str) -> str:
    """将标题转换为稳定、可读的 URL slug；唯一性由内容服务负责。"""
    transliterated = "-".join(lazy_pinyin(title))
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", transliterated).strip("-").lower()
    return slug[:240] or "content"
