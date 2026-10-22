import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

function secret(name: 'JWT_SECRET' | 'REFRESH_SECRET'): string {
  const value = process.env[name]
  if (!value || value.length < 32) throw new Error(`${name} must contain at least 32 characters.`)
  return value
}

export const accessSecret = () => secret('JWT_SECRET')
export const refreshSecret = () => secret('REFRESH_SECRET')

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) {
    res.status(401).json({ message: 'Sign in to continue.' })
    return
  }

  try {
    const payload = jwt.verify(token, accessSecret())
    if (typeof payload === 'string' || typeof payload.userId !== 'number') {
      res.status(401).json({ message: 'Your session is invalid. Please sign in again.' })
      return
    }
    req.user = { userId: payload.userId }
    next()
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

export function issueAccessToken(userId: number): string {
  return jwt.sign({ userId }, accessSecret(), { expiresIn: '15m' })
}

export function issueRefreshToken(userId: number): string {
  return jwt.sign({ userId }, refreshSecret(), { expiresIn: '7d' })
}

export function verifyRefreshToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, refreshSecret()) as JwtPayload
    return typeof payload.userId === 'number' ? payload.userId : null
  } catch {
    return null
  }
}
