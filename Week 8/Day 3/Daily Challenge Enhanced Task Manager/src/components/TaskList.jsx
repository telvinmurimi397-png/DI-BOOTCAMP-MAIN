import { useEffect, useRef, useState } from 'react'
import { useTasks } from '../context/TaskContext.jsx'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function matchesFilter(task, filter) {
  if (filter === 'active') return !task.completed
  if (filter === 'completed') return task.completed
  return true
}

export default function TaskList() {
  const { tasks, filter, dispatch } = useTasks()
  const [editingId, setEditingId] = useState(null)
  const editInputRef = useRef(null)
  const remainingCount = tasks.filter((task) => !task.completed).length
  const visibleTasks = tasks.filter((task) => matchesFilter(task, filter))

  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  function saveEdit(id) {
    const text = editInputRef.current?.value.trim()
    if (!text) {
      editInputRef.current?.focus()
      return
    }

    dispatch({ type: 'EDIT_TASK', id, text })
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleEditKeyDown(event, id) {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveEdit(id)
    }
    if (event.key === 'Escape') cancelEdit()
  }

  return (
    <div className="task-list-section">
      <div className="list-heading">
        <div>
          <h2>Your tasks</h2>
          <p className="task-summary" aria-live="polite">
            {remainingCount} active · {tasks.length - remainingCount} completed
          </p>
        </div>
        <div className="filters" role="group" aria-label="Filter tasks">
          {filters.map((option) => (
            <button
              className={`filter-button${filter === option.value ? ' selected' : ''}`}
              type="button"
              key={option.value}
              aria-pressed={filter === option.value}
              onClick={() => dispatch({ type: 'FILTER_TASKS', filter: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Add one above to get started.</p>
      ) : visibleTasks.length === 0 ? (
        <p className="empty-state">No {filter} tasks to show.</p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <li className={`task-item${task.completed ? ' completed' : ''}`} key={task.id}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => dispatch({ type: 'TOGGLE_TASK', id: task.id })}
                  aria-label={`${task.completed ? 'Mark' : 'Complete'} ${task.text}`}
                />
              </label>

              {editingId === task.id ? (
                <form
                  className="edit-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveEdit(task.id)
                  }}
                >
                  <input
                    className="edit-input"
                    ref={editInputRef}
                    key={task.id}
                    defaultValue={task.text}
                    maxLength={160}
                    aria-label={`Edit ${task.text}`}
                    onKeyDown={(event) => handleEditKeyDown(event, task.id)}
                  />
                  <button className="action-button save-button" type="submit">Save</button>
                  <button className="action-button cancel-button" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="task-text">{task.text}</span>
                  <div className="task-actions">
                    <button
                      className="action-button edit-button"
                      type="button"
                      onClick={() => setEditingId(task.id)}
                      aria-label={`Edit ${task.text}`}
                    >
                      Edit
                    </button>
                    <button
                      className="action-button remove-button"
                      type="button"
                      onClick={() => dispatch({ type: 'REMOVE_TASK', id: task.id })}
                      aria-label={`Remove ${task.text}`}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
