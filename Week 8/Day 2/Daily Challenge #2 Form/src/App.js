import './index.css'
import AutoCompletedText from './components/AutoCompletedText.js'

function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Daily Challenge · React Forms</p>
        <h1>Find a country</h1>
        <p>Search the list and choose a suggestion to fill the field.</p>
      </header>
      <section className="search-panel" aria-label="Country autocomplete search">
        <AutoCompletedText />
      </section>
      <footer className="page-footer">Country suggestions from the bootcamp countries dataset</footer>
    </main>
  )
}

export default App