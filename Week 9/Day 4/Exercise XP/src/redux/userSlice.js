import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const USER_API_URL = 'https://jsonplaceholder.typicode.com/users/1'

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    const response = await fetch(USER_API_URL)

    if (!response.ok) {
      return rejectWithValue(`The server responded with status ${response.status}.`)
    }

    return response.json()
  },
  {
    condition: (_, { getState }) => getState().user.status !== 'loading',
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message ?? 'An unknown error occurred.'
      })
  },
})

export default userSlice.reducer
