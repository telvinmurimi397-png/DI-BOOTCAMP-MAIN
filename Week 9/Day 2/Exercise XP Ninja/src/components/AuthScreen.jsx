import { useState } from 'react'
import { connect } from 'react-redux'
import { clearAuthError, login, register } from '../redux/authActions.js'

function AuthScreen({ status, error, clearAuthError, login, register }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const isRegistering = mode === 'register'
  const isLoading = status === 'loading'

  function handleSubmit(event) {
    event.preventDefault()
    const credentials = { email, password }
    if (isRegistering) register({ ...credentials, name })
    else login(credentials)
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setPassword('')
    clearAuthError()
  }

  return (
    <main className="auth-page">
      <header className="auth-topline">
        <a className="wordmark" href="#home" aria-label="In Good Order home">
          <span className="wordmark-mark" aria-hidden="true">i.</span>
          <span>in good order</span>
        </a>
        <span className="secure-note"><span aria-hidden="true">●</span> PRIVATE TASK SPACE</span>
      </header>

      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="auth-story">
          <p className="eyebrow">A CLEARER KIND OF DAY</p>
          <h1 id="auth-title">Keep your<br />plans close.</h1>
          <p className="story-copy">A calm place for the work, the life, and everything you are learning along the way.</p>
          <div className="story-rule" aria-hidden="true"><span></span><span></span><span></span></div>
          <p className="story-caption">Three lists. One less thing to carry in your head.</p>
        </div>

        <div className="auth-box">
          <div className="auth-box-heading">
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h2>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
            <p>{isRegistering ? 'Start with a name and a place to reach you.' : 'Sign in to pick up where you left off.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={!isRegistering} className={!isRegistering ? 'auth-tab selected' : 'auth-tab'} onClick={() => changeMode('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={isRegistering} className={isRegistering ? 'auth-tab selected' : 'auth-tab'} onClick={() => changeMode('register')}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <label className="field-label">
                Your name
                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" minLength={2} maxLength={60} required />
              </label>
            )}
            <label className="field-label">
              Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
            <label className="field-label">
              Password
              <input type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'} minLength={isRegistering ? 8 : 1} required />
              {isRegistering && <span className="field-hint">Use at least 8 characters, including a letter and a number.</span>}
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? 'One moment…' : isRegistering ? 'Create account' : 'Sign in'}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="privacy-note">Demo authentication · accounts are stored in this browser.</p>
        </div>
      </section>

      <footer className="auth-footer"><span>IN GOOD ORDER</span><span>Make space for what matters.</span></footer>
    </main>
  )
}

const mapStateToProps = (state) => ({
  status: state.auth.status,
  error: state.auth.error,
})

export default connect(mapStateToProps, { clearAuthError, login, register })(AuthScreen)
