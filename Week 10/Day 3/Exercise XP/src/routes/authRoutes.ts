import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { rateLimit } from 'express-rate-limit'
import { findUserByEmail, findUserById, createUser, toPublicUser, updateUserName } from '../users.js'
import {
  issueTokenPair,
  revokeRefreshToken,
  rotateRefreshToken,
  tokenCookieAges,
} from '../tokens.js'
import { config } from '../config.js'
import { requireAuthentication } from '../auth.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
})
const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12)

function setTokenCookies(
  response: import('express').Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict' as const,
    path: '/',
  }

  response.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokenCookieAges.access,
  })
  response.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: tokenCookieAges.refresh,
  })
}

function clearTokenCookies(response: import('express').Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict' as const,
    path: '/',
  }

  response.clearCookie('accessToken', cookieOptions)
  response.clearCookie('refreshToken', cookieOptions)
}

router.post('/register', authLimiter, async (request, response, next) => {
  const { name, email, password } = request.body ?? {}

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    response.status(400).json({ error: 'Name must be between 2 and 80 characters.' })
    return
  }

  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    response.status(400).json({ error: 'Enter a valid email address.' })
    return
  }

  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    response.status(400).json({
      error: 'Password must be 12-128 characters and include lowercase, uppercase, and a number.',
    })
    return
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (findUserByEmail(normalizedEmail)) {
    response.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  try {
    const user = await createUser(name.trim(), normalizedEmail, password)
    setTokenCookies(response, issueTokenPair(user))
    response.status(201).json({ user: toPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  const { email, password } = request.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  try {
    const user = findUserByEmail(email.trim().toLowerCase())
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? dummyPasswordHash,
    )

    if (!user || !passwordMatches) {
      response.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    setTokenCookies(response, issueTokenPair(user))
    response.json({ user: toPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/refresh', authLimiter, (request, response) => {
  const token = request.cookies?.refreshToken
  const tokens = typeof token === 'string' ? rotateRefreshToken(token) : null

  if (!tokens) {
    clearTokenCookies(response)
    response.status(401).json({ error: 'Refresh token is invalid, expired, or revoked.' })
    return
  }

  setTokenCookies(response, tokens)
  response.status(200).json({ message: 'Session refreshed.' })
})

router.post('/logout', (request, response) => {
  revokeRefreshToken(request.cookies?.refreshToken)
  clearTokenCookies(response)
  response.status(204).end()
})

router.get('/me', requireAuthentication, (request, response) => {
  const user = findUserById(response.locals.userId as string)

  if (!user) {
    clearTokenCookies(response)
    response.status(401).json({ error: 'Account not found.' })
    return
  }

  response.json({ user: toPublicUser(user) })
})

router.patch('/profile', requireAuthentication, (request, response) => {
  const { name } = request.body ?? {}
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    response.status(400).json({ error: 'Name must be between 2 and 80 characters.' })
    return
  }

  const user = findUserById(response.locals.userId as string)
  if (!user) {
    clearTokenCookies(response)
    response.status(401).json({ error: 'Account not found.' })
    return
  }

  response.json({ user: updateUserName(user, name.trim()) })
})

export default router
