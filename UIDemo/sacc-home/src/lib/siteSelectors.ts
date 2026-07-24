export function sortByDateDesc(items) {
  return [...items].sort((left, right) => `${right.date || ''}`.localeCompare(`${left.date || ''}`))
}

export function findBySlug(items, slug) {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  if (!slug) {
    return items[0]
  }

  return items.find((item) => item.slug === slug) || null
}

export function formatDisplayDate(value) {
  if (!value) {
    return '待定'
  }

  const [year, month, day] = `${value}`.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${year} 年 ${month} 月 ${day} 日`
}
