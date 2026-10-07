import { useContext } from 'react'
import CharacterCounter from './components/CharacterCounter.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import { ThemeContext } from './context/ThemeContext.jsx'

function App() {
  const { theme } = useContext(ThemeContext)

  return (
    <main className="app-shell" data-theme={theme}>
      <div className="page-content">
        <header className="page-header">
          <p className="eyebrow">Week 8 · Day 3</p>
          <h1>React hooks in action</h1>
          <p className="intro">
            Practice sharing a theme with context and keeping a live character
            count with a ref.
          </p>
        </header>

        <section className="exercise-card" aria-labelledby="theme-heading">
          <div className="section-heading">
            <p className="eyebrow">Exercise 1 · useContext + useState</p>
            <h2 id="theme-heading">Theme switcher</h2>
            <p>
              The selected theme is shared through context and styles this whole
              page.
            </p>
          </div>
          <ThemeSwitcher />
        </section>

        <section className="exercise-card" aria-labelledby="counter-heading">
          <div className="section-heading">
            <p className="eyebrow">Exercise 2 · useRef</p>
            <h2 id="counter-heading">Character counter</h2>
            <p>Type in the field and watch the count update as you go.</p>
          </div>
          <CharacterCounter />
        </section>

        <footer className="page-footer">Built with React hooks</footer>
      </div>
    </main>
  )
}

export default App
