import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { pool } from './db/pool.js'
import { accessSecret } from './middleware/authenticate.js'

declare module 'socket.io' {
  interface SocketData {
    userId: number
    username: string
    displayName: string
    storyId?: number
  }
}

export function attachStorySockets(io: Server): void {
  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth.token
    if (typeof token !== 'string') {
      next(new Error('Sign in to collaborate.'))
      return
    }
    try {
      const payload = jwt.verify(token, accessSecret())
      if (typeof payload === 'string' || typeof payload.userId !== 'number') {
        next(new Error('Your session is invalid. Please sign in again.'))
        return
      }
      void pool.query<{ username: string; displayName: string }>(
        `SELECT username, COALESCE(display_name, username) AS "displayName"
          FROM users WHERE id = $1`,
        [payload.userId],
      ).then((result) => {
        if (!result.rows[0]) {
          next(new Error('Your account could not be found.'))
          return
        }
        socket.data.userId = payload.userId
        socket.data.username = result.rows[0].username
        socket.data.displayName = result.rows[0].displayName
        next()
      }).catch(next)
    } catch {
      next(new Error('Your session has expired. Please sign in again.'))
    }
  })

  io.on('connection', (socket) => {
    const updatePresence = async (storyId: number) => {
      const clients = await io.in(`story:${storyId}`).fetchSockets()
      const collaborators = [...new Map(clients.map((client) => [
        client.data.userId,
        { id: client.data.userId, username: client.data.username, displayName: client.data.displayName },
      ])).values()]
      io.to(`story:${storyId}`).emit('story:presence', collaborators)
    }

    socket.on('story:join', async (storyId: unknown) => {
      if (!Number.isSafeInteger(storyId) || Number(storyId) < 1) {
        socket.emit('story:error', 'Invalid story id.')
        return
      }
      const id = Number(storyId)
      const membership = await pool.query(
        `SELECT id FROM stories s WHERE s.id = $1 AND (
          s.author_id = $2 OR EXISTS (
            SELECT 1 FROM contributors c WHERE c.story_id = s.id AND c.user_id = $2
          )
        )`,
        [id, socket.data.userId],
      )
      if (!membership.rowCount) {
        socket.emit('story:error', 'You do not have access to collaborate on this story.')
        return
      }
      if (socket.data.storyId) {
        await socket.leave(`story:${socket.data.storyId}`)
        await updatePresence(socket.data.storyId)
      }
      socket.data.storyId = id
      await socket.join(`story:${id}`)
      await updatePresence(id)
    })

    socket.on('story:edit', async (input: unknown) => {
      if (!input || typeof input !== 'object') return
      const { title, content, storyId } = input as { title?: unknown; content?: unknown; storyId?: unknown }
      const id = socket.data.storyId
      if (!id || storyId !== id || typeof title !== 'string' || !title.trim() ||
        title.trim().length > 180 || typeof content !== 'string' || content.length > 50_000) {
        socket.emit('story:error', 'Story changes were invalid and were not saved.')
        return
      }
      const result = await pool.query(
        `UPDATE stories SET title = $1, content = $2, updated_at = NOW()
          WHERE id = $3 AND (author_id = $4 OR EXISTS (
            SELECT 1 FROM contributors c WHERE c.story_id = stories.id AND c.user_id = $4
          )) RETURNING updated_at AS "updatedAt"`,
        [title.trim(), content, id, socket.data.userId],
      )
      if (!result.rowCount) {
        socket.emit('story:error', 'This story is no longer available to edit.')
        return
      }
      socket.to(`story:${id}`).emit('story:updated', {
        storyId: id,
        title: title.trim(),
        content,
        updatedAt: result.rows[0].updatedAt,
        author: { id: socket.data.userId, username: socket.data.username, displayName: socket.data.displayName },
      })
    })

    socket.on('story:cursor', (input: unknown) => {
      if (!input || typeof input !== 'object' || !socket.data.storyId) return
      const { start, end } = input as { start?: unknown; end?: unknown }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        Number(start) < 0 || Number(end) < 0 || Number(start) > 50_000 || Number(end) > 50_000) return
      socket.to(`story:${socket.data.storyId}`).emit('story:cursor', {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
        start: Number(start),
        end: Number(end),
      })
    })

    socket.on('disconnect', () => {
      if (socket.data.storyId) void updatePresence(socket.data.storyId)
    })
  })
}
