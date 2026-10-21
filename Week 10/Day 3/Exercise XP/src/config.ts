import 'dotenv/config'

function getSecret(name: string): string {
  const value = process.env[name]

  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to a secret of at least 32 characters.`)
  }

  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  isProduction: process.env.NODE_ENV === 'production',
  accessTokenSecret: getSecret('ACCESS_TOKEN_SECRET'),
  refreshTokenSecret: getSecret('REFRESH_TOKEN_SECRET'),
}
