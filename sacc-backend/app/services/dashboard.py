from sqlalchemy import case, func, select
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Content, ContentModule, ContentStatus
from app.models.site_metric import SiteMetric
from app.models.user import User, UserStatus
from app.schemas.content import DashboardResponse


async def record_site_visit(db: AsyncSession) -> None:
    statement = insert(SiteMetric).values(key="site_visits", value=1)
    await db.execute(
        statement.on_duplicate_key_update(value=SiteMetric.value + 1)
    )
    await db.commit()


async def get_dashboard_stats(db: AsyncSession) -> DashboardResponse:
    content_counts = (
        await db.execute(
            select(
                func.count(case((Content.module == ContentModule.NEWS, 1))),
                func.count(case((Content.module == ContentModule.DOCS, 1))),
                func.count(case((Content.module == ContentModule.PROJECTS, 1))),
                func.count(
                    case(
                        (
                            (Content.module == ContentModule.NEWS)
                            & (Content.status == ContentStatus.DRAFT),
                            1,
                        )
                    )
                ),
                func.count(
                    case(
                        (
                            (Content.module == ContentModule.DOCS)
                            & (Content.status == ContentStatus.DRAFT),
                            1,
                        )
                    )
                ),
            ).where(Content.status != ContentStatus.ARCHIVED)
        )
    ).one()
    active_members = await db.scalar(
        select(func.count(User.id)).where(User.status == UserStatus.ACTIVE)
    )
    site_visits = await db.scalar(
        select(SiteMetric.value).where(SiteMetric.key == "site_visits")
    )
    return DashboardResponse(
        site_visits=site_visits or 0,
        active_members=active_members or 0,
        news_count=content_counts[0],
        docs_count=content_counts[1],
        projects_count=content_counts[2],
        pending_news=content_counts[3],
        draft_docs=content_counts[4],
    )
