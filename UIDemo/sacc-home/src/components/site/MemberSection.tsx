import { useState } from 'react'
import { useSiteData } from '../../context/SiteDataContext'
import type { MemberLeader } from '../../content/siteContent'

function LeaderCard({ leader }: { leader: MemberLeader }) {
  const initial = leader.name.charAt(0)

  return (
    <article className="member-card">
      <div className="member-avatar">{initial}</div>
      <div className="member-card-body">
        <div className="member-card-info">
          <span className="member-card-name">{leader.name}</span>
          <span className="member-card-role">{leader.role}</span>
        </div>
        <p className="member-card-bio">{leader.bio}</p>
      </div>
    </article>
  )
}

function MemberSection() {
  const { content } = useSiteData()
  const groups = content.about.members.groups
  const [activeId, setActiveId] = useState<string>(groups[0]?.id ?? '')

  const activeGroup = groups.find((g) => g.id === activeId) ?? groups[0]

  if (!groups.length) {
    return null
  }

  const isPresidium = activeGroup.id === 'presidium'
  const hasMembers = activeGroup.members.length > 0

  return (
    <section className="site-section site-section-soft">
      <div className="site-container">
        <div className="member-tab-bar">
          {groups.map((group) => (
            <button
              key={group.id}
              className={`member-tab${group.id === activeId ? ' is-active' : ''}`}
              onClick={() => setActiveId(group.id)}
            >
              {group.name}
            </button>
          ))}
        </div>

        <div className={`member-layout${!hasMembers ? ' is-full' : ''}`}>
          <div className={`member-leader-column${isPresidium ? ' is-double' : ''}`}>
            {activeGroup.leaders.map((leader) => (
              <LeaderCard key={leader.name} leader={leader} />
            ))}
          </div>

          {hasMembers && (
            <div className="member-list">
              <span className="member-list-label">组员</span>
              <div className="member-name-list">
                {activeGroup.members.map((name) => (
                  <span key={name} className="member-name-tag">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MemberSection
