import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import FetchUserForm from './components/FetchUserForm.js'
import AxiosPostForm from './components/AxiosPostForm.js'

function App() {
  return (
    <main className="container page-shell">
      <header className="page-header">
        <p className="eyebrow">Week 8 · Day 2</p>
        <h1>Send JSON to an API</h1>
        <p>Compare a browser fetch request with an Axios request using controlled React forms.</p>
      </header>
      <div className="exercise-grid">
        <FetchUserForm />
        <AxiosPostForm />
      </div>
      <footer className="page-footer">Responses are logged in the browser console. JSONPlaceholder simulates writes; it does not persist them.</footer>
    </main>
  )
}

export default App