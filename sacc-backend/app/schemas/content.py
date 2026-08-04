from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import Field, RootModel

from app.schemas import APIModel


class ContentModule(str, Enum):
    NEWS = "news"
    DOCS = "docs"
    PROJECTS = "projects"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ReorderModule(str, Enum):
    DOCS = "docs"
    PROJECTS = "projects"


class Pagination(APIModel):
    page: int
    page_size: int
    total: int


class ContentItemSummary(APIModel):
    id: int
    module: ContentModule
    slug: str
    title: str
    summary: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    status: ContentStatus
    author: str | None = None
    author_avatar: str | None = None
    repo_url: str | None = None
    sort_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ContentItem(ContentItemSummary):
    body: str | None = None


class ContentListResponse(APIModel):
    data: list[ContentItemSummary]
    pagination: Pagination


class ContentItemResponse(ContentItem):
    """APIfox 内容详情响应的 data 类型。"""


class UpsertContentRequest(APIModel):
    module: ContentModule
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    body: str | None = None
    category: str | None = Field(default=None, max_length=64)
    tags: list[str] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.DRAFT
    author: str | None = Field(default=None, max_length=64)
    repo_url: str | None = Field(default=None, max_length=255)
    published_at: datetime | None = None


class ReorderRequest(APIModel):
    module: ReorderModule
    ordered_ids: list[int] = Field(min_length=1)


class MemberPublicItem(APIModel):
    id: int
    display_name: str
    avatar: str | None = None
    position: str | None = None
    desc: str | None = None
    group: str | None = None


class MemberListResponse(APIModel):
    data: list[MemberPublicItem]
    groups: list[str]


class NavItem(APIModel):
    label: str | None = None
    to: str | None = None


class StatItem(APIModel):
    value: str | None = None
    label: str | None = None


class ActionLink(NavItem):
    pass


class HeroAction(ActionLink):
    tone: str | None = None


class CardItem(APIModel):
    title: str | None = None
    description: str | None = None


class PageHero(APIModel):
    eyebrow: str | None = None
    title: str | None = None
    description: str | None = None


class FooterColumn(APIModel):
    title: str | None = None
    links: list[NavItem] = Field(default_factory=list)


class SocialLink(APIModel):
    label: str | None = None
    href: str | None = None


class CtaSection(APIModel):
    title: str | None = None
    description: str | None = None
    primary_action: ActionLink | None = None
    secondary_action: ActionLink | None = None


class SiteMeta(APIModel):
    name: str | None = None
    full_name: str | None = None
    tagline: str | None = None
    logo_url: str | None = None
    domain: str | None = None
    public_ip: str | None = None
    email: str | None = None
    footer_stats: list[StatItem] = Field(default_factory=list)
    footer_columns: list[FooterColumn] = Field(default_factory=list)
    social_links: list[SocialLink] = Field(default_factory=list)
    cta: CtaSection | None = None


class Highlight(APIModel):
    title: str | None = None
    description: str | None = None
    link: str | None = None


class ResourceItem(StatItem):
    description: str | None = None


class HomePageData(APIModel):
    eyebrow: str | None = None
    title: str | None = None
    subtitle: str | None = None
    hero_actions: list[HeroAction] = Field(default_factory=list)
    stats: list[StatItem] = Field(default_factory=list)
    highlights: list[Highlight] = Field(default_factory=list)
    testimonials: list[str] = Field(default_factory=list)
    partners: list[str] = Field(default_factory=list)
    resources: list[ResourceItem] = Field(default_factory=list)


class TimelineItem(APIModel):
    year: str | None = None
    title: str | None = None
    description: str | None = None


class MemberLeader(APIModel):
    name: str | None = None
    role: str | None = None
    bio: str | None = None


class MemberGroup(APIModel):
    id: str | None = None
    name: str | None = None
    leaders: list[MemberLeader] = Field(default_factory=list)
    members: list[str] = Field(default_factory=list)


class MembersData(APIModel):
    groups: list[MemberGroup] = Field(default_factory=list)


class AboutPageData(APIModel):
    hero: PageHero | None = None
    mission_cards: list[CardItem] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)
    values: list[CardItem] = Field(default_factory=list)
    timeline: list[TimelineItem] = Field(default_factory=list)
    honors: list[str] = Field(default_factory=list)
    members: MembersData | None = None


class JoinTimelineItem(APIModel):
    title: str | None = None
    detail: str | None = None


class JoinPageData(APIModel):
    eyebrow: str | None = None
    title: str | None = None
    subtitle: str | None = None
    group_number: str | None = None
    timeline: list[JoinTimelineItem] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    tracks: list[CardItem] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)


class ActivityItem(APIModel):
    slug: str | None = None
    title: str | None = None
    date: str | None = None
    location: str | None = None
    quota: int | None = None
    category: str | None = None
    summary: str | None = None
    description: str | None = None
    agenda: list[str] = Field(default_factory=list)
    outcomes: list[str] = Field(default_factory=list)
    link_label: str | None = None


class ProjectMember(APIModel):
    name: str | None = None
    role: str | None = None


class ProjectItem(APIModel):
    slug: str | None = None
    title: str | None = None
    owner: str | None = None
    summary: str | None = None
    progress: str | None = None
    status: str | None = None
    repo_url: str | None = None
    description: str | None = None
    architecture: list[str] = Field(default_factory=list)
    tech_stack: list[str] = Field(default_factory=list)
    challenges: list[str] = Field(default_factory=list)
    code_sample: str | None = None
    roadmap: list[str] = Field(default_factory=list)
    awards: list[str] = Field(default_factory=list)
    team: list[ProjectMember] = Field(default_factory=list)


class NewsItem(APIModel):
    slug: str | None = None
    title: str | None = None
    category: str | None = None
    cover_image: str | None = None
    author: str | None = None
    author_avatar: str | None = None
    role: str | None = None
    date: str | None = None
    read_minutes: int | None = None
    tags: list[str] = Field(default_factory=list)
    summary: str | None = None
    content: str | None = None


class DocItem(APIModel):
    slug: str | None = None
    title: str | None = None
    category: str | None = None
    order: int | None = None
    updated_at: str | None = None
    description: str | None = None
    content: str | None = None


class TeamMember(APIModel):
    name: str | None = None
    role: str | None = None
    avatar: str | None = None
    focus: str | None = None


class TeamIntro(APIModel):
    title: str | None = None
    description: str | None = None


class TeamPageData(APIModel):
    intro: TeamIntro | None = None
    leadership: list[TeamMember] = Field(default_factory=list)
    technical: list[TeamMember] = Field(default_factory=list)
    non_technical: list[TeamMember] = Field(default_factory=list)


class GalleryAlbum(APIModel):
    slug: str | None = None
    title: str | None = None
    date: str | None = None
    summary: str | None = None
    accent: str | None = None


class GalleryArchiveYear(APIModel):
    year: str | None = None
    count: int | None = None


class GalleryData(APIModel):
    albums: list[GalleryAlbum] = Field(default_factory=list)
    archive_years: list[GalleryArchiveYear] = Field(default_factory=list)


class FAQItem(APIModel):
    question: str | None = None
    answer: str | None = None


class BootstrapData(APIModel):
    site: SiteMeta | None = None
    navigation: list[NavItem] = Field(default_factory=list)
    home: HomePageData | None = None
    about: AboutPageData | None = None
    join: JoinPageData | None = None
    activities: list[ActivityItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    news: list[NewsItem] = Field(default_factory=list)
    docs: list[DocItem] = Field(default_factory=list)
    team: TeamPageData | None = None
    gallery: GalleryData | None = None
    faq: list[FAQItem] = Field(default_factory=list)


class DashboardTrafficPoint(APIModel):
    date: str | None = None
    visits: int | None = None


class DashboardContentCounts(APIModel):
    news: int | None = None
    docs: int | None = None
    projects: int | None = None
    users: int | None = None


class DashboardPendingCounts(APIModel):
    news: int | None = None
    docs: int | None = None
    projects: int | None = None
    users: int | None = None


class AuditLogEntry(APIModel):
    id: int
    actor: str
    module: str
    action: str
    detail: str
    created_at: datetime


class DashboardData(APIModel):
    site_visits: int
    active_members: int
    content_counts: DashboardContentCounts
    pending_counts: DashboardPendingCounts
    traffic_trend: list[DashboardTrafficPoint] = Field(default_factory=list)
    recent_audit_logs: list[AuditLogEntry] = Field(default_factory=list)


class DashboardResponse(APIModel):
    site_visits: int
    active_members: int
    news_count: int
    docs_count: int
    projects_count: int
    pending_news: int
    draft_docs: int


class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class AuditLogItem(APIModel):
    id: int
    module: str
    action: AuditAction
    actor: str
    detail: str
    timestamp: datetime


class AuditLogResponse(RootModel[list[AuditLogItem]]):
    """APIfox 审计日志列表的 data 类型。"""


class UploadData(APIModel):
    url: str
    filename: str
    size: int
    uploaded_at: datetime


class UploadResponse(APIModel):
    url: str
    filename: str
    size: int
    uploaded_at: datetime


JsonObject = dict[str, Any]
