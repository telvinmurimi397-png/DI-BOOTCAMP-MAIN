import { useState } from 'react'
import { useTasks } from '../context/TaskContext.jsx'

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function AddTaskForm() {
  const [text, setText] = useState('')
  const { dispatch } = useTasks()

  function handleSubmit(event) {
    event.preventDefault()
    const taskText = text.trim()

    if (!taskText) return

    dispatch({
      type: 'ADD_TASK',
      task: {
        id: createTaskId(),
        text: taskText,
        completed: false,
      },
    })
    setText('')
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label htmlFor="new-task">Add a task</label>
      <div className="form-controls">
        <input
          id="new-task"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. Prepare tomorrow's lesson"
          maxLength={160}
        />
        <button className="add-button" type="submit" disabled={!text.trim()}>
          Add task
        </button>
      </div>
    </form>
  )
}
