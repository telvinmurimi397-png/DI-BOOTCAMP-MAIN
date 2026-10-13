import { applyMiddleware, legacy_createStore as createStore } from 'redux'
import { ADD_TASK, DELETE_TASK, EDIT_TASK, SELECT_DATE } from './actions.js'
import { plannerReducer, storageKey } from './reducer.js'

const persistPlanner = ({ getState }) => (next) => (action) => {
  const result = next(action)
  if ([SELECT_DATE, ADD_TASK, EDIT_TASK, DELETE_TASK].includes(action.type)) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(getState()))
    } catch {
      return result
    }
  }
  return result
}

export const store = createStore(plannerReducer, applyMiddleware(persistPlanner))
