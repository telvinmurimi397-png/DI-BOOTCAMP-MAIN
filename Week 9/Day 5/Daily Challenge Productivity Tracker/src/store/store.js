import { configureStore } from '@reduxjs/toolkit'
import productivityReducer from './trackerSlice.js'

export const store = configureStore({
  reducer: {
    productivity: productivityReducer,
  },
})
