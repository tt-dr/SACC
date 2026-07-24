import type { ReactNode } from 'react'

interface SectionHeadingProps {
  title: string
  description?: string
  action?: ReactNode
}

function SectionHeading({ title, description, action = null }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export default SectionHeading
