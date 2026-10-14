import { configureStore } from '@reduxjs/toolkit'
import inventoryReducer from './inventorySlice.js'

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
  },
})
