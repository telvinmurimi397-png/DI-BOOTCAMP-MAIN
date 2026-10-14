import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
  },
  reducers: {
    loginUser: (state, action) => {
      state.isAuthenticated = true
      state.user = action.payload
    },
    logoutUser: (state) => {
      state.isAuthenticated = false
      state.user = null
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
  },
})

export const { loginUser, logoutUser, setUser } = authSlice.actions
export default authSlice.reducer
