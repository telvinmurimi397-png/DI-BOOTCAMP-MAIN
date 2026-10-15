import { createAsyncThunk } from '@reduxjs/toolkit'

const PRODUCTS_API_URL = 'https://fakestoreapi.com/products?limit=8'

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    const response = await fetch(PRODUCTS_API_URL)

    if (!response.ok) {
      return rejectWithValue(`The server responded with status ${response.status}.`)
    }

    return response.json()
  },
  {
    condition: (_, { getState }) => getState().products.status !== 'loading',
  },
)
