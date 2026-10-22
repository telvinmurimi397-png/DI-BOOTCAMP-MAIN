import { useEffect, useState } from 'react'

export type Shelf = 'saved' | 'reading' | 'completed'
export type LibraryEntry = {
  storyId: number
  shelf: Shelf
  progress: number
  collection: string
}
export type ReadingHistoryItem = {
  storyId: number
  lastReadAt: string
}
export type LibraryState = {
  entries: LibraryEntry[]
  history: ReadingHistoryItem[]
  collections: string[]
}

function storageKey(userId: number): string {
  return `plot-library-${userId}`
}

function loadLibrary(userId: number): LibraryState {
  try {
    const saved = localStorage.getItem(storageKey(userId))
    if (!saved) return { entries: [], history: [], collections: [] }
    const parsed: unknown = JSON.parse(saved)
    if (
      typeof parsed === 'object'
      && parsed !== null
      && 'entries' in parsed
      && Array.isArray(parsed.entries)
      && 'history' in parsed
      && Array.isArray(parsed.history)
      && 'collections' in parsed
      && Array.isArray(parsed.collections)
    ) {
      return {
        entries: parsed.entries.filter((entry): entry is LibraryEntry =>
          typeof entry === 'object'
          && entry !== null
          && 'storyId' in entry && typeof entry.storyId === 'number'
          && 'shelf' in entry && (entry.shelf === 'saved' || entry.shelf === 'reading' || entry.shelf === 'completed')
          && 'progress' in entry && typeof entry.progress === 'number'
          && 'collection' in entry && typeof entry.collection === 'string',
        ),
        history: parsed.history.filter((item): item is ReadingHistoryItem =>
          typeof item === 'object'
          && item !== null
          && 'storyId' in item && typeof item.storyId === 'number'
          && 'lastReadAt' in item && typeof item.lastReadAt === 'string',
        ),
        collections: parsed.collections.filter((collection): collection is string => typeof collection === 'string'),
      }
    }
    console.warn('Saved library data has an unexpected format; starting with an empty library.')
  } catch (error) {
    console.warn('Could not load the saved library.', error)
  }
  return { entries: [], history: [], collections: [] }
}

export function useLibraryState(userId: number) {
  const [library, setLibrary] = useState<LibraryState>(() => loadLibrary(userId))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(library))
    } catch (error) {
      console.warn('Could not save the library to this browser.', error)
    }
  }, [library, userId])

  return [library, setLibrary] as const
}
