import { useEffect, useRef, useState, type FormEvent } from 'react'
import { io, type Socket } from 'socket.io-client'
import { apiRequest, RequestError } from './app/api'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { addContributor, deleteComment, deleteStory, editComment, editStory, loadComments, loadStories, postComment, reactToComment, removeContributor, saveStory, updateCommentsSetting, updateStoryLocally } from './features/stories/storiesSlice'
import { clearSession, restoreSession, signIn, signOut, signUp } from './features/auth/authSlice'
import { clearStories } from './features/stories/storiesSlice'
import { MyLibrarySection } from './components/MyLibrarySection'
import { ProfilePage } from './components/ProfilePage'
import { useLibraryState } from './features/library/useLibraryState'
import type { Story, StoryVersion, User } from '../../types/models'
import './App.css'

type Page = 'login' | 'signup'
const visitStorageKey = 'plot-has-visited'

function hasVisitedBefore(): boolean {
  try {
    return localStorage.getItem(visitStorageKey) === 'true'
  } catch (error) {
    console.warn('Could not read the previous-visit setting.', error)
    return false
  }
}

function AuthScreen({
  initialPage = 'login',
  onHome,
  onAuthenticated,
}: {
  initialPage?: Page
  onHome: () => void
  onAuthenticated: () => void
}) {
  const dispatch = useAppDispatch()
  const error = useAppSelector((state) => state.auth.error)
  const [page, setPage] = useState<Page>(initialPage)
  const [formError, setFormError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email') ?? '').trim()
    const password = String(values.get('password') ?? '')
    try {
      if (page === 'signup') {
        await dispatch(signUp({ username: email.split('@')[0], email, password })).unwrap()
      } else {
        await dispatch(signIn({ email, password })).unwrap()
      }
      onAuthenticated()
    } catch (reason) {
      setFormError(typeof reason === 'string' ? reason : 'Please try again.')
    }
  }

  return (
    <main className="auth-layout min-h-screen">
      <section className="auth-art">
        <a className="wordmark" href="#home">plot<span className="wordmark-dot">.</span></a>
        <div className="auth-quote">
          <h1>Every story<br />starts with a<br /><em>what if.</em></h1>
          <p>Write a little. Share a lot. See where the story takes you.</p>
        </div>
        <div className="auth-art-footer"><span>MADE OF MANY VOICES</span><span>01 — 07</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><button className="auth-home-link" onClick={onHome} type="button">BACK HOME</button><span>YOUR STORY, TOGETHER</span></div>
        <form className="auth-form" onSubmit={submit}>
          <p className="kicker">{page === 'login' ? 'WELCOME BACK' : 'A NEW CHAPTER'}</p>
          <h2>{page === 'login' ? 'Come on in.' : 'Find your people.'}</h2>
          <p className="auth-intro">{page === 'login' ? 'Your stories are right where you left them.' : 'Make an account and start a story worth sharing.'}</p>
          {page === 'signup' && (
            <label>EMAIL ADDRESS
              <input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" required type="email" />
            </label>
          )}
          {page === 'login' && (
            <label>EMAIL ADDRESS
              <input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" required type="email" />
            </label>
          )}
          <label>PASSWORD
            <input autoComplete={page === 'login' ? 'current-password' : 'new-password'} minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
          </label>
          {(formError || error) && <p className="form-error" role="alert">{formError || error}</p>}
          <button className="primary-button auth-submit" type="submit">{page === 'login' ? 'Sign in' : 'Create account'}</button>
          <p className="auth-switch">
            {page === 'login' ? 'New around here?' : 'Already have an account?'}{' '}
            <button onClick={() => { setPage(page === 'login' ? 'signup' : 'login'); setFormError('') }} type="button">
              {page === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="auth-terms">By continuing, you agree to write something wonderful.</p>
        </form>
      </section>
    </main>
  )
}

function HomePage({ onAuth, returningVisitor }: { onAuth: (page: Page) => void; returningVisitor: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  return (
    <main className="home-page">
      <header className={`home-nav ${menuOpen ? 'menu-open' : ''}`}>
        <a className="home-brand" href="#home">plot<span>.</span></a>
        <button aria-controls="home-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button"><span /><span /><span /></button>
        <div className="home-nav-panel" id="home-navigation">
          <nav aria-label="Main navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <button onClick={() => { closeMenu(); onAuth(returningVisitor ? 'login' : 'signup') }} type="button">My Library</button>
          </nav>
          <div className="home-nav-actions">
            <button className="home-login" onClick={() => { closeMenu(); onAuth(returningVisitor ? 'signup' : 'login') }} type="button">
              {returningVisitor ? 'Create account' : 'Already a member? Sign in'}
            </button>
            <button className="home-signup" onClick={() => { closeMenu(); onAuth(returningVisitor ? 'login' : 'signup') }} type="button">
              {returningVisitor ? 'Sign in' : 'Create your account'}
            </button>
          </div>
        </div>
      </header>

      <section className="home-hero" id="home">
        <div className="home-hero-copy">
          <p className="home-eyebrow">{returningVisitor ? 'WELCOME BACK TO THE STORY' : 'A SHARED SPACE FOR STORYTELLERS'}</p>
          <h1>{returningVisitor ? <>Your story<br />is waiting.</> : <>One story.<br />Many <em>voices.</em></>}</h1>
          <p className="home-intro">{returningVisitor
            ? 'Pick up where you left off, or find a new story to write together.'
            : 'Start with a sentence. Invite a friend. Build a world together, one voice at a time.'}</p>
          <div className="home-hero-actions">
            <button className="home-primary-button" onClick={() => onAuth(returningVisitor ? 'login' : 'signup')} type="button">
              {returningVisitor ? 'Sign in to continue' : 'Create your free account'}
            </button>
            {returningVisitor
              ? <button className="home-secondary-action" onClick={() => onAuth('signup')} type="button">New here? Create an account</button>
              : <a href="#how-it-works">See how it works</a>}
          </div>
          <div className="home-social-proof"><p><strong>Better stories, together.</strong><br />Made for curious minds and co-authors.</p></div>
        </div>
        <div className="home-hero-index"><span>01 / THE OPENING LINE</span><span>KEEP SCROLLING</span></div>
      </section>

      <section className="home-how" id="how-it-works">
        <div className="home-section-heading">
          <p className="home-eyebrow">SIMPLE AS PASSING A NOTE</p>
          <h2>Stories are better<br />when they <em>travel.</em></h2>
          <p>Plot gives your ideas a place to grow—with the people who make them even better.</p>
        </div>
        <div className="home-steps">
          <article><span className="step-number">01</span><h3>Start anywhere</h3><p>A title, a character, a single strange thought. Every story has to start somewhere.</p></article>
          <article><span className="step-number">02</span><h3>Bring your people</h3><p>Invite a collaborator and make room for another point of view.</p></article>
          <article><span className="step-number">03</span><h3>See what unfolds</h3><p>Write together, leave notes, and watch an idea become a whole new world.</p></article>
        </div>
      </section>

      <section className="home-cta" id="why-plot">
        <p className="home-eyebrow">YOUR NEXT FAVORITE STORY DOESN'T EXIST YET</p>
        <h2>Let&apos;s make<br /><em>something up.</em></h2>
        <button className="home-primary-button" onClick={() => onAuth(returningVisitor ? 'login' : 'signup')} type="button">
          {returningVisitor ? 'Sign in and keep writing' : 'Create your free account'}
        </button>
        <p className="cta-note">A little imagination. A little collaboration. That&apos;s all.</p>
      </section>

      <footer className="home-footer">
        <a className="home-brand" href="#home">plot<span>.</span></a>
        <p>A shared space for stories still being written.</p>
        <button onClick={() => onAuth(returningVisitor ? 'signup' : 'login')} type="button">
          {returningVisitor ? 'New to Plot? Create an account' : 'Already a member? Log in'}
        </button>
      </footer>
    </main>
  )
}

function StoryComposer({ story, onClose }: { story?: Story; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.accessToken)
  const [title, setTitle] = useState(story?.title ?? '')
  const [content, setContent] = useState(story?.content ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [liveStatus, setLiveStatus] = useState('Offline')
  const [collaborators, setCollaborators] = useState<{ id: number; displayName: string }[]>([])
  const [remoteCursors, setRemoteCursors] = useState<Record<number, { displayName: string; start: number; end: number }>>({})
  const [versions, setVersions] = useState<StoryVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [versionError, setVersionError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const skipBroadcast = useRef(false)

  useEffect(() => {
    if (!story || !token) return
    const apiUrl = new URL(import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
    const connection = io(apiUrl.origin, { auth: { token } })
    connection.on('connect', () => {
      setSocket(connection)
      setLiveStatus('Connected')
      connection.emit('story:join', story.id)
    })
    connection.on('disconnect', () => setLiveStatus('Reconnecting'))
    connection.on('connect_error', () => {
      setLiveStatus('Offline')
      setError('Live collaboration is unavailable. Check the backend connection.')
    })
    connection.on('story:error', (message: string) => setError(message))
    connection.on('story:presence', (people: { id: number; displayName: string }[]) => setCollaborators(people))
    connection.on('story:updated', (update: { title: string; content: string }) => {
      skipBroadcast.current = true
      setTitle(update.title)
      setContent(update.content)
    })
    connection.on('story:cursor', (cursor: { userId: number; displayName: string; start: number; end: number }) => {
      setRemoteCursors((current) => ({ ...current, [cursor.userId]: cursor }))
    })
    return () => {
      connection.disconnect()
    }
  }, [story, token])

  useEffect(() => {
    if (!story || !socket?.connected) return
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    const timeout = window.setTimeout(() => {
      socket.emit('story:edit', { storyId: story.id, title, content })
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [content, socket, story, title])

  function broadcastCursor() {
    const textarea = textareaRef.current
    if (!story || !socket?.connected || !textarea) return
    socket.emit('story:cursor', {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  async function toggleVersions() {
    setShowVersions((open) => !open)
    if (!story || versions.length) return
    setVersionError('')
    try {
      const result = await apiRequest<{ versions: StoryVersion[] }>(`/stories/${story.id}/versions`, {}, token)
      setVersions(result.versions)
    } catch (reason) {
      setVersionError(reason instanceof RequestError ? reason.message : 'Could not load story versions.')
    }
  }

  async function restoreVersion(versionId: number) {
    if (!story) return
    setVersionError('')
    try {
      const result = await apiRequest<{ story: Story }>(
        `/stories/${story.id}/versions/${versionId}/restore`, { method: 'POST' }, token,
      )
      setTitle(result.story.title)
      setContent(result.story.content)
      dispatch(updateStoryLocally({ id: story.id, changes: result.story }))
      socket?.emit('story:edit', { storyId: story.id, title: result.story.title, content: result.story.content })
      const history = await apiRequest<{ versions: StoryVersion[] }>(`/stories/${story.id}/versions`, {}, token)
      setVersions(history.versions)
    } catch (reason) {
      setVersionError(reason instanceof RequestError ? reason.message : 'Could not restore this version.')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (story) await dispatch(editStory({ id: story.id, title, content })).unwrap()
      else await dispatch(saveStory({ title, content })).unwrap()
      onClose()
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not save this story.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="writing-page dashboard">
      <header className="writing-header">
        <a className="wordmark" href="#home">plot<span className="wordmark-dot">.</span></a>
        <p>{story ? 'EDIT YOUR DRAFT' : 'YOUR NEXT STORY STARTS HERE'}</p>
        <button className="writing-cancel" onClick={onClose} type="button">Back to stories</button>
      </header>
      <div className="writing-layout">
        <div className="writing-intro">
          <p className="kicker">{story ? 'KEEP THE STORY GOING' : 'A BRAND NEW TALE'}</p>
          <h1>{story ? 'Return to your story.' : 'Make room for a new story.'}</h1>
          <p>Start with a line, a character, or a place. You can keep shaping it after you save.</p>
          {story && <div className="collaboration-presence">
            <p>LIVE COLLABORATION · {liveStatus.toLocaleUpperCase()}</p>
            <span>{collaborators.map((person) => person.displayName).join(', ') || 'No other writers online'}</span>
            {Object.entries(remoteCursors).map(([id, cursor]) => {
              const before = content.slice(0, cursor.start).split('\n')
              return <span className="remote-cursor" key={id}>{cursor.displayName} is at line {before.length}, column {before[before.length - 1].length + 1}</span>
            })}
          </div>}
          {story && <button className="version-toggle" onClick={() => { void toggleVersions() }} type="button">{showVersions ? 'Hide version history' : 'View version history'}</button>}
          {showVersions && <div className="version-history">
            <h2>Story versions</h2>
            {versions.map((version) => <div className="version-item" key={version.id}>
              <span>{new Date(version.createdAt).toLocaleString()} · {version.author.displayName || version.author.username}</span>
              <button onClick={() => { void restoreVersion(version.id) }} type="button">Restore</button>
            </div>)}
            {versions.length === 0 && !versionError && <p>No saved versions yet.</p>}
            {versionError && <p className="form-error" role="alert">{versionError}</p>}
          </div>}
        </div>
        <form className="writing-form" onSubmit={submit}>
          <label htmlFor="story-title">STORY TITLE</label>
          <input autoFocus id="story-title" maxLength={180} onChange={(event) => setTitle(event.target.value)} placeholder="Give your story a name..." required value={title} />
          <label className="writing-content-label" htmlFor="story-content">YOUR STORY</label>
          <textarea id="story-content" maxLength={50000} onChange={(event) => setContent(event.target.value)} onClick={broadcastCursor} onKeyUp={broadcastCursor} onSelect={broadcastCursor} placeholder="Once upon a time..." ref={textareaRef} required rows={20} value={content} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="writing-footer">
            <span>{content.length.toLocaleString()} / 50,000 characters</span>
            <button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : story ? 'Save changes' : 'Save story'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}

function StoryDetail({
  story,
  onClose,
  isAuthor,
  onOpenProfile,
}: {
  story: Story
  onClose: () => void
  isAuthor: boolean
  onOpenProfile: (userId: number) => void
}) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.accessToken)
  const comments = useAppSelector((state) => state.stories.comments[story.id] ?? [])
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(story.commentsEnabled)
  const [shareUrl, setShareUrl] = useState('')
  const [sharing, setSharing] = useState(false)
  const canEdit = isAuthor || story.contributors.some((item) => item.id === user?.id)

  useEffect(() => {
    void dispatch(loadComments(story.id))
  }, [dispatch, story.id])

  async function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await dispatch(postComment({ storyId: story.id, content: comment })).unwrap()
      setComment('')
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not add comment.')
    }
  }

  async function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingCommentId === null) return
    setError('')
    try {
      await dispatch(editComment({ storyId: story.id, commentId: editingCommentId, content: editedContent })).unwrap()
      setEditingCommentId(null)
      setEditedContent('')
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not update this comment.')
    }
  }

  async function removeComment(commentId: number) {
    if (!window.confirm('Delete this comment?')) return
    setError('')
    try {
      await dispatch(deleteComment({ storyId: story.id, commentId })).unwrap()
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not delete this comment.')
    }
  }

  async function toggleComments() {
    setError('')
    try {
      const updated = await dispatch(updateCommentsSetting({ storyId: story.id, enabled: !commentsEnabled })).unwrap()
      setCommentsEnabled(updated.commentsEnabled)
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not update comment settings.')
    }
  }

  async function createShareLink() {
    setSharing(true)
    setError('')
    try {
      const result = await apiRequest<{ shareToken: string }>(`/stories/${story.id}/share`, { method: 'POST' }, token)
      const url = new URL(window.location.href)
      url.search = ''
      url.hash = ''
      url.searchParams.set('share', result.shareToken)
      setShareUrl(url.toString())
      try {
        await navigator.clipboard.writeText(url.toString())
      } catch {
        setError('Share link is ready below. Copy it to send it to others.')
      }
    } catch (reason) {
      setError(reason instanceof RequestError ? reason.message : 'Could not create a share link.')
    } finally {
      setSharing(false)
    }
  }

  async function revokeShareLink() {
    setError('')
    try {
      await apiRequest<void>(`/stories/${story.id}/share`, { method: 'DELETE' }, token)
      setShareUrl('')
    } catch (reason) {
      setError(reason instanceof RequestError ? reason.message : 'Could not disable the share link.')
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await dispatch(addContributor({ storyId: story.id, email })).unwrap()
      setEmail('')
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not invite this contributor.')
    }
  }

  async function remove(personId: number, name: string) {
    if (!window.confirm(`Remove ${name} from this story?`)) return
    setError('')
    try {
      const person = story.contributors.find((item) => item.id === personId)
      if (!person) return
      await dispatch(removeContributor({ storyId: story.id, contributorId: person.contributorId })).unwrap()
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Could not remove this contributor.')
    }
  }

  return (
    <div className="modal-backdrop detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <article className="detail-modal">
        <header className="detail-header"><div><span className="story-label">STORY NO. {String(story.id).padStart(3, '0')}</span><h2>{story.title}</h2><p>By <button className="detail-profile-link" onClick={() => onOpenProfile(story.author.id)} type="button">{story.author.displayName || story.author.username}</button> · Updated {new Date(story.updatedAt).toLocaleDateString()}</p></div><button className="modal-close-button" onClick={onClose} type="button">Close</button></header>
        <div className="detail-body"><p className="story-content">{story.content}</p></div>
        {error && <p className="detail-error form-error" role="alert">{error}</p>}
        <section className="story-sharing">
          <button className="secondary-button" disabled={sharing} onClick={() => { void createShareLink() }} type="button">{sharing ? 'Preparing link…' : 'Create share link'}</button>
          {shareUrl && <div className="share-link-result">
            <label>SHAREABLE STORY LINK<input readOnly value={shareUrl} /></label>
            <a href={`https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(story.title)}`} rel="noreferrer" target="_blank">Share on X</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">Share on Facebook</a>
            <button className="library-text-action" onClick={() => { void revokeShareLink() }} type="button">Disable link</button>
          </div>}
        </section>
        {isAuthor && (
          <form className="invite-form" onSubmit={invite}>
            <label>INVITE A COLLABORATOR BY EMAIL<input onChange={(event) => setEmail(event.target.value)} placeholder="writer@example.com" required type="email" value={email} /></label>
            <button className="secondary-button" type="submit">Invite</button>
          </form>
        )}
        <div className="contributors"><span>ON THIS STORY</span><div><b>{story.author.username}</b>{story.contributors.map((person) => <b key={person.id}>{person.username}{isAuthor && <button aria-label={`Remove ${person.username}`} onClick={() => { void remove(person.id, person.username) }} type="button">Remove</button>}</b>)}</div></div>
        <section className="comments"><div className="comments-heading"><p className="kicker">MARGIN NOTES · {comments.length}</p>{isAuthor && <button className="comments-setting" onClick={() => { void toggleComments() }} type="button">{commentsEnabled ? 'Disable comments' : 'Enable comments'}</button>}</div>
          {comments.map((item) => <article className="comment" key={item.id}>
            <strong>{item.author.displayName || item.author.username}</strong>
            {editingCommentId === item.id
              ? <form className="comment-edit-form" onSubmit={(event) => { void saveComment(event) }}><textarea maxLength={1000} onChange={(event) => setEditedContent(event.target.value)} required value={editedContent} /><button className="primary-button" type="submit">Save comment</button><button className="secondary-button" onClick={() => setEditingCommentId(null)} type="button">Cancel</button></form>
              : <p>{item.content}</p>}
            <time>{new Date(item.createdAt).toLocaleString()}</time>
            {commentsEnabled && <button className={`comment-reaction ${item.reactedByMe ? 'reacted' : ''}`} onClick={() => { void dispatch(reactToComment({ storyId: story.id, commentId: item.id })).unwrap().catch((reason: unknown) => setError(typeof reason === 'string' ? reason : 'Could not react to this comment.')) }} type="button">Like · {item.reactionCount}</button>}
            {(item.author.id === user?.id || isAuthor) && <div className="comment-owner-actions">
              {item.author.id === user?.id && <button onClick={() => { setEditingCommentId(item.id); setEditedContent(item.content) }} type="button">Edit</button>}
              <button onClick={() => { void removeComment(item.id) }} type="button">Delete</button>
            </div>}
          </article>)}
          {comments.length === 0 && <p className="no-comments">{commentsEnabled ? 'No notes yet. Leave the first one.' : 'Comments are disabled for this story.'}</p>}
          {commentsEnabled && <form className="comment-form" onSubmit={(event) => { void sendComment(event) }}><input maxLength={1000} onChange={(event) => setComment(event.target.value)} placeholder="Add a thoughtful note..." required value={comment} /><button className="primary-button" type="submit">Send</button></form>}
        </section>
        {canEdit && <p className="detail-edit-note">You can edit this story from the story menu.</p>}
      </article>
    </div>
  )
}

function PublicStoryPage({ token }: { token: string }) {
  const [story, setStory] = useState<{ title: string; content: string; author: User } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void apiRequest<{ story: { title: string; content: string; author: User } }>(
      `/public/stories/${encodeURIComponent(token)}`,
    ).then((result) => setStory(result.story))
      .catch((reason: unknown) => setError(reason instanceof RequestError ? reason.message : 'Could not load this shared story.'))
  }, [token])

  return (
    <main className="public-story-page">
      <header className="public-story-header"><a className="home-brand" href="/">plot<span>.</span></a><span>SHARED STORY</span></header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {story
        ? <article className="public-story"><p className="kicker">A STORY BY {story.author.displayName || story.author.username}</p><h1>{story.title}</h1><p className="public-story-author">{story.author.bio || 'A storyteller on Plot.'}</p><div className="public-story-content">{story.content}</div></article>
        : !error && <p className="public-story-loading">Loading shared story…</p>}
    </main>
  )
}

function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.accessToken)
  const storiesState = useAppSelector((state) => state.stories)
  const [library, setLibrary] = useLibraryState(user?.id ?? 0)
  const [ownOnly, setOwnOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')
  const [composer, setComposer] = useState<Story | null | undefined>(undefined)
  const [selected, setSelected] = useState<Story | null>(null)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const stories = storiesState.items
    .filter((story) => !ownOnly || story.author.id === user?.id)
    .sort((first, second) => sortBy === 'title'
      ? first.title.localeCompare(second.title)
      : second.updatedAt.localeCompare(first.updatedAt))

  useEffect(() => {
    if (token) void dispatch(loadStories())
  }, [dispatch, token])

  async function logout() {
    const result = await dispatch(signOut())
    if (signOut.rejected.match(result)) {
      dispatch(clearSession())
    }
    dispatch(clearStories())
    onSignedOut()
  }

  async function removeStory(story: Story) {
    if (!window.confirm(`Delete “${story.title}”? This cannot be undone.`)) return
    const result = await dispatch(deleteStory(story.id))
    if (deleteStory.rejected.match(result)) {
      window.alert(result.payload || 'Could not delete this story.')
      return
    }
    setLibrary((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.storyId !== story.id),
      history: current.history.filter((item) => item.storyId !== story.id),
    }))
  }

  function openStory(story: Story) {
    setLibrary((current) => ({
      ...current,
      history: [{ storyId: story.id, lastReadAt: new Date().toISOString() }, ...current.history.filter((item) => item.storyId !== story.id)].slice(0, 50),
    }))
    setSelected(story)
  }

  if (composer !== undefined) {
    return <StoryComposer onClose={() => setComposer(undefined)} story={composer || undefined} />
  }
  if (profileUserId !== null && user && token) {
    return <ProfilePage
      currentUser={user}
      onClose={() => setProfileUserId(null)}
      onOpenStory={(story) => { setProfileUserId(null); openStory(story) }}
      token={token}
      userId={profileUserId}
    />
  }

  return (
    <main className="dashboard min-h-screen">
      <header className={`dashboard-nav ${menuOpen ? 'menu-open' : ''}`}>
        <a className="wordmark" href="#home">plot<span className="wordmark-dot">.</span></a>
        <button aria-controls="dashboard-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button"><span /><span /><span /></button>
        <div className="dashboard-nav-panel" id="dashboard-navigation">
          <nav className="nav-links">
            <a className="nav-active" href="#stories" onClick={() => setMenuOpen(false)}>Stories</a>
            <a href="#library" onClick={() => setMenuOpen(false)}>My Library</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <button className="nav-write-button" onClick={() => { setMenuOpen(false); setComposer(null) }} type="button">Write a story</button>
          </nav>
          <div className="nav-user"><button className="nav-username" onClick={() => { setMenuOpen(false); setProfileUserId(user?.id ?? null) }} type="button">Profile: {user?.displayName || user?.username}</button><button className="logout-button" onClick={() => { void logout() }} type="button">Sign out</button></div>
        </div>
      </header>

      <section className="dashboard-hero">
        <div className="hero-text"><p className="kicker">THE SHARED STORY STUDIO</p><h1>A story is never<br />just <em>one voice.</em></h1><p>Stories grow in the spaces between us. Find a thread, add a line, and see what we make together.</p><a href="#stories" className="scroll-link">FIND YOUR NEXT STORY</a></div>
        <div className="hero-index"><span>COLLECTIVE<br />IMAGINATION</span><span>EST. 2025<br />EVERYWHERE</span></div>
      </section>

      {user && <MyLibrarySection library={library} onOpenStory={setSelected} setLibrary={setLibrary} stories={storiesState.items} />}

      <section className="stories-section" id="stories">
        <div className="stories-heading"><button className="primary-button start-button" onClick={() => setComposer(null)} type="button">Start a story</button></div>
        <div className="stories-toolbar"><div className="story-total"><strong>{String(storiesState.items.length).padStart(2, '0')}</strong> STORIES IN PROGRESS</div><div className="story-filters"><button className={!ownOnly ? 'selected' : ''} onClick={() => setOwnOnly(false)} type="button">All stories</button><button className={ownOnly ? 'selected' : ''} onClick={() => setOwnOnly(true)} type="button">My stories</button></div>        <label className="sort-control">SORT BY <select className="rounded border border-current/20 px-2 py-1" onChange={(event) => setSortBy(event.target.value as 'recent' | 'title')} value={sortBy}><option value="recent">Recently updated</option><option value="title">Title</option></select></label></div>
        {storiesState.error && <p className="inline-error" role="alert">{storiesState.error}</p>}
        {storiesState.status === 'loading' && <div className="loading-state">Gathering the stories<span>...</span></div>}
        {storiesState.status !== 'loading' && stories.length === 0 && <div className="empty-shelf"><h3>No stories on this shelf. Yet.</h3><p>Be the first to start a story, then invite someone to add their voice.</p><button className="secondary-button" onClick={() => setComposer(null)} type="button">Write the first line</button></div>}
        <div className="story-grid">
          {stories.map((story, index) => {
            const author = story.author.id === user?.id
            const inLibrary = library.entries.some((entry) => entry.storyId === story.id)
            const palette = ['story-card-sage', 'story-card-rose', 'story-card-amber', 'story-card-blue']
            return <article className={`story-card ${palette[index % palette.length]}`} key={story.id}>
              <div className="story-card-top"><span className="story-label">STORY NO. {String(story.id).padStart(3, '0')}</span><div className="card-menu">{author && <button aria-label={`Delete ${story.title}`} onClick={() => { void removeStory(story) }} type="button">Delete</button>}</div></div>
              <button className="story-card-open" onClick={() => openStory(story)} type="button"><h3>{story.title}</h3><p>{story.content.slice(0, 135)}{story.content.length > 135 ? '…' : ''}</p></button>
              <div className="story-card-bottom"><span>{story.contributors.length + 1} {story.contributors.length === 0 ? 'WRITER' : 'WRITERS'}</span><time>{new Date(story.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time><button className="story-open-button" onClick={() => openStory(story)} type="button">Open story</button></div>
              <button className="story-library-action" onClick={() => setLibrary((current) => ({
                ...current,
                entries: current.entries.some((entry) => entry.storyId === story.id)
                  ? current.entries.filter((entry) => entry.storyId !== story.id)
                  : [...current.entries, { storyId: story.id, shelf: 'saved', progress: 0, collection: '' }],
              }))} type="button">{inLibrary ? 'Remove from library' : 'Save to library'}</button>
              {(author || story.contributors.some((item) => item.id === user?.id)) && <button className="edit-story-link" onClick={() => setComposer(story)} type="button">Edit story</button>}
            </article>
          })}
          {storiesState.status !== 'loading' && !ownOnly && <button className="new-story-card" onClick={() => setComposer(null)} type="button"><strong>There&apos;s room for<br />another story.</strong><small>Start something together</small></button>}
        </div>
      </section>

      <section className="manifesto" id="how-it-works"><p>Somewhere between<br /><em>your words and mine,</em><br />a new world appears.</p><span className="manifesto-credit">A NOTE FROM THE STUDIO · 001</span></section>
      <footer className="dashboard-footer"><a className="wordmark" href="#home">plot<span className="wordmark-dot">.</span></a><p>A shared space for stories still being written.</p><span>WRITE WHAT HAPPENS NEXT.</span></footer>
      {selected && <StoryDetail isAuthor={selected.author.id === user?.id} onClose={() => setSelected(null)} onOpenProfile={setProfileUserId} story={selected} />}
    </main>
  )
}

function App() {
  const dispatch = useAppDispatch()
  const { checking, accessToken } = useAppSelector((state) => state.auth)
  const [authPage, setAuthPage] = useState<Page | null>(null)
  const [returningVisitor, setReturningVisitor] = useState(hasVisitedBefore)
  const shareToken = new URLSearchParams(window.location.search).get('share')

  useEffect(() => {
    void dispatch(restoreSession())
    try {
      localStorage.setItem(visitStorageKey, 'true')
    } catch (error) {
      console.warn('Could not save the previous-visit setting.', error)
    }
  }, [dispatch])

  if (shareToken) return <PublicStoryPage token={shareToken} />
  if (checking) {
    return <main className="boot-screen"><p>Finding your stories…</p></main>
  }
  if (accessToken) return <Dashboard onSignedOut={() => setReturningVisitor(true)} />
  if (authPage) {
    return (
      <AuthScreen
        initialPage={authPage}
        onAuthenticated={() => {
          setAuthPage(null)
          setReturningVisitor(true)
        }}
        onHome={() => setAuthPage(null)}
      />
    )
  }
  return <HomePage onAuth={setAuthPage} returningVisitor={returningVisitor} />
}

export default App
