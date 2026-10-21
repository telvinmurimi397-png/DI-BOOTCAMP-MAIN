import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import type {
  AccessTokenPayload,
  RefreshSession,
  RefreshTokenPayload,
  User,
} from './types.js'

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
const refreshSessions = new Map<string, RefreshSession>()

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export function issueTokenPair(user: User): TokenPair {
  const jti = randomUUID()
  const accessToken = jwt.sign(
    { tokenType: 'access' },
    config.accessTokenSecret,
    {
      algorithm: 'HS256',
      subject: user.id,
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  )
  const refreshToken = jwt.sign(
    { tokenType: 'refresh' },
    config.refreshTokenSecret,
    {
      algorithm: 'HS256',
      subject: user.id,
      jwtid: jti,
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    },
  )

  refreshSessions.set(jti, {
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  })

  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, config.accessTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
    })

    if (
      typeof payload === 'string' ||
      payload.tokenType !== 'access' ||
      typeof payload.sub !== 'string'
    ) {
      return null
    }

    return payload as AccessTokenPayload
  } catch {
    return null
  }
}

export function rotateRefreshToken(token: string): TokenPair | null {
  let payload: RefreshTokenPayload

  try {
    const verified = jwt.verify(token, config.refreshTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
    })

    if (
      typeof verified === 'string' ||
      verified.tokenType !== 'refresh' ||
      typeof verified.sub !== 'string' ||
      typeof verified.jti !== 'string'
    ) {
      return null
    }

    payload = verified as RefreshTokenPayload
  } catch {
    return null
  }

  const session = refreshSessions.get(payload.jti)
  if (
    !session ||
    session.userId !== payload.sub ||
    session.expiresAt <= Date.now()
  ) {
    refreshSessions.delete(payload.jti)
    return null
  }

  refreshSessions.delete(payload.jti)
  return createPairForUserId(payload.sub)
}

function createPairForUserId(userId: string): TokenPair | null {
  const refreshToken = createRefreshToken(userId)
  const accessToken = jwt.sign(
    { tokenType: 'access' },
    config.accessTokenSecret,
    {
      algorithm: 'HS256',
      subject: userId,
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  )

  return { accessToken, refreshToken }
}

function createRefreshToken(userId: string): string {
  const jti = randomUUID()
  const refreshToken = jwt.sign(
    { tokenType: 'refresh' },
    config.refreshTokenSecret,
    {
      algorithm: 'HS256',
      subject: userId,
      jwtid: jti,
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    },
  )

  refreshSessions.set(jti, {
    userId,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  })

  return refreshToken
}

export function revokeRefreshToken(token: string | undefined): void {
  if (!token) return

  try {
    const payload = jwt.verify(token, config.refreshTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'jwt-auth-exercise',
      audience: 'jwt-auth-client',
      ignoreExpiration: true,
    })

    if (typeof payload !== 'string' && typeof payload.jti === 'string') {
      refreshSessions.delete(payload.jti)
    }
  } catch {
    // Invalid tokens cannot identify a session to revoke.
  }
}

export const tokenCookieAges = {
  access: ACCESS_TOKEN_TTL_SECONDS * 1000,
  refresh: REFRESH_TOKEN_TTL_SECONDS * 1000,
}
