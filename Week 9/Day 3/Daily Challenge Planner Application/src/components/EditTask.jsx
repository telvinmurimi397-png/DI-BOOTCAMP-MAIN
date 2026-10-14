import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { editTask } from '../redux/plannerSlice.js'
import { TaskEditorForm } from './AddTask.jsx'

function EditTask({ task, onClose }) {
  const selectedDate = useSelector((state) => state.planner.selectedDate)
  const dispatch = useDispatch()
  const [title, setTitle] = useState(task.title)
  const [time, setTime] = useState(task.time || '')
  const [details, setDetails] = useState(task.details || '')

  function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    dispatch(editTask({ date: selectedDate, taskId: task.id, updates: {
      title: cleanTitle,
      time,
      details: details.trim(),
    } }))
    onClose()
  }

  return (
    <TaskEditorForm
      details={details}
      onClose={onClose}
      onDetailsChange={setDetails}
      onSubmit={handleSubmit}
      onTimeChange={setTime}
      onTitleChange={setTitle}
      task={{ title, time }}
      title="Edit task"
      submitLabel="Save changes"
    />
  )
}

export default EditTask
