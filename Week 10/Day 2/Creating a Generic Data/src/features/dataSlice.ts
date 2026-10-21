import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface DataState {
  data: unknown[]
  loading: boolean
  error: string | null
}

const initialState: DataState = {
  data: [],
  loading: false,
  error: null,
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true
      state.error = null
    },
    fetchSuccess: (state, action: PayloadAction<unknown[]>) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    fetchFailure: (state, action: PayloadAction<string>) => {
      state.data = []
      state.loading = false
      state.error = action.payload
    },
  },
})

export const { fetchStart, fetchSuccess, fetchFailure } = dataSlice.actions
export default dataSlice.reducer
