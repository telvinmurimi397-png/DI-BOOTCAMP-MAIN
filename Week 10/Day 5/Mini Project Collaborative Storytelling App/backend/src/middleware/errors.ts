import type { ErrorRequestHandler, RequestHandler } from 'express'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'That endpoint does not exist.' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Request failed.', error)
  if (res.headersSent) return
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
}
