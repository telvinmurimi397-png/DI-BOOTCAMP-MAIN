import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Story } from '../../../types/models'
import type { LibraryState } from '../features/library/useLibraryState'
import { MyLibrarySection } from './MyLibrarySection'

const story: Story = {
  id: 1,
  title: 'The Map Beneath the Floor',
  content: 'When Mara lifted the loose board, she found a map drawn in ink that shimmered like moonlight.',
  author: { id: 1, username: 'mara', email: 'mara@example.com' },
  contributors: [],
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-02T12:00:00.000Z',
  commentsEnabled: true,
}

const library: LibraryState = {
  entries: [{ storyId: story.id, shelf: 'saved', progress: 0, collection: '' }],
  history: [],
  collections: [],
}

const meta = {
  title: 'Library/MyLibrarySection',
  component: MyLibrarySection,
  args: {
    stories: [story],
    library,
    setLibrary: () => undefined,
    onOpenStory: () => undefined,
  },
} satisfies Meta<typeof MyLibrarySection>

export default meta
type StorybookStory = StoryObj<typeof meta>

export const WithSavedStory: StorybookStory = {}
export const Empty: StorybookStory = {
  args: { library: { entries: [], history: [], collections: [] } },
}
