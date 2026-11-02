const db = require('../config/db');

async function list(req, res) {
  const { rows } = await db.query(
    `SELECT id, title, message, read_at AS "readAt", created_at AS "createdAt"
     FROM user_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 30`,
    [req.user.id]
  );
  res.json({ notifications: rows });
}

async function markRead(req, res) {
  const result = await db.query(
    `UPDATE user_notifications SET read_at = COALESCE(read_at, now())
     WHERE id = $1 AND user_id = $2
     RETURNING id, read_at AS "readAt"`,
    [req.params.notificationId, req.user.id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ notification: result.rows[0] });
}

async function markAllRead(req, res) {
  const result = await db.query(
    `UPDATE user_notifications SET read_at = now()
     WHERE user_id = $1 AND read_at IS NULL`,
    [req.user.id]
  );
  res.json({ updated: result.rowCount });
}

module.exports = { list, markRead, markAllRead };
