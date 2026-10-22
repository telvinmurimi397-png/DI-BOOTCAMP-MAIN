import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/authenticate.js'

export const usersRouter = Router()
usersRouter.use(authenticate)

usersRouter.get('/me', async (req, res) => {
  const result = await pool.query(
    `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
      bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
    [req.user?.userId],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Profile not found.' })
    return
  }
  res.json({ user: result.rows[0] })
})

usersRouter.patch('/me', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : ''
  const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim() : ''
  const avatarUrl = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : null
  if (!username || username.length > 50 || displayName.length > 80 || bio.length > 500 ||
    (avatarUrl && (!/^https:\/\/\S+$/.test(avatarUrl) || avatarUrl.length > 2048))) {
    res.status(400).json({ message: 'Provide a username (1–50 characters), display name (up to 80), bio (up to 500), and secure avatar URL.' })
    return
  }
  const result = await pool.query(
    `UPDATE users SET username = $1, display_name = NULLIF($2, ''), bio = $3, avatar_url = $4
      WHERE id = $5
      RETURNING id, username, email, COALESCE(display_name, username) AS "displayName",
        bio, avatar_url AS "avatarUrl"`,
    [username, displayName, bio, avatarUrl, req.user?.userId],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Profile not found.' })
    return
  }
  res.json({ user: result.rows[0] })
})

usersRouter.get('/', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Enter a valid email address.' })
    return
  }
  const result = await pool.query(
    'SELECT id, username, email FROM users WHERE email = $1 AND id <> $2',
    [email, req.user?.userId],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'No account was found with that email.' })
    return
  }
  res.json({ user: result.rows[0] })
})

usersRouter.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isSafeInteger(userId) || userId < 1) {
    res.status(400).json({ message: 'Invalid profile id.' })
    return
  }
  const user = await pool.query(
    `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
      bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
    [userId],
  )
  if (!user.rows[0]) {
    res.status(404).json({ message: 'Profile not found.' })
    return
  }
  const stories = await pool.query(
    `SELECT s.id, s.title, s.content, s.comments_enabled AS "commentsEnabled",
      s.created_at AS "createdAt", s.updated_at AS "updatedAt",
      json_build_object(
        'id', author.id, 'username', author.username, 'email', author.email,
        'displayName', COALESCE(author.display_name, author.username),
        'bio', author.bio, 'avatarUrl', author.avatar_url
      ) AS author,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', contributor.id, 'username', contributor.username,
          'email', contributor.email, 'contributorId', c.id
        ))
        FROM contributors c JOIN users contributor ON contributor.id = c.user_id
        WHERE c.story_id = s.id
      ), '[]'::json) AS contributors
      FROM stories s JOIN users author ON author.id = s.author_id
      WHERE s.author_id = $1 ORDER BY s.updated_at DESC`,
    [userId],
  )
  res.json({ user: user.rows[0], stories: stories.rows })
})
