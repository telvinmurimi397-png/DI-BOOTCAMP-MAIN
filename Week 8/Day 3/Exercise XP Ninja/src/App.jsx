import AddTaskForm from './components/AddTaskForm.jsx'
import TaskList from './components/TaskList.jsx'

export default function App() {
  return (
    <main className="app-shell">
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">Week 8 · Day 3 · Exercise XP Ninja</p>
          <h1>Task manager</h1>
          <p className="intro">
            Organize your next steps. Add tasks, mark them complete, or remove
            them when you are done.
          </p>
        </header>

        <section className="task-panel" aria-label="Task manager">
          <AddTaskForm />
          <TaskList />
        </section>
      </div>
    </main>
  )
}
