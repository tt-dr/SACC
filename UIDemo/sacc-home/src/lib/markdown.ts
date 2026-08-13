export interface MarkdownHeadingBlock {
  type: 'heading'
  level: 1 | 2 | 3
  text: string
  id: string
}

export interface MarkdownParagraphBlock {
  type: 'paragraph'
  text: string
}

export interface MarkdownListBlock {
  type: 'list'
  items: string[]
}

export type MarkdownBlock = MarkdownHeadingBlock | MarkdownParagraphBlock | MarkdownListBlock

export interface TocEntry {
  id: string
  text: string
  level: 2 | 3
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const source = typeof markdown === 'string' ? markdown : ''
  const lines = source.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []
  let listItems: string[] = []
  let headingIndex = 0

  const flushList = () => {
    if (listItems.length === 0) {
      return
    }

    blocks.push({ type: 'list', items: listItems })
    listItems = []
  }

  const pushHeading = (level: 1 | 2 | 3, text: string) => {
    flushList()
    blocks.push({
      type: 'heading',
      level,
      text,
      id: `heading-${headingIndex}`,
    })
    headingIndex += 1
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushList()
      return
    }

    if (line.startsWith('### ')) {
      pushHeading(3, line.slice(4).trim())
      return
    }

    if (line.startsWith('## ')) {
      pushHeading(2, line.slice(3).trim())
      return
    }

    if (line.startsWith('# ')) {
      pushHeading(1, line.slice(2).trim())
      return
    }

    if (line.startsWith('- ')) {
      listItems.push(line.slice(2).trim())
      return
    }

    flushList()
    blocks.push({ type: 'paragraph', text: line })
  })

  flushList()

  return blocks
}

export function extractToc(markdown: string): TocEntry[] {
  return parseMarkdown(markdown)
    .filter((block): block is MarkdownHeadingBlock => block.type === 'heading' && block.level >= 2)
    .map((block) => ({
      id: block.id,
      text: block.text,
      level: block.level as 2 | 3,
    }))
}
