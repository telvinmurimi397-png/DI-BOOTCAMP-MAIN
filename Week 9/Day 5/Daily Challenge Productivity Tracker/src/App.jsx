import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CategoryManager from './components/CategoryManager.jsx'
import CategorySelector from './components/CategorySelector.jsx'
import TaskList from './components/TaskList.jsx'
import { addTask } from './store/trackerSlice.js'
import { selectCategories, selectCategoryById } from './store/selectors.js'

function App() {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('cat-focus')
  const selectedCategory = useSelector((state) => selectCategoryById(state, selectedCategoryId))

  const handleDeleteCategory = useCallback((deletedId) => {
    if (selectedCategoryId === deletedId) setSelectedCategoryId('all')
    if (categoryId === deletedId) setCategoryId('')
  }, [categoryId, selectedCategoryId])

  const handleAddTask = (event) => {
    event.preventDefault()
    const taskTitle = title.trim()
    if (!taskTitle) return
    dispatch(addTask({ title: taskTitle, categoryId: categoryId || null }))
    setTitle('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Fieldwork home"><span className="brand-mark">F</span><span>fieldwork</span></a>
        <div className="topbar-meta"><span className="live-dot" />PRODUCTIVITY / DAILY</div>
        <time dateTime={new Date().toISOString().slice(0, 10)}>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</time>
      </header>

      <section className="hero" id="home">
        <div>
          <p className="eyebrow">A clear view of the day</p>
          <h1>Make progress,<br /><em>one thing at a time.</em></h1>
        </div>
        <div className="hero-stamp" aria-hidden="true"><span>DO</span><b>LESS<br />BETTER</b><span>DAILY</span></div>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <section className="sidebar-section">
            <p className="eyebrow">View by category</p>
            <CategorySelector selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
          </section>
          <CategoryManager onDeleteCategory={handleDeleteCategory} />
        </aside>

        <div className="main-column">
          <section className="add-task-section" aria-labelledby="add-task-title">
            <div className="add-heading"><p className="eyebrow">Capture a task</p><h2 id="add-task-title">What needs doing?</h2></div>
            <form className="add-task-form" onSubmit={handleAddTask}>
              <label className="visually-hidden" htmlFor="task-title">Task title</label>
              <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Write it down, get it out of your head" maxLength={120} />
              <label className="visually-hidden" htmlFor="task-category">Task category</label>
              <select id="task-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <button type="submit" aria-label="Add task"><span aria-hidden="true">+</span></button>
            </form>
          </section>

          <div className="active-filter">
            <span className="filter-kicker">CURRENT VIEW</span>
            <h2>{selectedCategoryId === 'all' ? 'All tasks' : selectedCategoryId === 'uncategorized' ? 'Uncategorized' : selectedCategory?.name || 'All tasks'}</h2>
          </div>
          <TaskList selectedCategoryId={selectedCategoryId} />
        </div>
      </div>
      <footer className="page-footer"><span>Progress is a practice, not a finish line.</span><span>Task lists and completion counts are derived with memoized selectors.</span></footer>
    </main>
  )
}

export default App
