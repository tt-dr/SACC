import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import penFileContent from '../../public/SACC.pen?raw'
import PenNode from '../renderer/PenNode'
import type { PenDocument, PenNode as PenNodeModel } from '../types/pen'
import useInteractivePenPage from './useInteractivePenPage'

function findPageByName(document: PenDocument, pageName: string): PenNodeModel {
  const page = document.children?.find((node) => node?.type === 'frame' && node?.name === pageName)

  if (!page) {
    throw new Error(`Page "${pageName}" was not found in SACC.pen`)
  }

  return page
}

function GalleryPenPageHarness() {
  const galleryPage = findPageByName(JSON.parse(penFileContent) as PenDocument, '相册')
  const { interactionControls, pageNode } = useInteractivePenPage(galleryPage)

  return <PenNode node={pageNode} interactionControls={interactionControls} />
}

describe('useInteractivePenPage', () => {
  it('activates gallery category buttons and updates the gallery view', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <GalleryPenPageHarness />
      </MemoryRouter>,
    )

    ;['全部照片', '活动现场', '竞赛时刻', '团队建设', '获奖时刻'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })

    expect(screen.getByText('精选社团高光时刻')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '竞赛时刻' }))

    expect(screen.getByRole('button', { name: '竞赛时刻' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('竞赛高光精选影像')).toBeInTheDocument()
    expect(screen.queryByText('精选社团高光时刻')).not.toBeInTheDocument()
  })
})
