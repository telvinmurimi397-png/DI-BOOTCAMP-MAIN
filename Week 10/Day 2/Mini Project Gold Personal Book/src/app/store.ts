import { configureStore } from '@reduxjs/toolkit'
import booksReducer, { loadSavedBooks, setStorageError } from '../features/books/booksSlice'
import { BookItem } from '../model/Book'

const storageKey = 'shelf-library-books'

function loadBooks(): ReturnType<typeof booksReducer> {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return booksReducer(undefined, { type: '@@INIT' })
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) throw new Error('Saved library data is not a list.')
    const books = parsed.map(BookItem.fromJSON).filter((book) => book !== null)
    const state = booksReducer(undefined, loadSavedBooks(books))
    return books.length === parsed.length
      ? state
      : booksReducer(state, setStorageError('Some saved entries were invalid and could not be restored.'))
  } catch (error) {
    console.error('Could not load the saved book library.', error)
    return booksReducer(
      undefined,
      setStorageError('Saved books could not be loaded. The library will start empty.'),
    )
  }
}

export const store = configureStore({
  reducer: { books: booksReducer },
  preloadedState: { books: loadBooks() },
})

let lastStorageError: string | null = null
let lastSavedBooks = store.getState().books.books
store.subscribe(() => {
  const books = store.getState().books.books
  if (books === lastSavedBooks) return
  lastSavedBooks = books

  try {
    localStorage.setItem(storageKey, JSON.stringify(books))
    if (lastStorageError) {
      lastStorageError = null
      store.dispatch(setStorageError(null))
    }
  } catch (error) {
    console.error('Could not save the book library.', error)
    if (!lastStorageError) {
      lastStorageError = 'Your changes could not be saved in this browser.'
      store.dispatch(setStorageError(lastStorageError))
    }
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
