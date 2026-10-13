import { applyMiddleware, combineReducers, legacy_createStore as createStore } from 'redux'
import { authReducer } from './authReducer.js'
import { ADD_TODO, REMOVE_TODO, TOGGLE_TODO } from './todoActions.js'
import { todosReducer } from './todosReducer.js'
import { saveTodos } from '../services/todoStorage.js'

const rootReducer = combineReducers({
  auth: authReducer,
  todosByUser: todosReducer,
})

const thunkMiddleware = ({ dispatch, getState }) => (next) => (action) =>
  typeof action === 'function' ? action(dispatch, getState) : next(action)

const persistTodosMiddleware = ({ getState }) => (next) => (action) => {
  const result = next(action)
  if ([ADD_TODO, REMOVE_TODO, TOGGLE_TODO, 'auth/success'].includes(action.type)) {
    saveTodos(getState().todosByUser)
  }
  return result
}

export const store = createStore(rootReducer, applyMiddleware(thunkMiddleware, persistTodosMiddleware))
