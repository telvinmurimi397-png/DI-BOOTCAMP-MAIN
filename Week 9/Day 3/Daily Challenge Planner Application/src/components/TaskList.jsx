import { useState } from 'react'
import { useSelector } from 'react-redux'
import { formatDayLabel } from '../dateUtils.js'
import DeleteTask from './DeleteTask.jsx'
import EditTask from './EditTask.jsx'

function TaskList({ onAddTask }) {
  const selectedDate = useSelector((state) => state.planner.selectedDate)
  const tasks = useSelector((state) => state.planner.tasksByDate[selectedDate] || [])
  const [editingTaskId, setEditingTaskId] = useState(null)
  const orderedTasks = [...tasks].sort((first, second) => {
    if (!first.time) return second.time ? 1 : 0
    if (!second.time) return -1
    return first.time.localeCompare(second.time)
  })
  const dateTitle = formatDayLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })
  const editingTask = tasks.find((task) => task.id === editingTaskId)

  return (
    <section className="task-board" aria-labelledby="selected-day-title">
      <header className="board-heading">
        <div>
          <p className="section-kicker">YOUR AGENDA</p>
          <h2 id="selected-day-title">{dateTitle}</h2>
          <p className="task-total">{tasks.length} {tasks.length === 1 ? 'plan' : 'plans'} for the day</p>
        </div>
        <button className="add-task-button" type="button" onClick={onAddTask}>
          <span aria-hidden="true">+</span> Add task
        </button>
      </header>

      {orderedTasks.length > 0 ? (
        <ol className="agenda-list">
          {orderedTasks.map((task, index) => (
            <li className="agenda-row" key={task.id}>
              <div className="agenda-time">{task.time || 'ANYTIME'}</div>
              <div className="agenda-marker" aria-hidden="true"><span /></div>
              <article className="agenda-task">
                <div className="agenda-task-copy">
                  <h3>{task.title}</h3>
                  {task.details && <p>{task.details}</p>}
                </div>
                <div className="task-actions">
                  <button type="button" onClick={() => setEditingTaskId(task.id)} aria-label={`Edit ${task.title}`} title="Edit task">Edit</button>
                  <DeleteTask taskId={task.id} taskTitle={task.title} />
                </div>
              </article>
              {index < orderedTasks.length - 1 && <span className="agenda-connector" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-agenda">
          <div className="empty-mark" aria-hidden="true">+</div>
          <h3>Leave a little room.</h3>
          <p>There are no plans for this day yet.</p>
          <button type="button" onClick={onAddTask}>Add the first task</button>
        </div>
      )}

      {editingTask && <EditTask key={editingTask.id} task={editingTask} onClose={() => setEditingTaskId(null)} />}
    </section>
  )
}

export default TaskList
