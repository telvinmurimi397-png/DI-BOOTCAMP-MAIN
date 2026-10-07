import TodoApp from './components/TodoApp.jsx'

export default function App() {
  return (
    <main className="app-shell">
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">Week 8 · Day 3</p>
          <h1>Exercise XP GOLD — Todo list (useReducer)</h1>
          <p className="intro">Add and remove todos. State is managed with useReducer.</p>
        </header>

        <section className="exercise-card">
          <TodoApp />
        </section>

        <footer className="page-footer">Use the input below to add todos; click Remove to delete.</footer>
      </div>
    </main>
  )
}
