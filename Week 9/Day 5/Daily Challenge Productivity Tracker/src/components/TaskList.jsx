import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteTask, editTask, toggleTaskCompletion, updateTaskProgress } from '../store/trackerSlice.js'
import { selectCategories, selectCompletedTasks, selectTasksByCategory } from '../store/selectors.js'

function TaskRow({ task, categories, onToggle, onDelete, onEdit, onProgress }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [categoryId, setCategoryId] = useState(task.categoryId || '')

  const saveEdit = (event) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) return
    onEdit({ id: task.id, title: nextTitle, categoryId: categoryId || null })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <li className="task-row task-edit-row">
        <form className="edit-task-form" onSubmit={saveEdit}>
          <input aria-label="Task title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoFocus />
          <select aria-label="Task category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <button className="text-action" type="submit">Save</button>
          <button className="text-action subdued-action" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      </li>
    )
  }

  return (
    <li className={`task-row${task.completed ? ' is-complete' : ''}`}>
      <label className="completion-control">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
        <span className="checkmark" aria-hidden="true">✓</span>
        <span className="visually-hidden">Mark {task.title} {task.completed ? 'active' : 'complete'}</span>
      </label>
      <div className="task-main">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className="task-category">{categories.find((category) => category.id === task.categoryId)?.name || 'Uncategorized'}</span>
        </div>
        <div className="progress-line">
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={task.progress}
            aria-label={`Progress for ${task.title}`}
            onChange={(event) => onProgress({ id: task.id, progress: Number(event.target.value) })}
          />
          <span>{task.progress}%</span>
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-button" type="button" aria-label={`Edit ${task.title}`} title="Edit task" onClick={() => setIsEditing(true)}><span aria-hidden="true">✎</span></button>
        <button className="icon-button delete-action" type="button" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => onDelete(task.id)}><span aria-hidden="true">×</span></button>
      </div>
    </li>
  )
}

function TaskList({ selectedCategoryId }) {
  const dispatch = useDispatch()
  const tasks = useSelector((state) => selectTasksByCategory(state, selectedCategoryId))
  const completedCount = useSelector((state) => selectCompletedTasks(state, selectedCategoryId))
  const categories = useSelector(selectCategories)

  const handleToggle = useCallback((taskId) => {
    dispatch(toggleTaskCompletion(taskId))
  }, [dispatch])

  const handleDelete = useCallback((taskId) => {
    dispatch(deleteTask(taskId))
  }, [dispatch])

  const handleEdit = useCallback((task) => {
    dispatch(editTask(task))
  }, [dispatch])

  const handleProgress = useCallback((progressUpdate) => {
    dispatch(updateTaskProgress(progressUpdate))
  }, [dispatch])

  return (
    <section className="task-section" aria-labelledby="tasks-title">
      <div className="task-section-heading">
        <div>
          <p className="eyebrow">Your workbench</p>
          <h2 id="tasks-title">Tasks <span>{tasks.length}</span></h2>
        </div>
        <p className="completion-stat"><strong>{completedCount}</strong> of {tasks.length} complete</p>
      </div>

      {tasks.length ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              categories={categories}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onProgress={handleProgress}
            />
          ))}
        </ul>
      ) : (
        <div className="empty-state"><span aria-hidden="true">✳</span><p>No tasks in this category.</p></div>
      )}
    </section>
  )
}

export default TaskList
