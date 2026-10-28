const env = require('../config/env');

const API_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

let cachedToken = null;
let tokenExpiresAt = 0;
let tokenRequest = null;

function assertConfigured() {
  const missing = [];
  if (!env.mpesa.consumerKey) missing.push('MPESA_CONSUMER_KEY');
  if (!env.mpesa.consumerSecret) missing.push('MPESA_CONSUMER_SECRET');
  if (!env.mpesa.shortcode) missing.push('MPESA_SHORTCODE');
  if (!env.mpesa.passkey) missing.push('MPESA_PASSKEY');
  if (!env.mpesa.callbackUrl) missing.push('MPESA_CALLBACK_URL');
  if (missing.length) {
    throw new Error(`M-PESA is not configured. Set: ${missing.join(', ')}.`);
  }

  let callback;
  try {
    callback = new URL(env.mpesa.callbackUrl);
  } catch {
    throw new Error('MPESA_CALLBACK_URL must be an absolute HTTPS URL.');
  }
  if (callback.protocol !== 'https:') {
    throw new Error('MPESA_CALLBACK_URL must use HTTPS and be publicly reachable by Safaricom.');
  }
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  throw new Error('Enter a valid Kenyan M-PESA number, such as 0712345678.');
}

function timestamp(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

function password(stamp) {
  return Buffer.from(`${env.mpesa.shortcode}${env.mpesa.passkey}${stamp}`).toString('base64');
}

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Safaricom returned an unreadable M-PESA response.');
  }
  if (!response.ok) {
    const reason = data.errorMessage || data.error_description || `HTTP ${response.status}`;
    throw new Error(`Safaricom M-PESA request failed: ${reason}`);
  }
  return data;
}

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (tokenRequest) return tokenRequest;

  const baseUrl = API_URLS[env.mpesa.environment];
  const credentials = Buffer.from(
    `${env.mpesa.consumerKey}:${env.mpesa.consumerSecret}`
  ).toString('base64');
  tokenRequest = requestJson(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { authorization: `Basic ${credentials}`, accept: 'application/json' } }
  ).then((data) => {
    if (!data.access_token) throw new Error('Safaricom did not return an M-PESA access token.');
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + Math.max(0, Number(data.expires_in || 0) - 60) * 1000;
    return cachedToken;
  }).finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
}

async function postMpesa(path, body) {
  const token = await getAccessToken();
  return requestJson(`${API_URLS[env.mpesa.environment]}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(body)
  });
}

async function initiateStkPush({ phone, amount, orderNumber, callbackToken }) {
  assertConfigured();
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('The M-PESA amount must be a positive whole number of Kenyan shillings.');
  }

  const stamp = timestamp();
  const callback = new URL(env.mpesa.callbackUrl);
  callback.searchParams.set('token', callbackToken);
  const response = await postMpesa('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: env.mpesa.shortcode,
    Password: password(stamp),
    Timestamp: stamp,
    TransactionType: env.mpesa.transactionType,
    Amount: amount,
    PartyA: normalizePhone(phone),
    PartyB: env.mpesa.shortcode,
    PhoneNumber: normalizePhone(phone),
    CallBackURL: callback.toString(),
    AccountReference: orderNumber,
    TransactionDesc: `STOKANA ${orderNumber}`
  });

  if (String(response.ResponseCode) !== '0' || !response.CheckoutRequestID || !response.MerchantRequestID) {
    throw new Error(response.ResponseDescription || response.errorMessage || 'Safaricom did not accept the M-PESA payment request.');
  }
  return {
    checkoutRequestId: response.CheckoutRequestID,
    merchantRequestId: response.MerchantRequestID,
    customerMessage: response.CustomerMessage || 'Check your phone and enter your M-PESA PIN.'
  };
}

async function queryStkPush(checkoutRequestId) {
  assertConfigured();
  const stamp = timestamp();
  const response = await postMpesa('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: env.mpesa.shortcode,
    Password: password(stamp),
    Timestamp: stamp,
    CheckoutRequestID: checkoutRequestId
  });
  if (String(response.ResponseCode) !== '0') {
    throw new Error(response.errorMessage || response.ResponseDescription || 'Safaricom could not verify the M-PESA transaction.');
  }
  return response;
}

module.exports = {
  assertConfigured,
  normalizePhone,
  timestamp,
  password,
  initiateStkPush,
  queryStkPush
};
