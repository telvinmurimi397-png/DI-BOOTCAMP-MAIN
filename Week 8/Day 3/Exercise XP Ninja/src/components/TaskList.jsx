import { useTasks } from '../context/TaskContext.jsx'

export default function TaskList() {
  const { tasks, dispatch } = useTasks()
  const remainingCount = tasks.filter((task) => !task.completed).length

  return (
    <div className="task-list-section">
      <div className="list-heading">
        <h2>Your tasks</h2>
        <span className="task-count" aria-live="polite">
          {remainingCount} remaining
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Add one above to get started.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className={`task-item${task.completed ? ' completed' : ''}`} key={task.id}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => dispatch({ type: 'TOGGLE_TASK', id: task.id })}
                />
                <span>{task.text}</span>
              </label>
              <button
                className="remove-button"
                type="button"
                onClick={() => dispatch({ type: 'REMOVE_TASK', id: task.id })}
                aria-label={`Remove ${task.text}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
