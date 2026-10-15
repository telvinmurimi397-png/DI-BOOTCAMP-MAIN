import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser } from '../redux/userSlice.js'

function UserData() {
  const dispatch = useDispatch()
  const { user, status, error } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchUser())
  }, [dispatch])

  if (status === 'loading' || status === 'idle') {
    return (
      <section className="profile-card status-card" aria-live="polite">
        <span className="loader" aria-hidden="true" />
        <p>{status === 'idle' ? 'Preparing user profile…' : 'Fetching user profile…'}</p>
      </section>
    )
  }

  if (status === 'failed') {
    return (
      <section className="profile-card status-card error-card" aria-labelledby="error-title">
        <p className="status-kicker">REQUEST FAILED</p>
        <h2 id="error-title">We couldn’t load this profile.</h2>
        <p className="error-message" role="alert">{error}</p>
        <button className="retry-button" type="button" onClick={() => dispatch(fetchUser())}>
          Try again
        </button>
      </section>
    )
  }

  return (
    <article className="profile-card" aria-label="User profile">
      <div className="profile-topline">
        <span className="status-dot" aria-hidden="true" />
        <span>USER PROFILE</span>
        <span className="user-id">ID / {String(user.id).padStart(2, '0')}</span>
      </div>

      <div className="identity">
        <div className="avatar" aria-hidden="true">{user.name.charAt(0)}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="username">@{user.username}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail">
          <span className="detail-label">EMAIL</span>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </div>
        <div className="detail">
          <span className="detail-label">PHONE</span>
          <a href={`tel:${user.phone}`}>{user.phone}</a>
        </div>
        <div className="detail">
          <span className="detail-label">WEBSITE</span>
          <a href={`https://${user.website}`} target="_blank" rel="noreferrer">{user.website}</a>
        </div>
        <div className="detail">
          <span className="detail-label">COMPANY</span>
          <span>{user.company.name}</span>
        </div>
      </div>

      <div className="location">
        <span className="detail-label">LOCATION</span>
        <span>{user.address.city}, {user.address.street}</span>
      </div>
    </article>
  )
}

export default UserData
