const crypto = require('crypto');

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function uniqueSlug(value) {
  const base = slugify(value) || 'item';
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `STK-${date}-${random}`;
}

module.exports = { slugify, uniqueSlug, generateOrderNumber };
