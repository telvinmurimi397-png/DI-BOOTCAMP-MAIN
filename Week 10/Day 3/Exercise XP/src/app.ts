import express, { type ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' })
})

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    response.status(400).json({ error: 'Request body contains invalid JSON.' })
    return
  }

  console.error(error)
  response.status(500).json({ error: 'An unexpected server error occurred.' })
}

app.use(errorHandler)
