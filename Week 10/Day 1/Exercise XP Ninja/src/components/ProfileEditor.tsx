import { useReducer, useState, type FormEvent } from 'react'
import { initialProfileState, profileReducer } from '../reducers/profileReducer'

function ProfileEditor() {
  const [state, dispatch] = useReducer(profileReducer, initialProfileState)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !bio.trim()) return

    dispatch({ type: 'updateStarted' })
    await new Promise((resolve) => window.setTimeout(resolve, 550))
    if (name.trim().toLowerCase() === 'error') {
      dispatch({ type: 'updateFailed', error: 'The profile service could not save this profile.' })
    } else {
      dispatch({ type: 'updateSucceeded', profile: { name: name.trim(), bio: bio.trim() } })
    }
  }

  return (
    <div className="panel-body">
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label className="field-label">DISPLAY NAME
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" required />
        </label>
        <label className="field-label">SHORT BIO
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A line about what you do…" rows={2} required />
        </label>
        <div className="action-row">
          <button className="button button-dark" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Saving…' : 'Save profile'} <span aria-hidden="true">↗</span>
          </button>
          {state.status !== 'initial' && <button className="text-button" type="button" onClick={() => dispatch({ type: 'reset' })}>Reset state</button>}
        </div>
      </form>
      <div className={`state-result ${state.status}`} aria-live="polite">
        <span className="state-dot" />
        <div>
          <strong>{state.status === 'initial' ? 'Ready to update' : state.status === 'loading' ? 'Saving your changes' : state.status === 'success' ? 'Profile updated' : 'Update failed'}</strong>
          <p>{state.status === 'success' && state.profile
            ? <>{state.profile.name} <span>·</span> {state.profile.bio}</>
            : state.status === 'error' ? state.error : state.status === 'loading' ? 'The reducer is handling a pending update.' : 'Enter “error” as your name to preview the error state.'}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditor
