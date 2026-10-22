import { createSelector, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import { BookItem, type Book, type NewBook } from '../../model/Book'
import type { RootState } from '../../app/store'

export type BookFilter = 'all' | 'read' | 'unread'
export type BookSort = 'recent' | 'title' | 'author'

interface BooksState {
  books: Book[]
  filter: BookFilter
  category: string
  search: string
  sort: BookSort
  storageError: string | null
}

const initialState: BooksState = {
  books: [],
  filter: 'all',
  category: 'all',
  search: '',
  sort: 'recent',
  storageError: null,
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    addBook: {
      reducer(state, action: PayloadAction<Book>) {
        state.books.unshift(action.payload)
      },
      prepare(book: NewBook) {
        return {
          payload: new BookItem(
            nanoid(),
            book.title,
            book.author,
            book.category,
            book.description,
          ).toJSON(),
        }
      },
    },
    removeBook(state, action: PayloadAction<string>) {
      state.books = state.books.filter((book) => book.id !== action.payload)
      if (state.category !== 'all' && !state.books.some((book) => book.category === state.category)) {
        state.category = 'all'
      }
    },
    toggleReadStatus(state, action: PayloadAction<string>) {
      const book = state.books.find((item) => item.id === action.payload)
      if (book) book.isRead = !book.isRead
    },
    setFilter(state, action: PayloadAction<BookFilter>) {
      state.filter = action.payload
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload.trim()
    },
    setSort(state, action: PayloadAction<BookSort>) {
      state.sort = action.payload
    },
    setStorageError(state, action: PayloadAction<string | null>) {
      state.storageError = action.payload
    },
    loadSavedBooks(state, action: PayloadAction<Book[]>) {
      state.books = action.payload
    },
  },
})

export const {
  addBook,
  removeBook,
  toggleReadStatus,
  setFilter,
  setCategory,
  setSearch,
  setSort,
  setStorageError,
  loadSavedBooks,
} = booksSlice.actions

export const selectVisibleBooks = createSelector(
  [(state: RootState) => state.books.books, (state: RootState) => state.books],
  (books, { filter, category, search, sort }) => {
    const query = search.toLocaleLowerCase()
    return books
      .filter((book) => {
        const matchesRead = filter === 'all' || (filter === 'read' ? book.isRead : !book.isRead)
        const matchesCategory = category === 'all' || book.category === category
        const searchable = `${book.title} ${book.author} ${book.category} ${book.description}`.toLocaleLowerCase()
        return matchesRead && matchesCategory && searchable.includes(query)
      })
      .sort((first, second) => {
        if (sort === 'title') return first.title.localeCompare(second.title)
        if (sort === 'author') return first.author.localeCompare(second.author)
        return second.addedAt.localeCompare(first.addedAt)
      })
  },
)

export default booksSlice.reducer
