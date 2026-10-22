import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/authenticate.js'

export const storiesRouter = Router()
storiesRouter.use(authenticate)

const storySelect = `
  SELECT s.id, s.title, s.content,
    s.created_at AS "createdAt", s.updated_at AS "updatedAt",
    s.comments_enabled AS "commentsEnabled",
    json_build_object(
      'id', a.id, 'username', a.username, 'email', a.email,
      'displayName', COALESCE(a.display_name, a.username), 'bio', a.bio, 'avatarUrl', a.avatar_url
    ) AS author,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id', u.id, 'username', u.username, 'email', u.email, 'contributorId', c.id,
        'displayName', COALESCE(u.display_name, u.username), 'avatarUrl', u.avatar_url
      ))
      FROM contributors c JOIN users u ON u.id = c.user_id WHERE c.story_id = s.id
    ), '[]'::json) AS contributors
  FROM stories s JOIN users a ON a.id = s.author_id
`

storiesRouter.get('/', async (req, res) => {
  const result = await pool.query(
    `${storySelect} ORDER BY s.updated_at DESC`,
  )
  res.json({ stories: result.rows })
})

storiesRouter.post('/', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!title || title.length > 180 || !content || content.length > 50000) {
    res.status(400).json({ message: 'A title (up to 180 characters) and story content (up to 50,000 characters) are required.' })
    return
  }
  const result = await pool.query(
    `WITH created AS (
      INSERT INTO stories (title, content, author_id) VALUES ($1, $2, $3) RETURNING id
    )
    ${storySelect} JOIN created ON created.id = s.id`,
    [title, content, req.user?.userId],
  )
  await pool.query(
    'INSERT INTO story_versions (story_id, title, content, author_id) VALUES ($1, $2, $3, $4)',
    [result.rows[0].id, title, content, req.user?.userId],
  )
  res.status(201).json({ story: result.rows[0] })
})

storiesRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `${storySelect} WHERE s.id = $1`,
    [id],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Story not found.' })
    return
  }
  res.json({ story: result.rows[0] })
})

storiesRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!Number.isSafeInteger(id) || id < 1 || !title || title.length > 180 || !content || content.length > 50000) {
    res.status(400).json({ message: 'Provide a valid story id, title, and content.' })
    return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE stories SET title = $1, content = $2, updated_at = NOW()
        WHERE id = $3 AND (author_id = $4 OR EXISTS (
          SELECT 1 FROM contributors c WHERE c.story_id = stories.id AND c.user_id = $4
        )) RETURNING id`,
      [title, content, id, req.user?.userId],
    )
    if (!result.rowCount) {
      await client.query('ROLLBACK')
      res.status(404).json({ message: 'Story not found or you do not have permission to edit it.' })
      return
    }
    await client.query(
      'INSERT INTO story_versions (story_id, title, content, author_id) VALUES ($1, $2, $3, $4)',
      [id, title, content, req.user?.userId],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  const story = await pool.query(`${storySelect} WHERE s.id = $1`, [id])
  res.json({ story: story.rows[0] })
})

storiesRouter.patch('/:id/comments/settings', async (req, res) => {
  const id = Number(req.params.id)
  const enabled = req.body?.enabled
  if (!Number.isSafeInteger(id) || id < 1 || typeof enabled !== 'boolean') {
    res.status(400).json({ message: 'Provide a valid story id and comment setting.' })
    return
  }
  const result = await pool.query(
    'UPDATE stories SET comments_enabled = $1 WHERE id = $2 AND author_id = $3 RETURNING comments_enabled AS "commentsEnabled"',
    [enabled, id, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Story not found or you do not have permission to edit it.' })
    return
  }
  res.json(result.rows[0])
})

storiesRouter.get('/:id/versions', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `SELECT v.id, v.title, v.content, v.created_at AS "createdAt",
      json_build_object('id', u.id, 'username', u.username, 'displayName', COALESCE(u.display_name, u.username)) AS author
      FROM story_versions v JOIN users u ON u.id = v.author_id
      WHERE v.story_id = $1 AND EXISTS (
        SELECT 1 FROM stories s WHERE s.id = v.story_id
          AND (s.author_id = $2 OR EXISTS (
            SELECT 1 FROM contributors c WHERE c.story_id = s.id AND c.user_id = $2
          ))
      )
      ORDER BY v.created_at DESC LIMIT 100`,
    [id, req.user?.userId],
  )
  res.json({ versions: result.rows })
})

storiesRouter.post('/:id/versions/:versionId/restore', async (req, res) => {
  const storyId = Number(req.params.id)
  const versionId = Number(req.params.versionId)
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(versionId) || versionId < 1) {
    res.status(400).json({ message: 'Provide valid story and version ids.' })
    return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const version = await client.query<{ title: string; content: string }>(
      `SELECT v.title, v.content FROM story_versions v
        WHERE v.id = $1 AND v.story_id = $2 AND EXISTS (
          SELECT 1 FROM stories s WHERE s.id = v.story_id
            AND (s.author_id = $3 OR EXISTS (
              SELECT 1 FROM contributors c WHERE c.story_id = s.id AND c.user_id = $3
            ))
        )`,
      [versionId, storyId, req.user?.userId],
    )
    if (!version.rows[0]) {
      await client.query('ROLLBACK')
      res.status(404).json({ message: 'Version not found or you do not have permission to restore it.' })
      return
    }
    const restored = version.rows[0]
    const update = await client.query(
      `UPDATE stories SET title = $1, content = $2, updated_at = NOW()
        WHERE id = $3 AND (author_id = $4 OR EXISTS (
          SELECT 1 FROM contributors c WHERE c.story_id = stories.id AND c.user_id = $4
        )) RETURNING id`,
      [restored.title, restored.content, storyId, req.user?.userId],
    )
    if (!update.rowCount) {
      await client.query('ROLLBACK')
      res.status(404).json({ message: 'Story not found or you do not have permission to edit it.' })
      return
    }
    await client.query(
      'INSERT INTO story_versions (story_id, title, content, author_id) VALUES ($1, $2, $3, $4)',
      [storyId, restored.title, restored.content, req.user?.userId],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  const story = await pool.query(`${storySelect} WHERE s.id = $1`, [storyId])
  res.json({ story: story.rows[0] })
})

storiesRouter.post('/:id/share', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const token = randomBytes(24).toString('hex')
  const result = await pool.query<{ shareToken: string }>(
    `UPDATE stories SET share_token = COALESCE(share_token, $1)
      WHERE id = $2 AND (author_id = $3 OR EXISTS (
        SELECT 1 FROM contributors c WHERE c.story_id = stories.id AND c.user_id = $3
      )) RETURNING share_token AS "shareToken"`,
    [token, id, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Story not found or you do not have permission to share it.' })
    return
  }
  res.json({ shareToken: result.rows[0].shareToken })
})

storiesRouter.delete('/:id/share', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `UPDATE stories SET share_token = NULL
      WHERE id = $1 AND (author_id = $2 OR EXISTS (
        SELECT 1 FROM contributors c WHERE c.story_id = stories.id AND c.user_id = $2
      ))`,
    [id, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Story not found or you do not have permission to manage its share link.' })
    return
  }
  res.status(204).end()
})

storiesRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    'DELETE FROM stories WHERE id = $1 AND author_id = $2',
    [id, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Story not found or you are not its author.' })
    return
  }
  res.status(204).end()
})

storiesRouter.post('/:id/contributors', async (req, res) => {
  const storyId = Number(req.params.id)
  const userId = Number(req.body?.userId)
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(userId) || userId < 1) {
    res.status(400).json({ message: 'Provide a valid story id and user id.' })
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
  const result = await pool.query(
    `INSERT INTO contributors (story_id, user_id) VALUES ($1, $2)
      ON CONFLICT (story_id, user_id) DO NOTHING
      RETURNING id, story_id AS "storyId", user_id AS "userId"`,
    [storyId, userId],
  )
  if (result.rowCount) {
    res.status(201).json({ contributor: result.rows[0] })
  } else {
    const existing = await pool.query(
      'SELECT id, story_id AS "storyId", user_id AS "userId" FROM contributors WHERE story_id = $1 AND user_id = $2',
      [storyId, userId],
    )
    res.json({ contributor: existing.rows[0] })
  }
})

storiesRouter.get('/:id/contributors', async (req, res) => {
  const storyId = Number(req.params.id)
  if (!Number.isSafeInteger(storyId) || storyId < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `SELECT json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS user
      FROM contributors c JOIN users u ON u.id = c.user_id
      WHERE c.story_id = $1 AND EXISTS (
        SELECT 1 FROM stories s WHERE s.id = c.story_id
          AND (s.author_id = $2 OR EXISTS (
            SELECT 1 FROM contributors own WHERE own.story_id = s.id AND own.user_id = $2
          ))
      ) ORDER BY u.username`,
    [storyId, req.user?.userId],
  )
  res.json({ contributors: result.rows.map((row) => row.user) })
})

storiesRouter.delete('/contributors/:contributorId', async (req, res) => {
  const contributorId = Number(req.params.contributorId)
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

storiesRouter.get('/:id/comments', async (req, res) => {
  const storyId = Number(req.params.id)
  if (!Number.isSafeInteger(storyId) || storyId < 1) {
    res.status(400).json({ message: 'Invalid story id.' })
    return
  }
  const result = await pool.query(
    `SELECT c.id, c.content, c.created_at AS "createdAt",
      json_build_object(
        'id', u.id, 'username', u.username, 'email', u.email,
        'displayName', COALESCE(u.display_name, u.username), 'avatarUrl', u.avatar_url
      ) AS author,
      COUNT(r.comment_id)::int AS "reactionCount",
      COALESCE(BOOL_OR(r.user_id = $2), FALSE) AS "reactedByMe"
      FROM comments c JOIN users u ON u.id = c.user_id
      LEFT JOIN comment_reactions r ON r.comment_id = c.id AND r.reaction = 'like'
      WHERE c.story_id = $1
      GROUP BY c.id, u.id ORDER BY c.created_at`,
    [storyId, req.user?.userId],
  )
  res.json({ comments: result.rows })
})

storiesRouter.post('/:id/comments', async (req, res) => {
  const storyId = Number(req.params.id)
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !content || content.length > 1000) {
    res.status(400).json({ message: 'Enter a comment of 1–1,000 characters.' })
    return
  }
  const story = await pool.query<{ comments_enabled: boolean }>(
    'SELECT comments_enabled FROM stories WHERE id = $1',
    [storyId],
  )
  if (!story.rows[0]) {
    res.status(404).json({ message: 'Story not found.' })
    return
  }
  if (!story.rows[0].comments_enabled) {
    res.status(403).json({ message: 'Comments are disabled for this story.' })
    return
  }
  const result = await pool.query(
    `INSERT INTO comments (story_id, user_id, content)
      SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM stories s WHERE s.id = $1)
      RETURNING id, content, created_at AS "createdAt"`,
    [storyId, req.user?.userId, content],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Story not found.' })
    return
  }
  const user = await pool.query(
    `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
      bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
    [req.user?.userId],
  )
  res.status(201).json({ comment: { ...result.rows[0], author: user.rows[0], reactionCount: 0, reactedByMe: false } })
})

storiesRouter.patch('/:id/comments/:commentId', async (req, res) => {
  const storyId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(commentId) || commentId < 1 ||
    !content || content.length > 1000) {
    res.status(400).json({ message: 'Enter a comment of 1–1,000 characters.' })
    return
  }
  const result = await pool.query(
    `UPDATE comments c SET content = $1
      FROM stories s WHERE c.id = $2 AND c.story_id = $3 AND s.id = c.story_id
        AND c.user_id = $4 AND s.comments_enabled
      RETURNING c.id, c.content, c.created_at AS "createdAt", c.user_id AS "userId"`,
    [content, commentId, storyId, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Comment not found, comments are disabled, or you cannot edit it.' })
    return
  }
  const author = await pool.query(
    `SELECT id, username, email, COALESCE(display_name, username) AS "displayName",
      bio, avatar_url AS "avatarUrl" FROM users WHERE id = $1`,
    [result.rows[0].userId],
  )
  const reactions = await pool.query(
    `SELECT COUNT(*)::int AS "reactionCount",
      COALESCE(BOOL_OR(user_id = $2), FALSE) AS "reactedByMe"
      FROM comment_reactions WHERE comment_id = $1 AND reaction = 'like'`,
    [commentId, req.user?.userId],
  )
  res.json({ comment: { ...result.rows[0], author: author.rows[0], ...reactions.rows[0] } })
})

storiesRouter.delete('/:id/comments/:commentId', async (req, res) => {
  const storyId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(commentId) || commentId < 1) {
    res.status(400).json({ message: 'Provide valid story and comment ids.' })
    return
  }
  const result = await pool.query(
    `DELETE FROM comments c USING stories s
      WHERE c.id = $1 AND c.story_id = $2 AND s.id = c.story_id
        AND (c.user_id = $3 OR s.author_id = $3)`,
    [commentId, storyId, req.user?.userId],
  )
  if (!result.rowCount) {
    res.status(404).json({ message: 'Comment not found or you cannot delete it.' })
    return
  }
  res.status(204).end()
})

storiesRouter.post('/:id/comments/:commentId/reactions', async (req, res) => {
  const storyId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(commentId) || commentId < 1) {
    res.status(400).json({ message: 'Provide valid story and comment ids.' })
    return
  }
  const story = await pool.query<{ comments_enabled: boolean }>(
    'SELECT comments_enabled FROM stories WHERE id = $1',
    [storyId],
  )
  if (!story.rows[0]) {
    res.status(404).json({ message: 'Story not found.' })
    return
  }
  if (!story.rows[0].comments_enabled) {
    res.status(403).json({ message: 'Comment reactions are disabled for this story.' })
    return
  }
  const result = await pool.query<{ reacted: boolean; reactionCount: number }>(
    `WITH existing AS (
      DELETE FROM comment_reactions
        WHERE comment_id = $1 AND user_id = $2 AND reaction = 'like'
        RETURNING comment_id
    ), added AS (
      INSERT INTO comment_reactions (comment_id, user_id, reaction)
      SELECT $1, $2, 'like'
      WHERE NOT EXISTS (SELECT 1 FROM existing)
        AND EXISTS (SELECT 1 FROM comments WHERE id = $1 AND story_id = $3)
      ON CONFLICT DO NOTHING RETURNING comment_id
    )
    SELECT EXISTS (SELECT 1 FROM added) AS reacted,
      (SELECT COUNT(*)::int FROM comment_reactions WHERE comment_id = $1 AND reaction = 'like') AS "reactionCount"
    WHERE EXISTS (SELECT 1 FROM comments WHERE id = $1 AND story_id = $3)`,
    [commentId, req.user?.userId, storyId],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Comment not found.' })
    return
  }
  res.json(result.rows[0])
})

export const publicStoriesRouter = Router()

publicStoriesRouter.get('/:token', async (req, res) => {
  const token = req.params.token
  if (!/^[a-f0-9]{48}$/.test(token)) {
    res.status(404).json({ message: 'Shared story not found.' })
    return
  }
  const result = await pool.query(
    `SELECT s.id, s.title, s.content, s.created_at AS "createdAt", s.updated_at AS "updatedAt",
      json_build_object(
        'id', u.id, 'username', u.username, 'email', u.email,
        'displayName', COALESCE(u.display_name, u.username), 'bio', u.bio, 'avatarUrl', u.avatar_url
      ) AS author
      FROM stories s JOIN users u ON u.id = s.author_id WHERE s.share_token = $1`,
    [token],
  )
  if (!result.rows[0]) {
    res.status(404).json({ message: 'Shared story not found. The link may have been disabled.' })
    return
  }
  res.json({ story: result.rows[0] })
})
