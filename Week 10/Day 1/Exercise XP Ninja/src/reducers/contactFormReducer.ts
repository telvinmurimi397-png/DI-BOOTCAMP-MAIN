export interface ContactFormState {
  name: string
  email: string
  message: string
}

export type ContactFormAction =
  | { type: 'updateField'; field: keyof ContactFormState; value: string }
  | { type: 'resetForm' }

export const initialContactFormState: ContactFormState = {
  name: '',
  email: '',
  message: '',
}

export function contactFormReducer(
  state: ContactFormState,
  action: ContactFormAction,
): ContactFormState {
  switch (action.type) {
    case 'updateField':
      return { ...state, [action.field]: action.value }
    case 'resetForm':
      return initialContactFormState
  }
}
