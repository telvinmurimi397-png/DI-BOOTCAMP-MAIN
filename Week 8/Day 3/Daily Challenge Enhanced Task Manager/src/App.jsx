import AddTaskForm from './components/AddTaskForm.jsx'
import TaskList from './components/TaskList.jsx'

export default function App() {
  return (
    <main className="app-shell">
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">Week 8 · Day 3 · Daily Challenge</p>
          <h1>Enhanced task manager</h1>
          <p className="intro">
            Keep your tasks moving. Edit details, track progress, and filter the
            list to focus on what matters.
          </p>
        </header>

        <section className="task-panel" aria-label="Task manager">
          <AddTaskForm />
          <TaskList />
        </section>

        <p className="page-note">Your changes stay on this page while it is open.</p>
      </div>
    </main>
  )
}
