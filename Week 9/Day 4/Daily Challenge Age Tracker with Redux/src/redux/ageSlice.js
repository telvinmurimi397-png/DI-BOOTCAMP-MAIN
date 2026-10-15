import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const UPDATE_DELAY_MS = 1000

function delay() {
  return new Promise((resolve) => {
    setTimeout(resolve, UPDATE_DELAY_MS)
  })
}

export const ageUpAsync = createAsyncThunk('age/ageUpAsync', async () => {
  await delay()
})

export const ageDownAsync = createAsyncThunk('age/ageDownAsync', async () => {
  await delay()
})

const ageSlice = createSlice({
  name: 'age',
  initialState: {
    age: 25,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ageUpAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(ageUpAsync.fulfilled, (state) => {
        state.age += 1
        state.loading = false
      })
      .addCase(ageUpAsync.rejected, (state) => {
        state.loading = false
      })
      .addCase(ageDownAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(ageDownAsync.fulfilled, (state) => {
        state.age = Math.max(0, state.age - 1)
        state.loading = false
      })
      .addCase(ageDownAsync.rejected, (state) => {
        state.loading = false
      })
  },
})

export default ageSlice.reducer
