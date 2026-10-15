import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, logout } from '../features/auth/authSlice.js'

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()

  function handleSubmit(event) {
    event.preventDefault()
    dispatch(login({ email, name: email.split('@')[0] }))
    setEmail('')
    setPassword('')
  }

  if (user) {
    return (
      <div className="auth-state">
        <span className="auth-greeting">Hi, {user.name}</span>
        <button className="text-button" type="button" onClick={() => dispatch(logout())}>Log out</button>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <label className="sr-only" htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button className="login-button" type="submit">Sign in</button>
    </form>
  )
}

export default AuthForm
