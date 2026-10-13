import { authService } from '../services/authService.js'

export const AUTH_REQUEST = 'auth/request'
export const AUTH_SUCCESS = 'auth/success'
export const AUTH_FAILURE = 'auth/failure'
export const AUTH_LOGOUT = 'auth/logout'
export const AUTH_CLEAR_ERROR = 'auth/clearError'

export const clearAuthError = () => ({ type: AUTH_CLEAR_ERROR })

export const register = (credentials) => async (dispatch) => {
  dispatch({ type: AUTH_REQUEST })
  try {
    const session = await authService.register(credentials)
    dispatch({ type: AUTH_SUCCESS, payload: session })
  } catch (error) {
    dispatch({ type: AUTH_FAILURE, payload: error.message })
  }
}

export const login = (credentials) => async (dispatch) => {
  dispatch({ type: AUTH_REQUEST })
  try {
    const session = await authService.login(credentials)
    dispatch({ type: AUTH_SUCCESS, payload: session })
  } catch (error) {
    dispatch({ type: AUTH_FAILURE, payload: error.message })
  }
}

export const logout = () => (dispatch) => {
  authService.logout()
  dispatch({ type: AUTH_LOGOUT })
}
