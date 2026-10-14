import { useState } from 'react'
import AddTask from './AddTask.jsx'
import TaskList from './TaskList.jsx'

function TaskBoard() {
  const [isAddingTask, setIsAddingTask] = useState(false)

  return (
    <>
      <TaskList onAddTask={() => setIsAddingTask(true)} />
      {isAddingTask && <AddTask onClose={() => setIsAddingTask(false)} />}
    </>
  )
}

export default TaskBoard
