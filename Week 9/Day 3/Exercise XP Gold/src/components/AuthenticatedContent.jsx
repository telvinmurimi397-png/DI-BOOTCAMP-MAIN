import { useSelector } from 'react-redux'
import Logout from './Logout.jsx'

function AuthenticatedContent() {
  const user = useSelector((state) => state.auth.user)

  return (
    <section className="auth-card signed-in-card" aria-labelledby="account-title">
      <div className="card-kicker"><span className="status-dot is-online" /> SIGNED IN</div>
      <div className="account-avatar" aria-hidden="true">
        {user?.name?.charAt(0).toUpperCase() || '?'}
      </div>
      <p className="welcome-label">GOOD TO HAVE YOU HERE</p>
      <h1 id="account-title">Hello, {user?.name || 'there'}.</h1>
      <p className="card-intro">You’re signed in to your account space.</p>

      <div className="account-details">
        <span>ACCOUNT EMAIL</span>
        <strong>{user?.email || 'Not provided'}</strong>
      </div>

      <Logout />
    </section>
  )
}

export default AuthenticatedContent
