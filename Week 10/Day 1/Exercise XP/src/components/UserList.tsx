import { useEffect, useState } from 'react'

interface User {
  id: number
  name: string
  username: string
  email: string
  company: {
    name: string
  }
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false

  const user = value as Record<string, unknown>
  const company = user.company

  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof company === 'object' &&
    company !== null &&
    'name' in company &&
    typeof company.name === 'string'
  )
}

function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchUsers() {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users', {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Could not load users (HTTP ${response.status}).`)
        }

        const data: unknown = await response.json()
        if (!Array.isArray(data) || !data.every(isUser)) {
          throw new Error('The users response was not in the expected format.')
        }

        setUsers(data)
      } catch (fetchError: unknown) {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : 'An unexpected error occurred while loading users.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchUsers()
    return () => controller.abort()
  }, [])

  if (isLoading) {
    return <p className="user-list-status" role="status"><span className="spinner" /> Loading users…</p>
  }

  if (error) {
    return <p className="user-list-status error-message" role="alert">{error}</p>
  }

  return (
    <ul className="user-list">
      {users.map((user) => (
        <li className="api-user" key={user.id}>
          <span className="api-user-avatar" aria-hidden="true">{user.name.charAt(0)}</span>
          <span className="api-user-copy">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </span>
          <span className="api-user-company">{user.company.name}</span>
        </li>
      ))}
    </ul>
  )
}

export default UserList
