import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Story } from '../../../types/models'
import type { LibraryState } from '../features/library/useLibraryState'
import { MyLibrarySection } from './MyLibrarySection'

const stories: Story[] = [
  {
    id: 1,
    title: 'A Saved Story',
    content: 'A saved story opening.',
    author: { id: 1, username: 'writer', email: 'writer@example.com' },
    contributors: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    commentsEnabled: true,
  },
  {
    id: 2,
    title: 'An Unsaved Story',
    content: 'An unsaved story opening.',
    author: { id: 2, username: 'another', email: 'another@example.com' },
    contributors: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    commentsEnabled: true,
  },
]

const library: LibraryState = {
  entries: [{ storyId: 1, shelf: 'saved', progress: 0, collection: '' }],
  history: [],
  collections: [],
}

describe('MyLibrarySection', () => {
  it('shows saved stories only and opens a selected story', () => {
    const onOpenStory = vi.fn()
    render(<MyLibrarySection library={library} onOpenStory={onOpenStory} setLibrary={vi.fn()} stories={stories} />)

    expect(screen.getByRole('heading', { name: 'A Saved Story' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'An Unsaved Story' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open story' }))
    expect(onOpenStory).toHaveBeenCalledWith(stories[0])
  })

  it('shows an empty state when no stories are saved', () => {
    render(<MyLibrarySection library={{ ...library, entries: [] }} onOpenStory={vi.fn()} setLibrary={vi.fn()} stories={stories} />)
    expect(screen.getByRole('heading', { name: 'No saved stories yet.' })).toBeInTheDocument()
  })
})
