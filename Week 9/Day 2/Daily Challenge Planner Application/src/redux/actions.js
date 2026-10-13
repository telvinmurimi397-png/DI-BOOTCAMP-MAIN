export const SELECT_DATE = 'planner/selectDate'
export const ADD_TASK = 'planner/addTask'
export const EDIT_TASK = 'planner/editTask'
export const DELETE_TASK = 'planner/deleteTask'

export const selectDate = (date) => ({ type: SELECT_DATE, payload: date })

export const addTask = (date, task) => ({
  type: ADD_TASK,
  payload: {
    date,
    task: { ...task, id: `${Date.now()}-${Math.random()}` },
  },
})

export const editTask = (date, taskId, updates) => ({
  type: EDIT_TASK,
  payload: { date, taskId, updates },
})

export const deleteTask = (date, taskId) => ({
  type: DELETE_TASK,
  payload: { date, taskId },
})
