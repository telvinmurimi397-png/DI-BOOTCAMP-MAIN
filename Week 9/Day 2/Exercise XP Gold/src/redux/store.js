import { legacy_createStore as createStore } from 'redux'
import { todosReducer } from './reducer.js'

export const store = createStore(todosReducer)
