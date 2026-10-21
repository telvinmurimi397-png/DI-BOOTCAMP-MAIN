import './App.css'
import { DataFetcher } from './components/DataFetcher'
import type { User } from './types/types'

const usersUrl = 'https://jsonplaceholder.typicode.com/users'

function App() {
  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Generic data layer</p>
        <h1>React + TypeScript + Redux data fetcher</h1>
        <p className="page-copy">
          A reusable data-fetching component that stays type-safe while updating a shared Redux state.
        </p>
      </header>

      <DataFetcher<User>
        url={usersUrl}
        title="Users"
        renderItem={(user) => (
          <article className="user-card" key={user.id}>
            <div className="user-card__header">
              <span className="user-badge">#{user.id}</span>
              <span className="user-company">{user.company.name}</span>
            </div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p>{user.phone}</p>
          </article>
        )}
      />
    </main>
  )
}

export default App
