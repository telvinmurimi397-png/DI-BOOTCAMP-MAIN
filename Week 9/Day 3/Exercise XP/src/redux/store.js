import { configureStore } from '@reduxjs/toolkit'
import todosReducer from './todoSlice.js'

export const store = configureStore({
  reducer: {
    todos: todosReducer,
  },
})
