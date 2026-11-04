const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

async function sendEmail(to, subject, text, options = {}) {
  if (env.resend.apiKey) {
    if (!env.resend.from) {
      throw new Error('RESEND_FROM is required when Resend email delivery is enabled.');
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: env.resend.from, to, subject, text, ...options })
    });
    if (!response.ok) {
      throw new Error(`Resend email delivery failed (HTTP ${response.status}).`);
    }
    return;
  }

  if (!env.smtp.host) {
    if (!env.isProduction) return;
    throw new Error('Email verification is not configured.');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password }
    });
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text, ...options });
}

async function sendSms(to, message) {
  if (!env.africaTalking.username || !env.africaTalking.apiKey) {
    if (!env.isProduction) return;
    throw new Error('SMS verification is not configured.');
  }
  const endpoint = env.africaTalking.environment === 'sandbox'
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      apiKey: env.africaTalking.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username: env.africaTalking.username,
      to,
      message
    })
  });
  if (!response.ok) {
    throw new Error(`SMS verification delivery failed (HTTP ${response.status}).`);
  }
  const result = await response.json();
  const recipients = result.SMSMessageData?.Recipients || [];
  if (!recipients.length || recipients.some((recipient) => recipient.status !== 'Success')) {
    throw new Error('SMS verification delivery was rejected by the provider.');
  }
}

module.exports = { sendEmail, sendSms };
