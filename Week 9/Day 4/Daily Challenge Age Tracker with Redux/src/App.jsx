import AgeControls from './components/AgeControls.jsx'
import AgeDisplay from './components/AgeDisplay.jsx'

function App() {
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">A MOMENT IN TIME</p>
        <h1>Age tracker<span>.</span></h1>
        <p className="intro">A little older, one step at a time.</p>
      </header>

      <section className="tracker-card" aria-label="Age tracker">
        <div className="card-topline">
          <span className="status-dot" aria-hidden="true" />
          <span>YOUR JOURNEY</span>
          <span className="card-index">01 / ∞</span>
        </div>
        <AgeDisplay />
        <AgeControls />
        <p className="card-note">Each change takes a moment. Good things do.</p>
      </section>

      <footer className="page-footer">
        <span>Growing at your own pace.</span>
        <span>Powered by Redux Toolkit</span>
      </footer>
    </main>
  )
}

export default App
