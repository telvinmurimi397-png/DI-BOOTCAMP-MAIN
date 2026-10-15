import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import { fetchTodos } from './redux/todosSlice.js'

function App() {
  const dispatch = useDispatch()
  const { todos, status, error } = useSelector((state) => state.todos)
  const completedCount = todos.filter((todo) => todo.completed).length

  useEffect(() => {
    dispatch(fetchTodos())
  }, [dispatch])

  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">A LITTLE MORE INTENTION</p>
        <h1>Things to do<span>.</span></h1>
        <p className="intro">Keep track of what matters, one task at a time.</p>
      </header>

      <section className="todo-panel" aria-label="Todo list">
        <div className="panel-heading">
          <div>
            <h2>Your list</h2>
            <p>{todos.length === 0 ? 'A fresh start.' : `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} on your list`}</p>
          </div>
          <div className="completion-count" aria-label={`${completedCount} completed`}>
            <span>{String(completedCount).padStart(2, '0')}</span>
            <small>DONE</small>
          </div>
        </div>

        <AddTodo />

        {status === 'loading' && (
          <div className="status-message" role="status">
            <span className="loader" aria-hidden="true" />
            Fetching your list…
          </div>
        )}

        {status === 'failed' && (
          <div className="error-message" role="alert">
            <p>We couldn’t fetch your list: {error}</p>
            <button type="button" className="retry-button" onClick={() => dispatch(fetchTodos())}>
              Try again
            </button>
          </div>
        )}

        {status !== 'loading' && <TodoList />}

        <footer className="panel-footer">
          <span>{todos.length - completedCount} left to do</span>
          <span>Progress, not perfection.</span>
        </footer>
      </section>
    </main>
  )
}

export default App
