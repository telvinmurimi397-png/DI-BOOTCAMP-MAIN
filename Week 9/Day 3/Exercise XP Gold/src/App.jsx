import { useSelector } from 'react-redux'
import AuthenticatedContent from './components/AuthenticatedContent.jsx'
import Login from './components/Login.jsx'

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  return (
    <main className="page-shell">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">a.</span>
        <span>account space</span>
      </header>

      {isAuthenticated ? <AuthenticatedContent /> : <Login />}

      <p className="page-note">A simple authentication flow, powered by Redux Toolkit.</p>
    </main>
  )
}

export default App
