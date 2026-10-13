const TODOS_KEY = 'todo-ninja-todos'

export function loadTodos() {
  try {
    const value = localStorage.getItem(TODOS_KEY)
    const todos = value ? JSON.parse(value) : {}
    return todos && typeof todos === 'object' && !Array.isArray(todos) ? todos : {}
  } catch {
    return {}
  }
}

export function saveTodos(todosByUser) {
  try {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todosByUser))
  } catch {
    return
  }
}
