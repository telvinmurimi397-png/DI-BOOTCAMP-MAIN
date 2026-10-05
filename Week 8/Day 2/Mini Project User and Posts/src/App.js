import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import PostList from './components/PostList.js'
import UsersList from './components/UsersList.js'

function App() {
  return (
    <main className="container app-shell">
      <header className="page-header">
        <p className="eyebrow">Week 8 · Day 2 · Mini Project</p>
        <h1>Users <span>&amp;</span> Posts</h1>
        <p className="intro-copy">A live look at two JSONPlaceholder collections, fetched when each component mounts.</p>
      </header>
      <div className="content-grid">
        <PostList />
        <UsersList />
      </div>
      <footer className="page-footer">Data provided by JSONPlaceholder</footer>
    </main>
  )
}

export default App