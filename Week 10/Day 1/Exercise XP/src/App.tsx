import Greeting from './components/Greeting'
import Counter from './components/Counter'
import UserCard from './components/UserCard'
import UserList from './components/UserList'

const exercises = [
  { number: '01', title: 'Typed props', description: 'Build a component with a clear, reusable props contract.' },
  { number: '02', title: 'Typed state', description: 'Update state safely and keep track of the last action.' },
  { number: '03', title: 'Optional props', description: 'Give every card useful defaults when details are missing.' },
  { number: '04', title: 'Effects & data', description: 'Fetch API data with typed loading and error states.' },
]

function App() {
  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> WEEK 10 · DAY 1</p>
          <h1>React, meet<br /><span>TypeScript.</span></h1>
          <p className="hero-description">
            Five small exercises. Stronger types, clearer components, and a little more confidence in every render.
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
            <pre><code><span className="code-purple">type</span> Props = {'{'}{'\n'}  name: <span className="code-green">string</span>{'\n'}{'}'}{'\n\n'}<span className="code-purple">function</span> <span className="code-yellow">Build</span>() {'{'}{'\n'}  <span className="code-purple">return</span> ready{'\n'}{'}'}</code></pre>
          </div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">+</span>
          <span className="art-label">typed & ready</span>
        </div>
        <div className="hero-footer">
          <span>THE COMPONENT PLAYGROUND</span>
          <span>SCROLL TO START&nbsp; ↓</span>
        </div>
      </header>

      <section className="exercise-overview" id="exercises" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2 id="overview-title">Four concepts.<br /><span>One solid foundation.</span></h2>
          </div>
          <p className="section-note">Each component below puts one TypeScript idea into practice. Try the controls and see your types at work.</p>
        </div>
        <div className="exercise-grid">
          {exercises.map((exercise) => (
            <article className="exercise-step" key={exercise.number}>
              <span className="step-number">{exercise.number}</span>
              <div>
                <h3>{exercise.title}</h3>
                <p>{exercise.description}</p>
              </div>
            </article>
          ))}
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

        <div className="component-grid">
          <article className="demo-panel greeting-panel">
            <div className="panel-heading">
              <span className="panel-index">01</span>
              <div><h3>Typed props</h3><p>Exercise 2 · Component props</p></div>
            </div>
            <Greeting name="Alex" messageCount={3} />
          </article>

          <article className="demo-panel counter-panel">
            <div className="panel-heading">
              <span className="panel-index">02</span>
              <div><h3>State in motion</h3><p>Exercise 3 · useState</p></div>
            </div>
            <Counter />
          </article>

          <article className="demo-panel user-card-panel">
            <div className="panel-heading">
              <span className="panel-index">03</span>
              <div><h3>Defaults included</h3><p>Exercise 4 · Optional props</p></div>
            </div>
            <div className="user-card-examples">
              <UserCard name="Maya Chen" age={28} role="Frontend developer" />
              <UserCard name="New teammate" />
            </div>
          </article>

          <article className="demo-panel user-list-panel">
            <div className="panel-heading">
              <span className="panel-index">04</span>
              <div><h3>Users from an API</h3><p>Exercise 5 · useEffect + fetch</p></div>
            </div>
            <UserList />
          </article>
        </div>
      </section>

      <footer className="page-footer">
        <span>WEEK 10 / DAY 1</span>
        <span>BUILT WITH REACT + TYPESCRIPT</span>
        <a href="#exercises">BACK TO TOP ↑</a>
      </footer>
    </main>
  )
}

export default App
