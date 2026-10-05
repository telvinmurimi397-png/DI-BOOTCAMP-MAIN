import ErrorBoundary from './ErrorBoundary.js'

function App() {
  return (
    <main className="page">
      <section className="demo-card">
        <div className="status-icon" aria-hidden="true">
          <span />
        </div>
        <p className="eyebrow">Error boundary demo</p>
        <h1>Handle errors gracefully</h1>
        <p className="intro">
          Click the button to see how an error boundary can replace a broken view with a helpful
          message.
        </p>
        <ErrorBoundary>
          {(occurError) => (
            <button className="show-error-button" onClick={occurError}>
              Show Error
            </button>
          )}
        </ErrorBoundary>
        <p className="footnote">Your app stays in control, even when something goes wrong.</p>
      </section>
    </main>
  )
}

export default App
