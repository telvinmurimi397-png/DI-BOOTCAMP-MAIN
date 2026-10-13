const USERS_KEY = 'todo-ninja-users'
const SESSION_KEY = 'todo-ninja-session'
const encoder = new TextEncoder()

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function readUsers() {
  const users = readJson(USERS_KEY, [])
  return Array.isArray(users) ? users : []
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function createToken() {
  return crypto.randomUUID()
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function saveSession(user) {
  const session = { userId: user.id, token: createToken() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { user: publicUser(user), token: session.token }
}

export const authService = {
  restoreSession() {
    const session = readJson(SESSION_KEY, null)
    if (!session?.token || !session?.userId) return null

    const user = readUsers().find((item) => item.id === session.userId)
    if (!user) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return { user: publicUser(user), token: session.token }
  },

  async register({ name, email, password }) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Enter a valid email address.')
    }
    if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
      throw new Error('Use at least 8 characters, including a letter and a number.')
    }

    const users = readUsers()
    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('An account with this email already exists. Try signing in.')
    }

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      salt: crypto.randomUUID(),
      passwordHash: '',
    }
    user.passwordHash = await hashPassword(password, user.salt)
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
    return saveSession(user)
  },

  async login({ email, password }) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const normalizedEmail = email.trim().toLowerCase()
    const user = readUsers().find((item) => item.email === normalizedEmail)
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      throw new Error('Email or password is incorrect.')
    }
    return saveSession(user)
  },

  logout() {
    localStorage.removeItem(SESSION_KEY)
  },
}
