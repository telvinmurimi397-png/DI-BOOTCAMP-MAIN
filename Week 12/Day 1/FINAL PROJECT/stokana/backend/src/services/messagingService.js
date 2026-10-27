const db = require('../config/db');
const { forbidden, notFound } = require('../utils/errors');

const CONVERSATION_SELECT = `
  SELECT
    c.id,
    c.buyer_id AS "buyerId",
    c.seller_id AS "sellerId",
    c.last_message_at AS "lastMessageAt",
    c.created_at AS "createdAt",
    CASE WHEN c.buyer_id = $1 THEN sp.shop_name ELSE bu.full_name END AS title,
    CASE WHEN c.buyer_id = $1 THEN se.full_name ELSE 'Buyer' END AS subtitle,
    CASE WHEN c.buyer_id = $1 THEN sp.shop_slug ELSE NULL END AS "shopSlug",
    CASE WHEN c.buyer_id = $1 THEN sp.logo_url ELSE NULL END AS "avatarUrl",
    lm.body AS "lastMessage",
    lm.sender_id AS "lastMessageSenderId",
    lm.created_at AS "lastMessageCreatedAt",
    (
      SELECT COUNT(*)::int FROM messages m
      WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read_at IS NULL
    ) AS "unreadCount"
  FROM conversations c
  JOIN users bu ON bu.id = c.buyer_id
  JOIN users se ON se.id = c.seller_id
  LEFT JOIN seller_profiles sp ON sp.user_id = c.seller_id
  LEFT JOIN LATERAL (
    SELECT m.body, m.sender_id, m.created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON TRUE
`;

async function listConversations(userId) {
  const { rows } = await db.query(
    `${CONVERSATION_SELECT}
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC, c.id DESC`,
    [userId]
  );
  return rows;
}

async function getConversation(userId, conversationId) {
  const { rows } = await db.query(
    `${CONVERSATION_SELECT}
     WHERE c.id = $2 AND (c.buyer_id = $1 OR c.seller_id = $1)`,
    [userId, conversationId]
  );
  const conversation = rows[0];
  if (!conversation) throw notFound('Conversation not found.');
  return conversation;
}

async function startConversation(buyerId, sellerId) {
  if (buyerId === sellerId) throw forbidden('You cannot start a conversation with yourself.');

  const sellerResult = await db.query(
    `SELECT u.id FROM users u
     JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1 AND u.is_active = TRUE AND sp.status = 'approved'`,
    [sellerId]
  );
  if (!sellerResult.rowCount) throw notFound('That shop is not available for messaging.');

  const { rows } = await db.query(
    `INSERT INTO conversations (buyer_id, seller_id)
     VALUES ($1, $2)
     ON CONFLICT (buyer_id, seller_id) DO UPDATE SET buyer_id = EXCLUDED.buyer_id
     RETURNING id`,
    [buyerId, sellerId]
  );

  return getConversation(buyerId, rows[0].id);
}

async function getMessages(userId, conversationId) {
  const conversation = await getConversation(userId, conversationId);

  await db.query(
    `UPDATE messages SET read_at = now()
     WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
    [conversationId, userId]
  );

  const { rows } = await db.query(
    `SELECT * FROM (
       SELECT m.id, m.conversation_id AS "conversationId", m.sender_id AS "senderId",
              m.body, m.read_at AS "readAt", m.created_at AS "createdAt"
       FROM messages m
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 200
     ) recent
     ORDER BY recent."createdAt" ASC, recent.id ASC`,
    [conversationId]
  );

  return { conversation: { ...conversation, unreadCount: 0 }, messages: rows };
}

async function sendMessage(userId, conversationId, body) {
  const conversationResult = await db.query(
    `SELECT id, buyer_id AS "buyerId", seller_id AS "sellerId"
     FROM conversations
     WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
    [conversationId, userId]
  );
  const conversation = conversationResult.rows[0];
  if (!conversation) throw notFound('Conversation not found.');

  const { rows } = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId",
               body, read_at AS "readAt", created_at AS "createdAt"`,
    [conversationId, userId, body]
  );

  await db.query('UPDATE conversations SET last_message_at = now() WHERE id = $1', [conversationId]);
  return { message: rows[0], conversation };
}

async function getUnreadCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1)
       AND m.sender_id <> $1 AND m.read_at IS NULL`,
    [userId]
  );
  return rows[0].count;
}

async function isParticipant(userId, conversationId) {
  const { rows } = await db.query(
    `SELECT id FROM conversations
     WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
    [conversationId, userId]
  );
  return Boolean(rows[0]);
}

module.exports = {
  listConversations,
  getConversation,
  startConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
  isParticipant
};
