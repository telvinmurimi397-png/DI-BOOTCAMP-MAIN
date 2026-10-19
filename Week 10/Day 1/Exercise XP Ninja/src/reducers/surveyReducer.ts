export type SurveyStatus = 'initial' | 'submitting' | 'completed'

export interface SurveyState {
  status: SurveyStatus
  feedback: string
  hasStarted: boolean
}

export type SurveyAction =
  | { type: 'start' }
  | { type: 'changeFeedback'; feedback: string }
  | { type: 'submit' }
  | { type: 'complete' }
  | { type: 'reset' }

export const initialSurveyState: SurveyState = {
  status: 'initial',
  feedback: '',
  hasStarted: false,
}

export function surveyReducer(_state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'start':
      return { status: 'initial', feedback: '', hasStarted: true }
    case 'changeFeedback':
      return { ..._state, status: 'initial', feedback: action.feedback }
    case 'submit':
      return { ..._state, status: 'submitting' }
    case 'complete':
      return { ..._state, status: 'completed' }
    case 'reset':
      return initialSurveyState
  }
}
