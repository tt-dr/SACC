import PageHero from '../components/site/PageHero'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function FaqPage() {
  const { content } = useSiteData()

  return (
    <SiteLayout>
      <PageHero
        eyebrow="FAQ"
        title="常见问题"
        description="FAQ 页从设计稿里的装饰性列表，改造成更适合官网长期运营的问答页面。"
      />

      <section className="site-section">
        <div className="site-container faq-stack">
          {content.faq.map((item) => (
            <article key={item.question} className="site-card faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  )
}

export default FaqPage
