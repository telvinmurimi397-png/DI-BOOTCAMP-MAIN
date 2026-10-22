import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import {
  authenticate,
  issueAccessToken,
  issueRefreshToken,
  refreshSecret,
  verifyRefreshToken,
} from '../middleware/authenticate.js'

export const authRouter = Router()

function setRefreshCookie(res: Parameters<Parameters<typeof authRouter.post>[1]>[1], token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!username || username.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      res.status(400).json({ message: 'Enter a username, valid email, and password of 8–72 characters.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query<{ id: number; username: string; email: string }>(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
        RETURNING id, username, email, COALESCE(display_name, username) AS "displayName",
          bio, avatar_url AS "avatarUrl"`,
      [username, email, passwordHash],
    )
    const user = result.rows[0]
    setRefreshCookie(res, issueRefreshToken(user.id))
    res.status(201).json({ user, accessToken: issueAccessToken(user.id) })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      res.status(409).json({ message: 'An account with that email already exists.' })
      return
    }
    next(error)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' })
      return
    }
    const result = await pool.query<{
      id: number
      username: string
      email: string
      password_hash: string
      displayName: string
      bio: string
      avatarUrl: string | null
    }>(`SELECT id, username, email, password_hash,
        COALESCE(display_name, username) AS "displayName", bio, avatar_url AS "avatarUrl"
        FROM users WHERE email = $1`, [email])
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ message: 'Email or password is incorrect.' })
      return
    }

    setRefreshCookie(res, issueRefreshToken(user.id))
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken: issueAccessToken(user.id),
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  const userId = typeof token === 'string' ? verifyRefreshToken(token) : null
  if (!userId) {
    res.clearCookie('refreshToken', { path: '/api/auth' })
    res.status(401).json({ message: 'Please sign in again.' })
    return
  }

  const result = await pool.query<{ id: number; username: string; email: string }>(
    `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
      bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
    [userId],
  )
  const user = result.rows[0]
  if (!user) {
    res.clearCookie('refreshToken', { path: '/api/auth' })
    res.status(401).json({ message: 'Please sign in again.' })
    return
  }
  setRefreshCookie(res, jwt.sign({ userId }, refreshSecret(), { expiresIn: '7d' }))
  res.json({ user, accessToken: issueAccessToken(userId) })
})

authRouter.post('/logout', authenticate, (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' })
  res.status(204).end()
})

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query<{ id: number; username: string; email: string }>(
      `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
        bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
      [req.user?.userId],
    )
    if (!result.rows[0]) {
      res.status(401).json({ message: 'Please sign in again.' })
      return
    }
    res.json({ user: result.rows[0] })
  } catch (error) {
    next(error)
  }
})
