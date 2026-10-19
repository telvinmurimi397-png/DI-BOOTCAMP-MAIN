import ProfileEditor from './components/ProfileEditor'
import SurveyFeedback from './components/SurveyFeedback'
import ContactForm from './components/ContactForm'
import ContactList from './components/ContactList'
import FocusDemo from './components/FocusDemo'

const lessons = [
  { number: '01', title: 'A reducer with resolve states', detail: 'Profile updates move through initial, loading, success, and error.' },
  { number: '02', title: 'Survey, step by step', detail: 'Start, submit, and reset feedback with a typed action union.' },
  { number: '03', title: 'A form in one place', detail: 'Keep contact field updates and reset behavior in a reducer.' },
  { number: '04', title: 'State without the hand-off', detail: 'Share a contact book across components with typed context.' },
  { number: '05', title: 'Focus where it matters', detail: 'Use a DOM ref safely to focus an input on mount or click.' },
]

function App() {
  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> WEEK 10 · DAY 1 · NINJA</p>
          <h1>State, with<br /><span>intention.</span></h1>
          <p className="hero-description">
            Reducers make transitions explicit. Context shares state without the relay race. Refs connect your component to the DOM.
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
            <pre><code><span className="code-purple">type</span> Action = {'{'} type: <span className="code-green">"save"</span> {'}'}{'\n\n'}<span className="code-purple">const</span> [state, dispatch]{'\n'}  = useReducer(reducer, initial)</code></pre>
          </div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">+</span>
          <span className="art-label">state, simplified</span>
        </div>
        <div className="hero-footer">
          <span>THE STATE MANAGEMENT LAB</span>
          <span>SCROLL TO START&nbsp; ↓</span>
        </div>
      </header>

      <section className="exercise-overview" id="exercises" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2 id="overview-title">Five tools.<br /><span>One clearer state.</span></h2>
          </div>
          <p className="section-note">Try each component to watch its state transitions happen in real time. Add a contact and it appears in the shared contact book below.</p>
        </div>
        <div className="exercise-grid">
          {lessons.map((lesson) => (
            <article className="exercise-step" key={lesson.number}>
              <span className="step-number">{lesson.number}</span>
              <div><h3>{lesson.title}</h3><p>{lesson.detail}</p></div>
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
          <section className="demo-panel">
            <PanelHeading number="01" title="Profile updates" subtitle="useReducer · async state transitions" />
            <ProfileEditor />
          </section>
          <section className="demo-panel">
            <PanelHeading number="02" title="Quick survey" subtitle="useReducer · feedback flow" />
            <SurveyFeedback />
          </section>
          <section className="demo-panel">
            <PanelHeading number="03" title="Contact form" subtitle="useReducer · typed form state" />
            <ContactForm />
          </section>
          <section className="demo-panel">
            <PanelHeading number="04" title="Shared contact book" subtitle="useContext · extended interfaces" />
            <ContactList />
          </section>
          <section className="demo-panel focus-panel">
            <PanelHeading number="05" title="Focus on the field" subtitle="useRef · HTMLInputElement" />
            <FocusDemo />
          </section>
        </div>
      </section>

      <footer className="page-footer">
        <span>WEEK 10 / DAY 1 · NINJA</span>
        <span>BUILT WITH REACT + TYPESCRIPT</span>
        <a href="#exercises">BACK TO TOP ↑</a>
      </footer>
    </main>
  )
}

function PanelHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="panel-heading">
      <span className="panel-index">{number}</span>
      <div><h3>{title}</h3><p>{subtitle}</p></div>
    </div>
  )
}

export default App
