import copy
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.content import Content, ContentModule, ContentStatus
from app.models.user import User, UserStatus
from app.schemas.content import BootstrapData


def load_site_content(path: Path | None = None) -> dict:
    content_path = path or settings.site_content_path
    with content_path.open(encoding="utf-8") as source:
        return json.load(source)


def _format_date(value) -> str | None:
    return value.date().isoformat() if value is not None else None


def _content_to_bootstrap(item: Content) -> dict:
    common = {
        "slug": item.slug,
        "title": item.title,
        "category": item.category,
    }
    if item.module == ContentModule.NEWS:
        return {
            **common,
            "coverImage": item.cover_image,
            "author": item.author,
            "authorAvatar": item.author_avatar,
            "date": _format_date(item.published_at or item.created_at),
            "tags": item.tags or [],
            "summary": item.summary,
            "content": item.body,
        }
    if item.module == ContentModule.DOCS:
        return {
            **common,
            "order": item.sort_order,
            "updatedAt": _format_date(item.updated_at),
            "description": item.summary,
            "content": item.body,
        }
    return {
        **common,
        "owner": item.author,
        "summary": item.summary,
        "repoUrl": item.repo_url,
        "description": item.body,
        "techStack": item.tags or [],
    }


def _member_to_bootstrap(user: User) -> dict:
    return {
        "name": user.display_name or user.username,
        "role": user.position,
        "avatar": user.avatar,
        "focus": user.desc,
    }


async def build_bootstrap(db: AsyncSession) -> BootstrapData:
    data = copy.deepcopy(load_site_content())
    content_items = (
        await db.scalars(
            select(Content)
            .where(Content.status == ContentStatus.PUBLISHED)
            .order_by(Content.sort_order, Content.published_at.desc(), Content.id.desc())
        )
    ).all()
    for module in ContentModule:
        module_items = [
            _content_to_bootstrap(item)
            for item in content_items
            if item.module == module
        ]
        if module_items:
            data[module.value] = module_items

    members = (
        await db.scalars(
            select(User)
            .where(
                User.status == UserStatus.ACTIVE,
                User.member_group.is_not(None),
            )
            .order_by(User.member_group, User.id)
        )
    ).all()
    if members:
        grouped: dict[str, list[User]] = {}
        for member in members:
            grouped.setdefault(member.member_group or "其他", []).append(member)
        data.setdefault("about", {}).setdefault("members", {})["groups"] = [
            {
                "id": group_name,
                "name": group_name,
                "leaders": [],
                "members": [member.display_name or member.username for member in group],
            }
            for group_name, group in grouped.items()
        ]
        data["team"] = {
            "intro": data.get("team", {}).get("intro"),
            "leadership": [
                _member_to_bootstrap(member)
                for member in members
                if member.member_group == "主席团"
            ],
            "technical": [
                _member_to_bootstrap(member)
                for member in members
                if member.member_group == "技术部"
            ],
            "nonTechnical": [
                _member_to_bootstrap(member)
                for member in members
                if member.member_group not in {"主席团", "技术部"}
            ],
        }
    return BootstrapData.model_validate(data)
