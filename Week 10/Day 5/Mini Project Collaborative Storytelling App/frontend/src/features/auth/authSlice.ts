import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiRequest, RequestError } from '../../app/api'
import type { RootState } from '../../app/store'
import type { User } from '../../../../types/models'

interface Credentials {
  email: string
  password: string
}

interface Registration extends Credentials {
  username: string
}

interface SessionResponse {
  accessToken: string
  user: User
}

interface AuthState {
  user: User | null
  accessToken: string | null
  checking: boolean
  error: string | null
}

const initialState: AuthState = { user: null, accessToken: null, checking: true, error: null }

export const signIn = createAsyncThunk<SessionResponse, Credentials, { rejectValue: string }>(
  'auth/signIn',
  async (input, { rejectWithValue }) => {
    try {
      return await apiRequest<SessionResponse>('/auth/login', {
        method: 'POST', body: JSON.stringify(input),
      })
    } catch (error) {
      return rejectWithValue(error instanceof RequestError ? error.message : 'Unable to sign in. Please try again.')
    }
  },
)

export const signUp = createAsyncThunk<SessionResponse, Registration, { rejectValue: string }>(
  'auth/signUp',
  async (input, { rejectWithValue }) => {
    try {
      return await apiRequest<SessionResponse>('/auth/register', {
        method: 'POST', body: JSON.stringify(input),
      })
    } catch (error) {
      return rejectWithValue(error instanceof RequestError ? error.message : 'Unable to create your account. Please try again.')
    }
  },
)

let sessionRestore: Promise<SessionResponse> | null = null

export const restoreSession = createAsyncThunk<SessionResponse, void, { rejectValue: string }>(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      sessionRestore ??= apiRequest<SessionResponse>('/auth/refresh', { method: 'POST' })
      return await sessionRestore
    } catch (error) {
      return rejectWithValue(error instanceof RequestError ? error.message : 'Your session has expired.')
    } finally {
      sessionRestore = null
    }
  },
)

export const signOut = createAsyncThunk<void, void, { state: RootState; rejectValue: string }>(
  'auth/signOut',
  async (_, { getState, rejectWithValue }) => {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' }, getState().auth.accessToken)
    } catch (error) {
      return rejectWithValue(error instanceof RequestError ? error.message : 'Unable to sign out cleanly.')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearSession(state) {
      state.user = null
      state.accessToken = null
      state.checking = false
    },
    updateSession(state, action: PayloadAction<SessionResponse | null>) {
      state.accessToken = action.payload?.accessToken ?? null
      if (action.payload) state.user = action.payload.user
      else state.user = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signIn.pending, (state) => { state.error = null })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.checking = false
      })
      .addCase(signIn.rejected, (state, action) => {
        state.checking = false
        state.error = action.payload ?? 'Unable to sign in.'
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.checking = false
        state.error = null
      })
      .addCase(signUp.pending, (state) => { state.error = null })
      .addCase(signUp.rejected, (state, action) => {
        state.checking = false
        state.error = action.payload ?? 'Unable to create your account.'
      })
      .addCase(restoreSession.pending, (state) => { state.checking = true })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.checking = false
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.checking = false
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
      })
      .addCase(signOut.rejected, (state, action) => { state.error = action.payload ?? 'Unable to sign out.' })
  },
})

export const { clearSession, updateSession } = authSlice.actions
export default authSlice.reducer
