import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTask } from '../redux/plannerSlice.js'

function AddTask({ onClose }) {
  const selectedDate = useSelector((state) => state.planner.selectedDate)
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [details, setDetails] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    dispatch(addTask(selectedDate, { title: cleanTitle, time, details: details.trim() }))
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
      title="New task"
      submitLabel="Add to day"
    />
  )
}

export function TaskEditorForm({
  details,
  onClose,
  onDetailsChange,
  onSubmit,
  onTimeChange,
  onTitleChange,
  task,
  title,
  submitLabel,
}) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header className="dialog-header">
          <div>
            <p className="section-kicker">PLAN THE DETAILS</p>
            <h2 id="task-dialog-title">{title}</h2>
          </div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form className="task-form" onSubmit={onSubmit}>
          <label htmlFor="task-title">Task name</label>
          <input
            id="task-title"
            autoFocus
            value={task.title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="What would you like to do?"
            maxLength={100}
            required
          />
          <div className="form-row">
            <div>
              <label htmlFor="task-time">Time</label>
              <input id="task-time" type="time" value={task.time} onChange={(event) => onTimeChange(event.target.value)} />
            </div>
            <span className="optional-note">Optional</span>
          </div>
          <label htmlFor="task-details">Notes</label>
          <textarea
            id="task-details"
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
            placeholder="Add a little context..."
            rows={3}
            maxLength={500}
          />
          <div className="dialog-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="save-button" type="submit" disabled={!task.title.trim()}>{submitLabel}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AddTask
