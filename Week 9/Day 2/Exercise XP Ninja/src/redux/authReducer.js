import { authService } from '../services/authService.js'
import { AUTH_CLEAR_ERROR, AUTH_FAILURE, AUTH_LOGOUT, AUTH_REQUEST, AUTH_SUCCESS } from './authActions.js'

const restoredSession = authService.restoreSession()
const initialState = {
  status: restoredSession ? 'authenticated' : 'anonymous',
  user: restoredSession?.user ?? null,
  token: restoredSession?.token ?? null,
  error: null,
}

export function authReducer(state = initialState, action) {
  switch (action.type) {
    case AUTH_REQUEST:
      return { ...state, status: 'loading', error: null }
    case AUTH_SUCCESS:
      return {
        status: 'authenticated',
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      }
    case AUTH_FAILURE:
      return { ...state, status: 'anonymous', error: action.payload }
    case AUTH_CLEAR_ERROR:
      return { ...state, error: null }
    case AUTH_LOGOUT:
      return { status: 'anonymous', user: null, token: null, error: null }
    default:
      return state
  }
}
