import { useState } from 'react'
import { connect } from 'react-redux'
import AuthScreen from './components/AuthScreen.jsx'
import CategorySection from './components/CategorySection.jsx'
import { logout } from './redux/authActions.js'

const filters = [
  { id: 'all', label: 'All tasks' },
  { id: 'active', label: 'To do' },
  { id: 'completed', label: 'Done' },
]

function App({ auth, categories, logout }) {
  const [filter, setFilter] = useState('all')
  if (!auth.user) return <AuthScreen />

  const allTodos = categories.flatMap((category) => category.todos)
  const completed = allTodos.filter((todo) => todo.completed).length
  const remaining = allTodos.length - completed
  const firstName = auth.user.name.split(' ')[0]

  return (
    <main className="app-page">
      <header className="app-topline">
        <a className="wordmark" href="#home" aria-label="In Good Order home">
          <span className="wordmark-mark" aria-hidden="true">i.</span>
          <span>in good order</span>
        </a>
        <div className="account-tools">
          <span className="account-greeting"><span className="online-dot" aria-hidden="true"></span> {firstName}'s space</span>
          <button className="signout-button" type="button" onClick={logout}>Sign out <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      <section className="todo-panel" id="home" aria-labelledby="page-title">
        <header className="panel-header">
          <div>
            <p className="eyebrow">A PRIVATE SPACE FOR {auth.user.name.toUpperCase()}</p>
            <h1 id="page-title">Make space<br />for what matters.</h1>
          </div>
          <div className="progress-stamp" aria-label={`${completed} of ${allTodos.length} tasks complete`}>
            <span>{String(completed).padStart(2, '0')}</span><i aria-hidden="true">/</i>
            <span className="stamp-total">{String(allTodos.length).padStart(2, '0')}</span>
            <small>DONE</small>
          </div>
        </header>

        <div className="list-toolbar">
          <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
            {filters.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? 'filter-tab is-selected' : 'filter-tab'} onClick={() => setFilter(item.id)}>
                {item.label}
                {item.id === 'active' && <span className="tab-count">{remaining}</span>}
              </button>
            ))}
          </div>
          <span className="category-count">{categories.length} categories</span>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <CategorySection key={category.id} userId={auth.user.id} categoryId={category.id} filter={filter} index={index} />
          ))}
        </div>

        <footer className="panel-footer">
          <span><strong>{remaining}</strong> {remaining === 1 ? 'task' : 'tasks'} left</span>
          <span className="footer-note">One thing at a time.</span>
        </footer>
      </section>
      <p className="page-caption">A little less noise. A little more intention.</p>
    </main>
  )
}

const mapStateToProps = (state) => ({
  auth: state.auth,
  categories: state.auth.user ? state.todosByUser[state.auth.user.id] ?? [] : [],
})

export default connect(mapStateToProps, { logout })(App)
