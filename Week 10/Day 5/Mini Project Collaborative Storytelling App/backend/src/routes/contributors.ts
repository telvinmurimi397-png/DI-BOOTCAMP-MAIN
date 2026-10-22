import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/authenticate.js'

export const contributorsRouter = Router()
contributorsRouter.use(authenticate)

contributorsRouter.post('/', async (req, res) => {
  const storyId = Number(req.body?.story_id)
  const userId = Number(req.body?.user_id)
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(userId) || userId < 1) {
    res.status(400).json({ message: 'Provide a valid story_id and user_id.' })
    return
  }
  const owner = await pool.query('SELECT id FROM stories WHERE id = $1 AND author_id = $2', [storyId, req.user?.userId])
  if (!owner.rowCount) {
    res.status(403).json({ message: 'Only the story author can invite contributors.' })
    return
  }
  if (userId === req.user?.userId) {
    res.status(400).json({ message: 'You are already the story author.' })
    return
  }
  const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId])
  if (!user.rowCount) {
    res.status(404).json({ message: 'User not found.' })
    return
  }
  const result = await pool.query(
    `INSERT INTO contributors (story_id, user_id) VALUES ($1, $2)
      ON CONFLICT (story_id, user_id) DO NOTHING
      RETURNING id, story_id AS "storyId", user_id AS "userId"`,
    [storyId, userId],
  )
  if (result.rowCount) {
    res.status(201).json({ contributor: { ...result.rows[0], user: user.rows[0] } })
    return
  }
  const existing = await pool.query(
    `SELECT c.id, c.story_id AS "storyId", c.user_id AS "userId",
      json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS user
      FROM contributors c JOIN users u ON u.id = c.user_id
      WHERE c.story_id = $1 AND c.user_id = $2`,
    [storyId, userId],
  )
  res.json({ contributor: existing.rows[0] })
})

contributorsRouter.get('/:storyId', async (req, res) => {
  const storyId = Number(req.params.storyId)
  if (!Number.isSafeInteger(storyId) || storyId < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `SELECT c.id, c.story_id AS "storyId", c.user_id AS "userId",
      json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS user
      FROM contributors c JOIN users u ON u.id = c.user_id
      WHERE c.story_id = $1 ORDER BY u.username`,
    [storyId],
  )
  res.json({ contributors: result.rows })
})

contributorsRouter.delete('/:id', async (req, res) => {
  const contributorId = Number(req.params.id)
  if (!Number.isSafeInteger(contributorId) || contributorId < 1) {
    res.status(400).json({ message: 'Invalid contributor id.' })
    return
  }
  const result = await pool.query(
    `DELETE FROM contributors c USING stories s
      WHERE c.id = $1 AND s.id = c.story_id AND s.author_id = $2`,
    [contributorId, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Contributor not found or you are not the story author.' })
    return
  }
  res.status(204).end()
})
