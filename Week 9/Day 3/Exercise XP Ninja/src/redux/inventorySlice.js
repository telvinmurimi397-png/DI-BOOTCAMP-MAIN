import { createSlice } from '@reduxjs/toolkit'

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    products: [],
  },
  reducers: {
    addProduct: (state, action) => {
      state.products.push(action.payload)
    },
    updateQuantity: (state, action) => {
      const product = state.products.find((item) => item.id === action.payload.id)
      if (product) product.quantity = action.payload.quantity
    },
    removeProduct: (state, action) => {
      state.products = state.products.filter((product) => product.id !== action.payload)
    },
  },
})

export const { addProduct, updateQuantity, removeProduct } = inventorySlice.actions
export default inventorySlice.reducer
