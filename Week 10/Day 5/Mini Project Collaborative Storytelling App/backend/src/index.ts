import 'dotenv/config'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.js'
import { publicStoriesRouter, storiesRouter } from './routes/stories.js'
import { usersRouter } from './routes/users.js'
import { contributorsRouter } from './routes/contributors.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { Server } from 'socket.io'
import { attachStorySockets } from './realtime.js'

const app = express()
const server = createServer(app)
const port = Number(process.env.PORT) || 3001
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production' &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin ?? '')
  if (!origin || origin === frontendOrigin || isLocalDevelopmentOrigin) {
    callback(null, true)
    return
  }
  callback(new Error('Origin not allowed by CORS.'))
}
const io = new Server(server, { cors: { origin: corsOrigin, credentials: true } })
attachStorySockets(io)

app.disable('x-powered-by')
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '60kb' }))
app.use(cookieParser())
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRouter)
app.use('/api/public/stories', publicStoriesRouter)
app.use('/api/stories', storiesRouter)
app.use('/api/users', usersRouter)
app.use('/api/contributors', contributorsRouter)
app.use(notFound)
app.use(errorHandler)

server.listen(port, () => {
  console.log(`Storytelling API listening on port ${port}.`)
})
