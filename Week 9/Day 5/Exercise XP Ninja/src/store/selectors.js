import { createSelector } from '@reduxjs/toolkit'

const selectAllTodoItems = (state) => state.todos.items
export const selectVisibilityFilter = (state) => state.todos.visibilityFilter

export const selectTodos = createSelector(
  [selectAllTodoItems, selectVisibilityFilter],
  (todos, visibilityFilter) => {
    if (visibilityFilter === 'Active') return todos.filter((todo) => !todo.completed)
    if (visibilityFilter === 'Completed') return todos.filter((todo) => todo.completed)
    return todos
  },
)

export const selectFilteredTodosCount = createSelector(
  [selectTodos],
  (todos) => todos.length,
)
