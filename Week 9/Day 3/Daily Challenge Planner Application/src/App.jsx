import DateNavigator from './components/DateNavigator.jsx'
import TaskBoard from './components/TaskBoard.jsx'

export default function App() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Daymark planner home">
          <span className="brand-symbol" aria-hidden="true"><span /></span>
          <span>daymark</span>
        </a>
        <div className="header-note">
          <span className="header-rule" />
          <span>A DAY, WELL SPENT</span>
        </div>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="section-kicker">DAILY PLANNER</p>
          <h1>Give the day<br />a little direction.</h1>
        </div>
        <p className="intro-note">A calm place to gather your plans,<br />one day at a time.</p>
      </section>

      <div className="planner-layout">
        <DateNavigator />
        <TaskBoard />
      </div>

      <footer className="site-footer">
        <span>DAYMARK <span className="footer-separator">/</span> PERSONAL PLANNER</span>
        <span>Make time for what matters.</span>
      </footer>
    </main>
  )
}
