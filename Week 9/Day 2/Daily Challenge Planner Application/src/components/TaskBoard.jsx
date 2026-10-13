import { useState } from 'react'
import { connect } from 'react-redux'
import { addTask, deleteTask, editTask } from '../redux/actions.js'
import { formatDayLabel } from '../dateUtils.js'
import TaskEditor from './TaskEditor.jsx'

function TaskBoard({ selectedDate, tasks, addTask, editTask, deleteTask }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const orderedTasks = [...tasks].sort((first, second) => {
    if (!first.time) return second.time ? 1 : 0
    if (!second.time) return -1
    return first.time.localeCompare(second.time)
  })
  const dateTitle = formatDayLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })

  function startCreate() {
    setEditingTask(null)
    setEditorOpen(true)
  }

  function startEdit(task) {
    setEditingTask(task)
    setEditorOpen(true)
  }

  function saveTask(taskValues) {
    if (editingTask) {
      editTask(selectedDate, editingTask.id, taskValues)
    } else {
      addTask(selectedDate, taskValues)
    }
    setEditorOpen(false)
    setEditingTask(null)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditingTask(null)
  }

  return (
    <section className="task-board" aria-labelledby="selected-day-title">
      <header className="board-heading">
        <div>
          <p className="section-kicker">YOUR AGENDA</p>
          <h2 id="selected-day-title">{dateTitle}</h2>
          <p className="task-total">{tasks.length} {tasks.length === 1 ? 'plan' : 'plans'} for the day</p>
        </div>
        <button className="add-task-button" type="button" onClick={startCreate}>
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
                  <button type="button" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task">Edit</button>
                  <button className="delete-action" type="button" onClick={() => deleteTask(selectedDate, task.id)} aria-label={`Delete ${task.title}`} title="Delete task">Delete</button>
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
          <button type="button" onClick={startCreate}>Add the first task</button>
        </div>
      )}

      {editorOpen && (
        <TaskEditor
          key={editingTask?.id || 'new-task'}
          task={editingTask || { title: '', time: '', details: '' }}
          onClose={closeEditor}
          onSave={saveTask}
        />
      )}
    </section>
  )
}

const mapStateToProps = (state) => ({
  selectedDate: state.selectedDate,
  tasks: state.tasksByDate[state.selectedDate] || [],
})

export default connect(mapStateToProps, { addTask, editTask, deleteTask })(TaskBoard)
