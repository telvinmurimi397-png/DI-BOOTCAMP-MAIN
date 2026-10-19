import DataTable, { type TableColumn } from './components/DataTable'
import RegistrationForm from './components/RegistrationForm'
import CachedUserList from './components/CachedUserList'

interface Teammate {
  id: number
  name: string
  email: string
  role: string
  projects: number
}

const teammates: Teammate[] = [
  { id: 1, name: 'Maya Chen', email: 'maya.chen@studio.dev', role: 'Designer', projects: 8 },
  { id: 2, name: 'Theo Martin', email: 'theo.martin@studio.dev', role: 'Engineer', projects: 12 },
  { id: 3, name: 'Amara Okafor', email: 'amara.okafor@studio.dev', role: 'Product lead', projects: 6 },
  { id: 4, name: 'Luca Rossi', email: 'luca.rossi@studio.dev', role: 'Engineer', projects: 9 },
]

const teammateColumns: TableColumn<Teammate>[] = [
  {
    key: 'name',
    title: 'TEAMMATE',
    sortable: true,
    render: (name, teammate) => (
      <span className="table-person">
        <span className="table-avatar" aria-hidden="true">{teammate.name.charAt(0)}</span>
        <strong>{name}</strong>
      </span>
    ),
  },
  { key: 'email', title: 'EMAIL', sortable: true },
  { key: 'role', title: 'ROLE', sortable: true },
  { key: 'projects', title: 'PROJECTS', sortable: true, render: (count) => `${count} active` },
]

function App() {
  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> WEEK 10 · DAY 1 · GOLD</p>
          <h1>Hooks that<br /><span>do more.</span></h1>
          <p className="hero-description">
            Reusable form logic, flexible generic components, and smarter data fetching. Three real-world patterns, all properly typed.
          </p>
          <a className="hero-link" href="#exercises">Explore the exercises <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="code-card">
            <span className="code-dot dot-pink" />
            <span className="code-dot dot-yellow" />
            <span className="code-dot dot-green" />
            <pre><code><span className="code-purple">function</span> <span className="code-yellow">useData</span>&lt;T&gt;() {'{'}{'\n'}  <span className="code-purple">const</span> cache = useRef&lt;T&gt;(){'\n'}  <span className="code-purple">return</span> {'{'} data, refetch {'}'}{'\n'}{'}'}</code></pre>
          </div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">+</span>
          <span className="art-label">typed & reusable</span>
        </div>
        <div className="hero-footer">
          <span>THE ADVANCED PLAYGROUND</span>
          <span>SCROLL TO START&nbsp; ↓</span>
        </div>
      </header>

      <section className="exercise-overview" id="exercises" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2 id="overview-title">Three patterns.<br /><span>Made to be reused.</span></h2>
          </div>
          <p className="section-note">Explore each live example to see custom hooks, generic interfaces, and cached API state working together.</p>
        </div>
        <div className="exercise-grid">
          <article className="exercise-step">
            <span className="step-number">01</span>
            <div><h3>Forms, without fuss</h3><p>A typed custom hook validates fields and keeps form state organized.</p></div>
          </article>
          <article className="exercise-step">
            <span className="step-number">02</span>
            <div><h3>One table, any shape</h3><p>Generic columns, interactive sorting, search, and selectable rows.</p></div>
          </article>
          <article className="exercise-step">
            <span className="step-number">03</span>
            <div><h3>Fetch less, know more</h3><p>A shared cache avoids repeat requests, with refresh when you need it.</p></div>
          </article>
        </div>
      </section>

      <section className="playground" aria-labelledby="playground-title">
        <div className="playground-heading">
          <div>
            <p className="eyebrow">LIVE COMPONENTS</p>
            <h2 id="playground-title">The playground<span>.</span></h2>
          </div>
          <span className="playground-tag"><span className="live-dot" /> INTERACTIVE</span>
        </div>

        <div className="demo-panel form-panel">
          <div className="panel-heading">
            <span className="panel-index">01</span>
            <div><h3>Registration, handled</h3><p>Custom hook · validation · typed fields</p></div>
          </div>
          <RegistrationForm />
        </div>

        <div className="demo-panel table-panel">
          <div className="panel-heading">
            <span className="panel-index">02</span>
            <div><h3>Meet the team</h3><p>Generic table · sort · search · select</p></div>
            <span className="row-count">{teammates.length} PEOPLE</span>
          </div>
          <DataTable
            data={teammates}
            columns={teammateColumns}
            filter={(teammate, query) =>
              `${teammate.name} ${teammate.email} ${teammate.role}`.toLowerCase().includes(query.toLowerCase())
            }
            filterPlaceholder="Find a teammate…"
            onSelect={(selected) => console.info('Selected teammates:', selected.map(({ name }) => name))}
          />
        </div>

        <div className="demo-panel cache-panel">
          <div className="panel-heading">
            <span className="panel-index">03</span>
            <div><h3>Cached users</h3><p>useEffect · shared cache · 5 minute max age</p></div>
            <span className="cache-indicator"><span className="live-dot" /> IN-MEMORY</span>
          </div>
          <CachedUserList />
        </div>
      </section>

      <footer className="page-footer">
        <span>WEEK 10 / DAY 1 · GOLD</span>
        <span>BUILT WITH REACT + TYPESCRIPT</span>
        <a href="#exercises">BACK TO TOP ↑</a>
      </footer>
    </main>
  )
}

export default App
