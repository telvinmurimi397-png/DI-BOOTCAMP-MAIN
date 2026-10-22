import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { Story } from '../../../types/models'
import type { LibraryState } from '../features/library/useLibraryState'
import './MyLibrarySection.css'

export function MyLibrarySection({
  stories,
  library,
  setLibrary,
  onOpenStory,
}: {
  stories: Story[]
  library: LibraryState
  setLibrary: Dispatch<SetStateAction<LibraryState>>
  onOpenStory: (story: Story) => void
}) {
  const savedStories = useMemo(() => {
    const storiesById = new Map(stories.map((story) => [story.id, story]))
    return library.entries
      .filter((entry) => entry.shelf === 'saved')
      .map((entry) => storiesById.get(entry.storyId))
      .filter((story): story is Story => story !== undefined)
  }, [library.entries, stories])

  function removeFromLibrary(storyId: number) {
    setLibrary((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.storyId !== storyId),
    }))
  }

  return (
    <section className="library-section" id="library" aria-labelledby="library-title">
      <div className="library-heading">
        <div><p className="library-eyebrow">YOUR PERSONAL STORY SHELF</p><h2 id="library-title">My <em>Library.</em></h2></div>
        <p>Your saved stories, all in one place.</p>
      </div>

      {savedStories.length > 0 ? (
        <div className="library-story-list">
          {savedStories.map((story) => (
            <article className="library-story" key={story.id}>
              <div className="library-story-copy">
                <p className="library-story-author">BY {story.author.username.toLocaleUpperCase()}</p>
                <h3>{story.title}</h3>
                <p>{story.content.slice(0, 170)}{story.content.length > 170 ? '…' : ''}</p>
              </div>
              <div className="library-story-actions">
                <button onClick={() => onOpenStory(story)} type="button">Open story</button>
                <button className="library-remove-action" onClick={() => removeFromLibrary(story.id)} type="button">Remove from library</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="library-empty">
          <h3>No saved stories yet.</h3>
          <p>Save a story from the story shelf and it will appear here.</p>
        </div>
      )}
    </section>
  )
}
