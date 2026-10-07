import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext.jsx'

function ThemeSwitcher() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const nextTheme = theme === 'light' ? 'dark' : 'light'

  return (
    <div className="theme-control">
      <div className="theme-status" aria-live="polite">
        <span className={`theme-indicator ${theme}`} aria-hidden="true" />
        <span>
          Current theme: <strong>{theme}</strong>
        </span>
      </div>
      <button
        className="theme-button"
        type="button"
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
      >
        Switch to {nextTheme} mode
      </button>
    </div>
  )
}

export default ThemeSwitcher
