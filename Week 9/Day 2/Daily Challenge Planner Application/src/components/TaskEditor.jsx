import { useState } from 'react'

function TaskEditor({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task.title || '')
  const [time, setTime] = useState(task.time || '')
  const [details, setDetails] = useState(task.details || '')

  function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    onSave({ title: cleanTitle, time, details: details.trim() })
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header className="dialog-header">
          <div>
            <p className="section-kicker">PLAN THE DETAILS</p>
            <h2 id="task-dialog-title">{task.id ? 'Edit task' : 'New task'}</h2>
          </div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form className="task-form" onSubmit={handleSubmit}>
          <label htmlFor="task-title">Task name</label>
          <input
            id="task-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What would you like to do?"
            maxLength={100}
            required
          />
          <div className="form-row">
            <div>
              <label htmlFor="task-time">Time</label>
              <input id="task-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <span className="optional-note">Optional</span>
          </div>
          <label htmlFor="task-details">Notes</label>
          <textarea
            id="task-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Add a little context..."
            rows={3}
            maxLength={500}
          />
          <div className="dialog-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="save-button" type="submit" disabled={!title.trim()}>{task.id ? 'Save changes' : 'Add to day'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default TaskEditor
