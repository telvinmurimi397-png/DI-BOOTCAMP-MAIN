import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  categories: [
    { id: 'cat-focus', name: 'Deep focus', color: 'green' },
    { id: 'cat-life', name: 'Life admin', color: 'orange' },
    { id: 'cat-learning', name: 'Learning', color: 'blue' },
  ],
  tasks: [
    { id: 'task-1', title: 'Outline the project brief', categoryId: 'cat-focus', progress: 100, completed: true },
    { id: 'task-2', title: 'Review notes from yesterday', categoryId: 'cat-learning', progress: 40, completed: false },
    { id: 'task-3', title: 'Book the dentist appointment', categoryId: 'cat-life', progress: 0, completed: false },
    { id: 'task-4', title: 'Read one chapter', categoryId: 'cat-learning', progress: 0, completed: false },
  ],
}

const trackerSlice = createSlice({
  name: 'productivity',
  initialState,
  reducers: {
    addTask: {
      reducer(state, action) {
        state.tasks.push(action.payload)
      },
      prepare({ title, categoryId }) {
        return { payload: { id: nanoid(), title, categoryId, progress: 0, completed: false } }
      },
    },
    editTask(state, action) {
      const { id, title, categoryId } = action.payload
      const task = state.tasks.find((item) => item.id === id)
      if (!task) return
      task.title = title
      task.categoryId = categoryId || null
    },
    deleteTask(state, action) {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload)
    },
    updateTaskProgress(state, action) {
      const { id, progress } = action.payload
      const task = state.tasks.find((item) => item.id === id)
      if (!task) return
      task.progress = Math.max(0, Math.min(100, Math.round(progress)))
      task.completed = task.progress === 100
    },
    toggleTaskCompletion(state, action) {
      const task = state.tasks.find((item) => item.id === action.payload)
      if (!task) return
      task.completed = !task.completed
      task.progress = task.completed ? 100 : 0
    },
    addCategory: {
      reducer(state, action) {
        state.categories.push(action.payload)
      },
      prepare(name) {
        return { payload: { id: nanoid(), name, color: 'green' } }
      },
    },
    editCategory(state, action) {
      const { id, name } = action.payload
      const category = state.categories.find((item) => item.id === id)
      if (category) category.name = name
    },
    deleteCategory(state, action) {
      state.categories = state.categories.filter((category) => category.id !== action.payload)
      state.tasks.forEach((task) => {
        if (task.categoryId === action.payload) task.categoryId = null
      })
    },
  },
})

export const {
  addTask,
  editTask,
  deleteTask,
  updateTaskProgress,
  toggleTaskCompletion,
  addCategory,
  editCategory,
  deleteCategory,
} = trackerSlice.actions

export default trackerSlice.reducer
