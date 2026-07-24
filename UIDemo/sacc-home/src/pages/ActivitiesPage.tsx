import { ArrowRight, CalendarRange, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function ActivitiesPage() {
  const { content } = useSiteData()

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Activities"
        title="精彩活动"
        description="活动页保留设计稿里的大气节奏，但每场活动现在都具备结构化字段，便于后台管理和后续 API 接入。"
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="活动列表" description="训练营、分享会、项目活动和协作工作坊都统一进入一套展示模型。" />
          <div className="three-column-grid">
            {content.activities.map((item) => (
              <article key={item.slug} className="site-card media-card">
                <div className="media-card-banner">
                  <span>{item.category}</span>
                  <strong>{item.quota} 个名额</strong>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="icon-list">
                  <span>
                    <CalendarRange size={16} />
                    {item.date}
                  </span>
                  <span>
                    <MapPin size={16} />
                    {item.location}
                  </span>
                  <span>
                    <Users size={16} />
                    报名上限 {item.quota}
                  </span>
                </div>
                <Link className="inline-link" to={`/activities/${item.slug}`}>
                  查看详情
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default ActivitiesPage
