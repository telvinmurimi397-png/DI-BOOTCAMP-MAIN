import { createSlice, nanoid } from '@reduxjs/toolkit'
import { toDateKey } from '../dateUtils.js'

const plannerSlice = createSlice({
  name: 'planner',
  initialState: {
    selectedDate: toDateKey(new Date()),
    tasksByDate: {},
  },
  reducers: {
    selectDate: (state, action) => {
      state.selectedDate = action.payload
    },
    addTask: {
      reducer: (state, action) => {
        const { date, task } = action.payload
        if (!state.tasksByDate[date]) state.tasksByDate[date] = []
        state.tasksByDate[date].push(task)
      },
      prepare: (date, task) => ({
        payload: {
          date,
          task: { ...task, id: nanoid() },
        },
      }),
    },
    editTask: (state, action) => {
      const { date, taskId, updates } = action.payload
      const task = state.tasksByDate[date]?.find((item) => item.id === taskId)
      if (task) Object.assign(task, updates)
    },
    deleteTask: (state, action) => {
      const { date, taskId } = action.payload
      if (state.tasksByDate[date]) {
        state.tasksByDate[date] = state.tasksByDate[date].filter((task) => task.id !== taskId)
      }
    },
  },
})

export const { selectDate, addTask, editTask, deleteTask } = plannerSlice.actions
export default plannerSlice.reducer
