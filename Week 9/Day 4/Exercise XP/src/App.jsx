import UserData from './components/UserData.jsx'

function App() {
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">REDUX TOOLKIT · ASYNC THUNK</p>
        <h1>People, <span>in focus.</span></h1>
        <p className="intro">A user profile fetched from the API and kept in Redux.</p>
      </header>

      <UserData />

      <footer className="page-footer">
        <span>One request, shared state.</span>
        <span>Powered by Redux Toolkit</span>
      </footer>
    </main>
  )
}

export default App
