import { configureStore } from '@reduxjs/toolkit'
import plannerReducer from './plannerSlice.js'

export const store = configureStore({
  reducer: {
    planner: plannerReducer,
  },
})
