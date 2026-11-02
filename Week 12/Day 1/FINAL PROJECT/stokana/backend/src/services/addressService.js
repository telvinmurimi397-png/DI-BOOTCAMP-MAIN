const db = require('../config/db');
const { notFound } = require('../utils/errors');

async function list(userId) {
  const { rows } = await db.query(
    `SELECT id, label, full_name AS "fullName", phone, county, town,
            address_line AS "addressLine", is_default AS "isDefault"
     FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, id`,
    [userId]
  );
  return rows;
}

async function save(userId, address, addressId = null) {
  return db.withTransaction(async (client) => {
    let isDefault = Boolean(address.isDefault);
    if (addressId) {
      const current = await client.query(
        'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
        [addressId, userId]
      );
      if (!current.rowCount) throw notFound('Delivery address not found.');
    }
    if (!addressId) {
      const currentDefault = await client.query(
        'SELECT 1 FROM user_addresses WHERE user_id = $1 AND is_default LIMIT 1',
        [userId]
      );
      if (!currentDefault.rowCount) isDefault = true;
    }
    if (isDefault) {
      await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }
    const values = [
      userId, address.label, address.fullName, address.phone,
      address.county, address.town, address.addressLine, isDefault
    ];
    const query = addressId
      ? `UPDATE user_addresses SET label=$2, full_name=$3, phone=$4, county=$5,
           town=$6, address_line=$7, is_default=$8
         WHERE id=$9 AND user_id=$1 RETURNING id`
      : `INSERT INTO user_addresses
           (user_id,label,full_name,phone,county,town,address_line,is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`;
    const result = await client.query(query, addressId ? [...values, addressId] : values);
    return result.rows[0].id;
  });
}

async function remove(userId, addressId) {
  const { rowCount } = await db.query(
    'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  if (!rowCount) throw notFound('Delivery address not found.');
}

module.exports = { list, save, remove };
