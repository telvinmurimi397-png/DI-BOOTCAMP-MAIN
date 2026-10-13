export const ADD_TODO = 'todos/add'
export const TOGGLE_TODO = 'todos/toggle'
export const REMOVE_TODO = 'todos/remove'

export const addTodo = (categoryId, text) => ({
  type: ADD_TODO,
  payload: {
    categoryId,
    todo: {
      id: `${Date.now()}-${Math.random()}`,
      text,
      completed: false,
    },
  },
})

export const toggleTodo = (categoryId, todoId) => ({
  type: TOGGLE_TODO,
  payload: { categoryId, todoId },
})

export const removeTodo = (categoryId, todoId) => ({
  type: REMOVE_TODO,
  payload: { categoryId, todoId },
})
