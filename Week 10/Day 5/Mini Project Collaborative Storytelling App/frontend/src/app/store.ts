import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import storiesReducer from '../features/stories/storiesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stories: storiesReducer,
  },
  devTools: import.meta.env.DEV,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
