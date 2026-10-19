import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTodo, removeTodo, setVisibilityFilter, toggleTodo } from './store/todosSlice.js'
import { selectFilteredTodosCount, selectTodos, selectVisibilityFilter } from './store/selectors.js'

const filters = ['All', 'Active', 'Completed']

function TodoList() {
  const dispatch = useDispatch()
  const todos = useSelector(selectTodos)
  const visibilityFilter = useSelector(selectVisibilityFilter)
  const filteredCount = useSelector(selectFilteredTodosCount)
  const [newTodo, setNewTodo] = useState('')

  const handleToggle = useCallback((todoId) => {
    dispatch(toggleTodo(todoId))
  }, [dispatch])

  const handleDelete = useCallback((todoId) => {
    dispatch(removeTodo(todoId))
  }, [dispatch])

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = newTodo.trim()
    if (!text) return
    dispatch(addTodo(text))
    setNewTodo('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#today" aria-label="Daymark home">
          <span className="wordmark-icon" aria-hidden="true">d.</span>
          <span>daymark</span>
        </a>
        <span className="topbar-note">A little order for the day</span>
        <time dateTime={new Date().toISOString().slice(0, 10)}>{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</time>
      </header>

      <section className="todo-workspace" id="today" aria-labelledby="page-title">
        <div className="intro-row">
          <div>
            <p className="eyebrow">Your list, your pace</p>
            <h1 id="page-title">Make room<br /><em>for what matters.</em></h1>
          </div>
          <div className="daily-mark" aria-hidden="true">
            <span>01</span>
            <i />
            <span>03</span>
          </div>
        </div>

        <form className="add-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="new-todo">Add a task</label>
          <input
            id="new-todo"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="What would you like to get done?"
            maxLength={120}
          />
          <button type="submit" aria-label="Add task"><span aria-hidden="true">+</span></button>
        </form>

        <div className="list-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filter tasks">
            {filters.map((filter) => (
              <button
                className={`filter-tab${visibilityFilter === filter ? ' is-active' : ''}`}
                type="button"
                key={filter}
                aria-pressed={visibilityFilter === filter}
                onClick={() => dispatch(setVisibilityFilter(filter))}
              >
                {filter}
              </button>
            ))}
          </div>
          <p className="item-count" aria-live="polite"><strong>{filteredCount}</strong> {filteredCount === 1 ? 'task' : 'tasks'}</p>
        </div>

        {todos.length > 0 ? (
          <ul className="todo-list">
            {todos.map((todo, index) => (
              <li className={`todo-row${todo.completed ? ' is-complete' : ''}`} key={todo.id} style={{ '--row-index': index }}>
                <label className="todo-label">
                  <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo.id)} />
                  <span className="checkmark" aria-hidden="true"><span>✓</span></span>
                  <span className="todo-text">{todo.text}</span>
                </label>
                <button className="delete-button" type="button" aria-label={`Delete ${todo.text}`} onClick={() => handleDelete(todo.id)}>
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <span className="empty-sun" aria-hidden="true">✳</span>
            <p>{visibilityFilter === 'Completed' ? 'Nothing checked off just yet.' : visibilityFilter === 'Active' ? 'You are all caught up.' : 'Your list is clear.'}</p>
            <span>{visibilityFilter === 'Active' ? 'A good moment to take a breath.' : 'Add a task above to get started.'}</span>
          </div>
        )}

        <footer className="list-footer">
          <span>Showing {visibilityFilter.toLowerCase()} tasks</span>
          <span>Filtered with a memoized selector</span>
        </footer>
      </section>
      <p className="page-note">Small steps count. Keep going gently.</p>
    </main>
  )
}

export default TodoList
