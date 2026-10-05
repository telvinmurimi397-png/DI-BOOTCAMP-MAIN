import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import Users from './components/Users.js'
import Customers from './components/customers.js'

function App() {
  return (
    <main className="container page-shell">
      <header className="page-header">
        <p className="eyebrow">Week 8 · Day 2 · Express + React</p>
        <h1>Two APIs, one client</h1>
        <p>Each list loads from its own Express backend and keeps the response in component state.</p>
      </header>
      <div className="api-grid">
        <section className="api-panel" aria-labelledby="users-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Exercise 1</p>
              <h2 id="users-heading">Users</h2>
            </div>
            <span className="endpoint">:3001 /users</span>
          </div>
          <Users />
        </section>
        <section className="api-panel" aria-labelledby="customers-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Exercise 2</p>
              <h2 id="customers-heading">Customers</h2>
            </div>
            <span className="endpoint">:3002 /api/customers</span>
          </div>
          <Customers />
        </section>
      </div>
      <footer className="page-footer">Both backends return JSON; Vite proxies each API request during development.</footer>
    </main>
  )
}

export default App