import { configureStore } from '@reduxjs/toolkit'
import ageReducer from './ageSlice.js'

export const store = configureStore({
  reducer: {
    age: ageReducer,
  },
})
