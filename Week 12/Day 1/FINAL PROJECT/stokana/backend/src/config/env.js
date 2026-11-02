const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const sessionSecret = process.env.SESSION_SECRET || '';
const totpEncryptionKey = process.env.TOTP_ENCRYPTION_KEY || sessionSecret;
const databaseUrl = process.env.DATABASE_URL || '';
const paymentProvider = process.env.PAYMENT_PROVIDER || 'mpesa';
const africaTalkingEnvironment = process.env.AFRICASTALKING_ENVIRONMENT || 'production';

const missing = [];
if (!databaseUrl) missing.push('DATABASE_URL');
if (!sessionSecret) missing.push('SESSION_SECRET');
if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Copy backend/.env.example to backend/.env and fill in the values.'
  );
}
if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production.');
}
if (isProduction && (!process.env.TOTP_ENCRYPTION_KEY || totpEncryptionKey.length < 32)) {
  throw new Error('TOTP_ENCRYPTION_KEY must be set to at least 32 characters in production.');
}
if (isProduction) {
  const missingDelivery = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
    'AFRICASTALKING_USERNAME',
    'AFRICASTALKING_API_KEY'
  ].filter((key) => !process.env[key]);
  if (missingDelivery.length) {
    throw new Error(
      `Missing required production verification delivery settings: ${missingDelivery.join(', ')}.`
    );
  }
}

const appUrl =
  process.env.APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 4000}`;
if (!['simulated', 'mpesa'].includes(paymentProvider)) {
  throw new Error('PAYMENT_PROVIDER must be either "mpesa" or the development-only "simulated" provider.');
}
if (paymentProvider === 'simulated' && isProduction) {
  throw new Error('PAYMENT_PROVIDER=simulated is only allowed outside production. Use M-PESA for live payments.');
}

const mpesaEnvironment = process.env.MPESA_ENVIRONMENT || 'sandbox';
if (!['sandbox', 'production'].includes(mpesaEnvironment)) {
  throw new Error('MPESA_ENVIRONMENT must be either "sandbox" or "production".');
}
if (!['sandbox', 'production'].includes(africaTalkingEnvironment)) {
  throw new Error('AFRICASTALKING_ENVIRONMENT must be either "sandbox" or "production".');
}

const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 4000,
  appUrl,
  databaseUrl,
  pgSsl: bool(process.env.PGSSL, isProduction),
  sessionSecret,
  totpEncryptionKey,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || ''
  },
  africaTalking: {
    username: process.env.AFRICASTALKING_USERNAME || '',
    apiKey: process.env.AFRICASTALKING_API_KEY || '',
    environment: africaTalkingEnvironment
  },
  cookieSecure: bool(process.env.COOKIE_SECURE, isProduction),
  trustProxy: bool(process.env.TRUST_PROXY, isProduction),
  paymentProvider,
  mpesa: {
    environment: mpesaEnvironment,
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    shortcode: process.env.MPESA_SHORTCODE || '',
    passkey: process.env.MPESA_PASSKEY || '',
    transactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    callbackUrl: process.env.MPESA_CALLBACK_URL || ''
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'stokana/products',
    enabled: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  },
  frontendDir: path.join(__dirname, '../../../frontend'),
  uploadDir: path.join(__dirname, '../../uploads'),
  session: {
    name: 'stokana.sid',
    maxAgeMs: 1000 * 60 * 60 * 24 * 7
  }
};

env.allowedOrigins = [new URL(appUrl).origin];
if (!isProduction) {
  env.allowedOrigins.push('http://localhost:4000', 'http://127.0.0.1:4000');
}
env.allowedOrigins = [...new Set(env.allowedOrigins)];

module.exports = env;
