const db = require('../config/db');

const DEFAULTS = {
  platform_commission_rate: 0.1,
  shipping_fee: 250,
  free_shipping_threshold: 5000
};

async function getSettings(client = db.pool) {
  const { rows } = await client.query(
    `SELECT key, value FROM settings
     WHERE key IN ('platform_commission_rate', 'shipping_fee', 'free_shipping_threshold')`
  );
  const values = { ...DEFAULTS };
  for (const row of rows) values[row.key] = Number(row.value);

  return {
    commissionRate: Math.min(Math.max(values.platform_commission_rate, 0), 0.5),
    shippingFee: Math.max(values.shipping_fee, 0),
    freeShippingThreshold: Math.max(values.free_shipping_threshold, 0)
  };
}

async function setSetting(key, value, client = db.pool) {
  await client.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, String(value)]
  );
}

module.exports = { getSettings, setSetting };
