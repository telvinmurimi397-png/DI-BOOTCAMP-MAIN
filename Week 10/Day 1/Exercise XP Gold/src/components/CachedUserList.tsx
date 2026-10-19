import useDataFetching from '../hooks/useDataFetching'

interface ApiUser {
  id: number
  name: string
  username: string
  email: string
  company: {
    name: string
  }
}

const USERS_URL = 'https://jsonplaceholder.typicode.com/users'
const FIVE_MINUTES = 5 * 60 * 1000

function CachedUserList() {
  const { data: users, isLoading, error, fetchedAt, refetch, invalidateCache } =
    useDataFetching<ApiUser[]>(USERS_URL, { maxAge: FIVE_MINUTES })

  async function clearCacheAndRefresh() {
    invalidateCache()
    await refetch()
  }

  return (
    <div className="cached-users">
      <div className="cache-toolbar">
        <p className="cache-explanation">
          Requests for this URL share a five-minute in-memory cache. Refresh skips it; clear removes it first.
        </p>
        <div className="cache-actions">
          <button className="button button-light" type="button" onClick={() => void refetch()} disabled={isLoading}>
            Refresh <span aria-hidden="true">↻</span>
          </button>
          <button className="button button-dark" type="button" onClick={() => void clearCacheAndRefresh()} disabled={isLoading}>
            Clear cache & refresh <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      {isLoading && <p className="cache-state" role="status"><span className="spinner" /> Fetching users…</p>}
      {error && (
        <div className="cache-error" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={() => void refetch()}>Try again ↗</button>
        </div>
      )}
      {!isLoading && !error && users && (
        <>
          <div className="user-list-meta"><span>{users.length} USERS</span><span>UPDATED {fetchedAt ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
          <ul className="cached-user-list">
            {users.map((user) => (
              <li className="cached-user" key={user.id}>
                <span className="cached-avatar" aria-hidden="true">{user.name.charAt(0)}</span>
                <span className="cached-user-copy"><strong>{user.name}</strong><span>@{user.username} · {user.company.name}</span></span>
                <a href={`mailto:${user.email}`} aria-label={`Email ${user.name}`}>↗</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default CachedUserList
