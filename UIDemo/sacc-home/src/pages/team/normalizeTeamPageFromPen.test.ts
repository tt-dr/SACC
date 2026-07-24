import { describe, expect, it } from 'vitest'
import { normalizeTeamPageFromPen } from './normalizeTeamPageFromPen'

function createTab(label, icon) {
  return {
    type: 'frame',
    name: `tab-${label}`,
    fill: '#f2f4f7',
    cornerRadius: 999,
    children: [
      {
        type: 'text',
        content: icon,
        fill: '#697488',
        fontWeight: '700',
      },
      {
        type: 'text',
        content: label,
        fill: '#697488',
        fontWeight: '700',
      },
    ],
  }
}

describe('normalizeTeamPageFromPen', () => {
  it('applies the non-technical-page tab style to the selected department tab and hero spacing', () => {
    const page = {
      type: 'frame',
      name: '团队架构-主席团',
      children: [
        {
          type: 'frame',
          name: 'hero',
          gap: 22,
          padding: [38, 0, 20, 0],
          children: [],
        },
        {
          type: 'frame',
          name: 'tabWrap',
          children: [
            createTab('主席团', '👥'),
            createTab('非技术部门', '📣'),
            createTab('技术部门', '<>'),
          ],
        },
      ],
    }

    const normalized = normalizeTeamPageFromPen(page, '/team/non-technical')
    const hero = normalized.children[0]
    const tabs = normalized.children[1].children
    const activeTab = tabs[1]
    const inactiveTab = tabs[0]

    expect(hero.width).toBe('fill_container')
    expect(hero.gap).toBe(14)
    expect(hero.padding).toEqual([24, 0, 12, 0])
    expect(activeTab.fill).toBe('#ffffff')
    expect(activeTab.effect).toEqual({
      type: 'shadow',
      shadowType: 'outer',
      color: '#0f203726',
      offset: {
        x: 0,
        y: 8,
      },
      blur: 18,
    })
    expect(activeTab.children[1].fill).toBe('#ff6a00')
    expect(activeTab.children[1].fontWeight).toBe('600')

    expect(inactiveTab.fill).toBe('#f2f4f7')
    expect(inactiveTab.children[1].fill).toBe('#697488')
  })

  it('removes leadership-card detail buttons from the chairman page', () => {
    const page = {
      type: 'frame',
      name: '团队架构-主席团',
      children: [
        {
          type: 'frame',
          name: 'coreSec',
          children: [
            {
              type: 'frame',
              name: 'card1',
              height: 360,
              children: [
                { type: 'text', name: 'name1', content: '陈明' },
                { type: 'text', name: 'role1', content: '执行主席' },
                {
                  type: 'frame',
                  name: 'btn',
                  children: [{ type: 'text', name: 'btn1Icon', content: '↗' }],
                },
              ],
            },
          ],
        },
      ],
    }

    const normalized = normalizeTeamPageFromPen(page, '/team')
    const leadershipCard = normalized.children[0].children[0]

    expect(leadershipCard.children).toHaveLength(2)
    expect(leadershipCard.children.some((child) => child.name === 'btn')).toBe(false)
    expect(leadershipCard.height).toBe(304)
  })
})
