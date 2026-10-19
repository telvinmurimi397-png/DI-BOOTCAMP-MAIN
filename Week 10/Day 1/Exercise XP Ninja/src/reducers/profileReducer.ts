export interface Profile {
  name: string
  bio: string
}

export type ProfileStatus = 'initial' | 'loading' | 'success' | 'error'

export interface ProfileState {
  status: ProfileStatus
  profile: Profile | null
  error: string | null
}

export type ProfileAction =
  | { type: 'updateStarted' }
  | { type: 'updateSucceeded'; profile: Profile }
  | { type: 'updateFailed'; error: string }
  | { type: 'reset' }

export const initialProfileState: ProfileState = {
  status: 'initial',
  profile: null,
  error: null,
}

export function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'updateStarted':
      return { ...state, status: 'loading', error: null }
    case 'updateSucceeded':
      return { status: 'success', profile: action.profile, error: null }
    case 'updateFailed':
      return { ...state, status: 'error', error: action.error }
    case 'reset':
      return initialProfileState
  }
}
