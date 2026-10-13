import { AUTH_SUCCESS } from './authActions.js'
import { ADD_TODO, REMOVE_TODO, TOGGLE_TODO } from './todoActions.js'
import { loadTodos } from '../services/todoStorage.js'

function createCategories() {
  return [
    {
      id: 'personal',
      name: 'Personal',
      description: 'Life outside the to-do list',
      todos: [
        { id: 'personal-1', text: 'Make a little room to think', completed: false },
        { id: 'personal-2', text: 'Call home', completed: true },
      ],
    },
    {
      id: 'work',
      name: 'Work',
      description: 'Make progress, one step at a time',
      todos: [
        { id: 'work-1', text: 'Send the project update', completed: false },
        { id: 'work-2', text: 'Review the new brief', completed: false },
      ],
    },
    {
      id: 'learning',
      name: 'Learning',
      description: 'Keep curiosity in the plan',
      todos: [
        { id: 'learning-1', text: 'Practice Redux patterns', completed: false },
      ],
    },
  ]
}

function updateCategory(state, userId, categoryId, updateTodos) {
  const userCategories = state[userId]
  if (!userCategories) return state
  if (!userCategories.some((category) => category.id === categoryId)) return state

  return {
    ...state,
    [userId]: userCategories.map((category) =>
      category.id === categoryId
        ? { ...category, todos: updateTodos(category.todos) }
        : category,
    ),
  }
}

export function todosReducer(state = loadTodos(), action) {
  switch (action.type) {
    case AUTH_SUCCESS: {
      const { id } = action.payload.user
      return state[id] ? state : { ...state, [id]: createCategories() }
    }
    case ADD_TODO:
      return updateCategory(state, action.payload.userId, action.payload.categoryId, (todos) => [
        ...todos,
        action.payload.todo,
      ])
    case TOGGLE_TODO:
      return updateCategory(state, action.payload.userId, action.payload.categoryId, (todos) =>
        todos.map((todo) =>
          todo.id === action.payload.todoId
            ? { ...todo, completed: !todo.completed }
            : todo,
        ),
      )
    case REMOVE_TODO:
      return updateCategory(state, action.payload.userId, action.payload.categoryId, (todos) =>
        todos.filter((todo) => todo.id !== action.payload.todoId),
      )
    default:
      return state
  }
}
