import {
  ADD_TODO,
  CLEAR_COMPLETED,
  REMOVE_TODO,
  TOGGLE_TODO,
} from './actions.js'

const initialState = [
  { id: 'welcome-1', text: 'Choose the one thing that matters today', completed: false },
  { id: 'welcome-2', text: 'Break it into a first small step', completed: true },
  { id: 'welcome-3', text: 'Make a little room to think', completed: false },
]

export function todosReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, { ...action.payload, completed: false }]
    case TOGGLE_TODO:
      return state.map((todo) =>
        todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo,
      )
    case REMOVE_TODO:
      return state.filter((todo) => todo.id !== action.payload)
    case CLEAR_COMPLETED:
      return state.filter((todo) => !todo.completed)
    default:
      return state
  }
}