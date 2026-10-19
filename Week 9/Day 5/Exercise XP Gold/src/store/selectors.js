import { createSelector } from '@reduxjs/toolkit'

export const selectProducts = createSelector(
  [(state) => state.shoppingCart.products],
  (products) => products,
)

const selectCartState = (state) => state.shoppingCart.items

export const selectCartItems = createSelector(
  [selectProducts, selectCartState],
  (products, cartState) => cartState.flatMap((item) => {
    const product = products.find((availableProduct) => availableProduct.id === item.productId)
    return product ? [{ ...product, productId: item.productId, quantity: item.quantity }] : []
  }),
)

export const calculateTotalPrice = createSelector(
  [selectCartItems],
  (cartItems) => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
)
