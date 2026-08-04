from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ContentModule(str, Enum):
    NEWS = "news"
    DOCS = "docs"
    PROJECTS = "projects"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Content(Base):
    __tablename__ = "content"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    module: Mapped[ContentModule] = mapped_column(
        SqlEnum(
            ContentModule,
            name="content_module",
            values_callable=lambda values: [value.value for value in values],
        ),
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(LONGTEXT, nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[ContentStatus] = mapped_column(
        SqlEnum(
            ContentStatus,
            name="content_status",
            values_callable=lambda values: [value.value for value in values],
        ),
        default=ContentStatus.DRAFT,
        index=True,
    )
    author_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author: Mapped[str | None] = mapped_column(String(64), nullable=True)
    author_avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    repo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )
