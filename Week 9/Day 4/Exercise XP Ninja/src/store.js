import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/auth/authSlice.js'
import cartReducer from './features/cart/cartSlice.js'
import productsReducer from './features/products/productSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
  },
})
