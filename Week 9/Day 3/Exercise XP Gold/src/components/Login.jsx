import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { loginUser } from '../redux/authSlice.js'

function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const dispatch = useDispatch()

  function handleSubmit(event) {
    event.preventDefault()
    const user = { name: name.trim(), email: email.trim() }
    if (!user.name || !user.email) return
    dispatch(loginUser(user))
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <div className="card-kicker"><span className="status-dot" /> SIGN IN</div>
      <h1 id="login-title">Welcome<br />to your space.</h1>
      <p className="card-intro">Enter your details to see your account.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="user-name">Your name</label>
        <input
          id="user-name"
          autoComplete="name"
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="Alex Morgan"
          required
          value={name}
        />

        <label htmlFor="user-email">Email address</label>
        <input
          id="user-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alex@example.com"
          required
          value={email}
        />

        <button className="primary-button" type="submit">Continue <span aria-hidden="true">→</span></button>
      </form>

      <p className="demo-note">Demo sign-in only. No password or backend is used.</p>
    </section>
  )
}

export default Login
