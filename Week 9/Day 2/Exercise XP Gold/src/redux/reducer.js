import { ADD_TODO, REMOVE_TODO, TOGGLE_TODO } from './actions.js'

const initialState = {
  categories: [
    {
      id: 'personal',
      name: 'Personal',
      description: 'Life outside the to-do list',
      todos: [
        { id: 'personal-1', text: 'Pick up a few groceries', completed: false },
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
  ],
}

function updateCategory(state, categoryId, updateTodos) {
  const categoryExists = state.categories.some((category) => category.id === categoryId)
  if (!categoryExists) return state

  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? { ...category, todos: updateTodos(category.todos) }
        : category,
    ),
  }
}

export function todosReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TODO:
      return updateCategory(state, action.payload.categoryId, (todos) => [
        ...todos,
        action.payload.todo,
      ])
    case TOGGLE_TODO:
      return updateCategory(state, action.payload.categoryId, (todos) =>
        todos.map((todo) =>
          todo.id === action.payload.todoId
            ? { ...todo, completed: !todo.completed }
            : todo,
        ),
      )
    case REMOVE_TODO:
      return updateCategory(state, action.payload.categoryId, (todos) =>
        todos.filter((todo) => todo.id !== action.payload.todoId),
      )
    default:
      return state
  }
}
