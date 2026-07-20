import type { ReactNode } from 'react'
import { parseMarkdown } from '../../lib/markdown'

interface MarkdownContentProps {
  source: string
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  const segments = text.split(pattern).filter((segment) => segment !== '')

  segments.forEach((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      nodes.push(<strong key={index}>{segment.slice(2, -2)}</strong>)
      return
    }

    if (segment.startsWith('`') && segment.endsWith('`')) {
      nodes.push(<code key={index}>{segment.slice(1, -1)}</code>)
      return
    }

    nodes.push(<span key={index}>{segment}</span>)
  })

  return nodes
}

function MarkdownContent({ source }: MarkdownContentProps) {
  const blocks = parseMarkdown(source)

  return (
    <div className="doc-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h1 key={`${block.id}-${index}`} id={block.id} className="doc-h1">
                {renderInline(block.text)}
              </h1>
            )
          }

          if (block.level === 2) {
            return (
              <h2 key={`${block.id}-${index}`} id={block.id} className="doc-h2">
                {renderInline(block.text)}
              </h2>
            )
          }

          return (
            <h3 key={`${block.id}-${index}`} id={block.id} className="doc-h3">
              {renderInline(block.text)}
            </h3>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={`list-${index}`} className="doc-list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={`p-${index}`} className="doc-paragraph">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

export default MarkdownContent
