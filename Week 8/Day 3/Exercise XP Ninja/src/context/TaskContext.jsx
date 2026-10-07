import { createContext, useContext, useReducer } from 'react'

const TaskContext = createContext(null)

function taskReducer(tasks, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return [action.task, ...tasks]
    case 'TOGGLE_TASK':
      return tasks.map((task) =>
        task.id === action.id ? { ...task, completed: !task.completed } : task,
      )
    case 'REMOVE_TASK':
      return tasks.filter((task) => task.id !== action.id)
    default:
      return tasks
  }
}

export function TaskProvider({ children }) {
  const [tasks, dispatch] = useReducer(taskReducer, [])

  return (
    <TaskContext.Provider value={{ tasks, dispatch }}>
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
