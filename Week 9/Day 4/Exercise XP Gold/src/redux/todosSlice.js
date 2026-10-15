import { createAsyncThunk, createSlice, nanoid } from '@reduxjs/toolkit'

const TODOS_API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=6'

export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { dispatch, rejectWithValue }) => {
    const response = await fetch(TODOS_API_URL)

    if (!response.ok) {
      return rejectWithValue(`The server responded with status ${response.status}.`)
    }

    const todos = await response.json()
    dispatch(setTodos(todos))
    return todos
  },
  {
    condition: (_, { getState }) => getState().todos.status !== 'loading',
  },
)

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    todos: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    addTodo: {
      reducer: (state, action) => {
        state.todos.unshift(action.payload)
      },
      prepare: (title) => ({
        payload: {
          id: nanoid(),
          title,
          completed: false,
        },
      }),
    },
    removeTodo: (state, action) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload)
    },
    toggleTodo: (state, action) => {
      const todo = state.todos.find((item) => item.id === action.payload)
      if (todo) todo.completed = !todo.completed
    },
    setTodos: (state, action) => {
      state.todos = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTodos.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message ?? 'An unknown error occurred.'
      })
  },
})

export const { addTodo, removeTodo, toggleTodo, setTodos } = todosSlice.actions
export default todosSlice.reducer
