import type { JwtPayload } from 'jsonwebtoken'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
}

export interface PublicUser {
  id: string
  name: string
  email: string
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string
  tokenType: 'access'
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string
  jti: string
  tokenType: 'refresh'
}

export interface RefreshSession {
  userId: string
  expiresAt: number
}
