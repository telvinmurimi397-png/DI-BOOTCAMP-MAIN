export const ADD_TODO = 'todos/add'
export const TOGGLE_TODO = 'todos/toggle'
export const REMOVE_TODO = 'todos/remove'

export const addTodo = (userId, categoryId, text) => ({
  type: ADD_TODO,
  payload: {
    userId,
    categoryId,
    todo: { id: crypto.randomUUID(), text, completed: false },
  },
})

export const toggleTodo = (userId, categoryId, todoId) => ({
  type: TOGGLE_TODO,
  payload: { userId, categoryId, todoId },
})

export const removeTodo = (userId, categoryId, todoId) => ({
  type: REMOVE_TODO,
  payload: { userId, categoryId, todoId },
})
