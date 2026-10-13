import { toDateKey } from '../dateUtils.js'
import { ADD_TASK, DELETE_TASK, EDIT_TASK, SELECT_DATE } from './actions.js'

const storageKey = 'daymark-planner-state'

function loadState() {
  const today = toDateKey(new Date())
  const fallback = { selectedDate: today, tasksByDate: {} }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey))
    if (!saved || typeof saved !== 'object') return fallback
    return {
      selectedDate: typeof saved.selectedDate === 'string' ? saved.selectedDate : today,
      tasksByDate: saved.tasksByDate && typeof saved.tasksByDate === 'object'
        ? saved.tasksByDate
        : {},
    }
  } catch {
    return fallback
  }
}

const initialState = loadState()

export function plannerReducer(state = initialState, action) {
  switch (action.type) {
    case SELECT_DATE:
      return { ...state, selectedDate: action.payload }
    case ADD_TASK:
      return {
        ...state,
        tasksByDate: {
          ...state.tasksByDate,
          [action.payload.date]: [
            ...(state.tasksByDate[action.payload.date] || []),
            action.payload.task,
          ],
        },
      }
    case EDIT_TASK: {
      const { date, taskId, updates } = action.payload
      const tasks = state.tasksByDate[date]
      if (!tasks?.some((task) => task.id === taskId)) return state
      return {
        ...state,
        tasksByDate: {
          ...state.tasksByDate,
          [date]: tasks.map((task) => task.id === taskId ? { ...task, ...updates } : task),
        },
      }
    }
    case DELETE_TASK: {
      const { date, taskId } = action.payload
      const tasks = state.tasksByDate[date]
      if (!tasks?.some((task) => task.id === taskId)) return state
      return {
        ...state,
        tasksByDate: {
          ...state.tasksByDate,
          [date]: tasks.filter((task) => task.id !== taskId),
        },
      }
    }
    default:
      return state
  }
}

export { storageKey }
