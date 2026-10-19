import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [
    { id: 'todo-1', text: 'Review selector memoization', completed: true },
    { id: 'todo-2', text: 'Plan the next study session', completed: false },
    { id: 'todo-3', text: 'Build one small thing', completed: false },
  ],
  visibilityFilter: 'All',
}

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.push(action.payload)
      },
      prepare(text) {
        return { payload: { id: nanoid(), text, completed: false } }
      },
    },
    toggleTodo(state, action) {
      const todo = state.items.find((item) => item.id === action.payload)
      if (todo) todo.completed = !todo.completed
    },
    removeTodo(state, action) {
      state.items = state.items.filter((todo) => todo.id !== action.payload)
    },
    setVisibilityFilter(state, action) {
      state.visibilityFilter = action.payload
    },
  },
})

export const { addTodo, toggleTodo, removeTodo, setVisibilityFilter } = todosSlice.actions
export default todosSlice.reducer
