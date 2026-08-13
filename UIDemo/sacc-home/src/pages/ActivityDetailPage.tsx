import { CalendarRange, MapPin, Users } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'
import { findBySlug, formatDisplayDate } from '../lib/siteSelectors'

function ActivityDetailPage() {
  const { content } = useSiteData()
  const { activityId } = useParams()
  const activity = findBySlug(content.activities, activityId)

  if (!activity) {
    return <Navigate replace to="/404" />
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow={activity.category}
        title={activity.title}
        description={activity.description}
        actions={[
          { label: '返回活动列表', to: '/activities' },
          { label: '查看加入我们', to: '/join-us', tone: 'secondary' },
        ]}
        aside={
          <div className="hero-side-panel">
            <span>
              <CalendarRange size={16} />
              {formatDisplayDate(activity.date)}
            </span>
            <span>
              <MapPin size={16} />
              {activity.location}
            </span>
            <span>
              <Users size={16} />
              名额上限 {activity.quota}
            </span>
          </div>
        }
      />

      <section className="site-section">
        <div className="site-container two-column-grid">
          <article className="site-card">
            <SectionHeading title="活动议程" description="原设计稿中的活动详情页被整理成可维护的议程列表。" />
            <ol className="site-list is-ordered">
              {activity.agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="site-card">
            <SectionHeading title="参与收获" description="用结构化内容清楚表达活动价值，避免详情页只有装饰性排版。" />
            <ul className="site-list">
              {activity.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}

export default ActivityDetailPage
