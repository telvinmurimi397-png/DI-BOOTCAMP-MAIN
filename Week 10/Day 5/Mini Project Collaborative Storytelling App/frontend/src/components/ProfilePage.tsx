import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest, RequestError } from '../app/api'
import { useAppDispatch } from '../app/hooks'
import { updateSession } from '../features/auth/authSlice'
import type { Story, User } from '../../../types/models'
import './ProfilePage.css'

export function ProfilePage({
  userId,
  currentUser,
  token,
  onClose,
  onOpenStory,
}: {
  userId: number
  currentUser: User
  token: string
  onClose: () => void
  onOpenStory: (story: Story) => void
}) {
  const dispatch = useAppDispatch()
  const isOwnProfile = userId === currentUser.id
  const [profile, setProfile] = useState<User>(currentUser)
  const [stories, setStories] = useState<Story[]>([])
  const [username, setUsername] = useState(currentUser.username)
  const [displayName, setDisplayName] = useState(currentUser.displayName ?? '')
  const [bio, setBio] = useState(currentUser.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    const path = isOwnProfile ? '/users/me' : `/users/${userId}`
    void apiRequest<{ user: User; stories?: Story[] }>(path, {}, token)
      .then((result) => {
        if (!active) return
        setProfile(result.user)
        setStories(result.stories ?? [])
        setUsername(result.user.username)
        setDisplayName(result.user.displayName ?? '')
        setBio(result.user.bio ?? '')
        setAvatarUrl(result.user.avatarUrl ?? '')
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof RequestError ? reason.message : 'Could not load this profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [isOwnProfile, token, userId])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await apiRequest<{ user: User }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username, displayName, bio, avatarUrl }),
      }, token)
      setProfile(result.user)
      dispatch(updateSession({ accessToken: token, user: result.user }))
      setSuccess('Profile saved.')
    } catch (reason) {
      setError(reason instanceof RequestError ? reason.message : 'Could not save this profile.')
    } finally {
      setSaving(false)
    }
  }

  const name = profile.displayName || profile.username
  return (
    <main className="profile-page dashboard">
      <header className="profile-page-header">
        <span className="wordmark">plot<span className="wordmark-dot">.</span></span>
        <button className="writing-cancel" onClick={onClose} type="button">Back to stories</button>
      </header>
      <section className="profile-content">
        <p className="kicker">{isOwnProfile ? 'YOUR ACCOUNT' : 'STORYTELLER PROFILE'}</p>
        <div className="profile-heading">
          {profile.avatarUrl
            ? <img alt="" className="profile-avatar" src={profile.avatarUrl} />
            : <div aria-hidden="true" className="profile-avatar profile-avatar-placeholder">{name.slice(0, 1).toLocaleUpperCase()}</div>}
          <div><h1>{name}</h1><p>@{profile.username}</p></div>
        </div>
        {loading && <p>Loading profile…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {isOwnProfile ? (
          <form className="profile-form" onSubmit={(event) => { void saveProfile(event) }}>
            <label>USERNAME<input maxLength={50} onChange={(event) => setUsername(event.target.value)} required value={username} /></label>
            <label>DISPLAY NAME<input maxLength={80} onChange={(event) => setDisplayName(event.target.value)} value={displayName} /></label>
            <label>ABOUT YOU<textarea maxLength={500} onChange={(event) => setBio(event.target.value)} rows={4} value={bio} /></label>
            <label>AVATAR IMAGE URL<input onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://example.com/avatar.png" type="url" value={avatarUrl} /></label>
            <div className="profile-upload-placeholder">
              <label>UPLOAD AVATAR<input accept="image/*" disabled type="file" /></label>
              <p>Cloudinary uploads are not configured yet. Set up a Cloudinary account and add its credentials to the backend environment to enable uploads.</p>
            </div>
            {success && <p className="profile-success" role="status">{success}</p>}
            <button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save profile'}</button>
          </form>
        ) : (
          <>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <section className="profile-stories">
              <h2>Stories by {name}</h2>
              {stories.length ? stories.map((story) => (
                <button className="profile-story" key={story.id} onClick={() => onOpenStory(story)} type="button">
                  <strong>{story.title}</strong><span>{story.content.slice(0, 120)}{story.content.length > 120 ? '…' : ''}</span>
                </button>
              )) : <p>No published stories yet.</p>}
            </section>
          </>
        )}
      </section>
    </main>
  )
}
