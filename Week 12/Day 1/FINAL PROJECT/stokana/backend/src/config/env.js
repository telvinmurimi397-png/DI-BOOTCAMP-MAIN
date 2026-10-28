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
const databaseUrl = process.env.DATABASE_URL || '';
const paymentProvider = process.env.PAYMENT_PROVIDER || 'simulated';

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

const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
if (!['simulated', 'mpesa'].includes(paymentProvider)) {
  throw new Error('PAYMENT_PROVIDER must be either "simulated" or "mpesa".');
}

const mpesaEnvironment = process.env.MPESA_ENVIRONMENT || 'sandbox';
if (!['sandbox', 'production'].includes(mpesaEnvironment)) {
  throw new Error('MPESA_ENVIRONMENT must be either "sandbox" or "production".');
}

const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 4000,
  appUrl,
  databaseUrl,
  pgSsl: bool(process.env.PGSSL, isProduction),
  sessionSecret,
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
