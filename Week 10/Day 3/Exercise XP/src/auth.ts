import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from './tokens.js'

export function requireAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const token = request.cookies?.accessToken

  if (typeof token !== 'string') {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    response.clearCookie('accessToken')
    response.status(401).json({ error: 'Session expired or invalid.' })
    return
  }

  response.locals.userId = payload.sub
  next()
}
