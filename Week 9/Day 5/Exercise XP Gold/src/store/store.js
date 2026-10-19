import { configureStore } from '@reduxjs/toolkit'
import shoppingCartReducer from './shoppingCartSlice.js'

export const store = configureStore({
  reducer: {
    shoppingCart: shoppingCartReducer,
  },
})
