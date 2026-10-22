import type { ApiError, User } from '../../../types/models'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export class RequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequestError'
  }
}

interface SessionUpdate {
  accessToken: string
  user: User
}

async function errorFrom(response: Response): Promise<RequestError> {
  const data = await response.json().catch(() => ({})) as Partial<ApiError>
  return new RequestError(data.message || 'The request could not be completed.')
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token: string | null = null,
  updateSession?: (session: SessionUpdate | null) => void,
): Promise<T> {
  const send = (accessToken: string | null) => fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  })

  let response: Response
  try {
    response = await send(token)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new RequestError('Could not reach the storytelling API. Check that the backend is running and allows this frontend origin.')
    }
    throw error
  }
  if (response.status === 401 && token && updateSession) {
    try {
      const refreshed = await fetch(`${apiBase}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!refreshed.ok) throw await errorFrom(refreshed)
      const session = await refreshed.json() as SessionUpdate
      updateSession(session)
      response = await send(session.accessToken)
    } catch (error) {
      updateSession(null)
      throw error instanceof Error ? error : new RequestError('Your session expired. Please sign in again.')
    }
  }
  if (!response.ok) throw await errorFrom(response)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
