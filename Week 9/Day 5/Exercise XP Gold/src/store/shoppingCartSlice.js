import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  products: [
    { id: 'p1', title: 'The Creative Act', author: 'Rick Rubin', category: 'Creativity', price: 24.00, isbn: '9780593652886' },
    { id: 'p2', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', category: 'Nature', price: 18.50, isbn: '9781571313560' },
    { id: 'p3', title: 'Ways of Seeing', author: 'John Berger', category: 'Art & Culture', price: 16.00, isbn: '9780140135152' },
    { id: 'p4', title: 'A Field Guide to Getting Lost', author: 'Rebecca Solnit', category: 'Essays', price: 17.00, isbn: '9780143037248' },
    { id: 'p5', title: 'The Book of Delights', author: 'Ross Gay', category: 'Essays', price: 15.00, isbn: '9781616207922' },
    { id: 'p6', title: 'The Living Mountain', author: 'Nan Shepherd', category: 'Nature', price: 14.50, isbn: '9781846972246' },
  ],
  items: [],
}

const shoppingCartSlice = createSlice({
  name: 'shoppingCart',
  initialState,
  reducers: {
    addProductToCart(state, action) {
      const existingItem = state.items.find((item) => item.productId === action.payload)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ productId: action.payload, quantity: 1 })
      }
    },
    updateCartQuantity(state, action) {
      const { productId, quantity } = action.payload
      const item = state.items.find((cartItem) => cartItem.productId === productId)
      if (!item) return
      if (quantity <= 0) {
        state.items = state.items.filter((cartItem) => cartItem.productId !== productId)
      } else {
        item.quantity = quantity
      }
    },
  },
})

export const { addProductToCart, updateCartQuantity } = shoppingCartSlice.actions
export default shoppingCartSlice.reducer
