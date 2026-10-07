import { createContext, useContext, useReducer } from 'react'

const TaskContext = createContext(null)

const initialState = {
  tasks: [],
  filter: 'all',
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] }
    case 'EDIT_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, text: action.text } : task,
        ),
      }
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, completed: !task.completed } : task,
        ),
      }
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
      }
    case 'FILTER_TASKS':
      return { ...state, filter: action.filter }
    default:
      return state
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  return (
    <TaskContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)

  if (context === null) {
    throw new Error('useTasks must be used within a TaskProvider')
  }

  return context
}
