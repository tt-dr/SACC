from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import Field

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
    tags: list[str] = []
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


class ContentItemResponse(APIModel):
    data: ContentItem


class UpsertContentRequest(APIModel):
    module: ContentModule
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    body: str | None = None
    category: str | None = Field(default=None, max_length=64)
    tags: list[str] = []
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
    links: list[NavItem] = []


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
    footer_stats: list[StatItem] = []
    footer_columns: list[FooterColumn] = []
    social_links: list[SocialLink] = []
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
    hero_actions: list[HeroAction] = []
    stats: list[StatItem] = []
    highlights: list[Highlight] = []
    testimonials: list[str] = []
    partners: list[str] = []
    resources: list[ResourceItem] = []


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
    leaders: list[MemberLeader] = []
    members: list[str] = []


class MembersData(APIModel):
    groups: list[MemberGroup] = []


class AboutPageData(APIModel):
    hero: PageHero | None = None
    mission_cards: list[CardItem] = []
    capabilities: list[str] = []
    values: list[CardItem] = []
    timeline: list[TimelineItem] = []
    honors: list[str] = []
    members: MembersData | None = None


class JoinTimelineItem(APIModel):
    title: str | None = None
    detail: str | None = None


class JoinPageData(APIModel):
    eyebrow: str | None = None
    title: str | None = None
    subtitle: str | None = None
    group_number: str | None = None
    timeline: list[JoinTimelineItem] = []
    benefits: list[str] = []
    tracks: list[CardItem] = []
    requirements: list[str] = []


class ActivityItem(APIModel):
    slug: str | None = None
    title: str | None = None
    date: str | None = None
    location: str | None = None
    quota: int | None = None
    category: str | None = None
    summary: str | None = None
    description: str | None = None
    agenda: list[str] = []
    outcomes: list[str] = []
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
    architecture: list[str] = []
    tech_stack: list[str] = []
    challenges: list[str] = []
    code_sample: str | None = None
    roadmap: list[str] = []
    awards: list[str] = []
    team: list[ProjectMember] = []


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
    tags: list[str] = []
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
    leadership: list[TeamMember] = []
    technical: list[TeamMember] = []
    non_technical: list[TeamMember] = []


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
    albums: list[GalleryAlbum] = []
    archive_years: list[GalleryArchiveYear] = []


class FAQItem(APIModel):
    question: str | None = None
    answer: str | None = None


class BootstrapData(APIModel):
    site: SiteMeta | None = None
    navigation: list[NavItem] = []
    home: HomePageData | None = None
    about: AboutPageData | None = None
    join: JoinPageData | None = None
    activities: list[ActivityItem] = []
    projects: list[ProjectItem] = []
    news: list[NewsItem] = []
    docs: list[DocItem] = []
    team: TeamPageData | None = None
    gallery: GalleryData | None = None
    faq: list[FAQItem] = []


class DashboardData(APIModel):
    site_visits: int
    active_members: int
    news_count: int
    docs_count: int
    projects_count: int
    pending_news: int
    draft_docs: int


class DashboardResponse(APIModel):
    data: DashboardData


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


class AuditLogResponse(APIModel):
    data: list[AuditLogItem]


class UploadData(APIModel):
    url: str
    filename: str
    size: int
    uploaded_at: datetime


class UploadResponse(APIModel):
    data: UploadData


JsonObject = dict[str, Any]

