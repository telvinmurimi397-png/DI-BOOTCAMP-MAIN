import { configureStore } from '@reduxjs/toolkit'
import booksReducer from './booksSlice.js'

export const store = configureStore({
  reducer: {
    books: booksReducer,
  },
})
