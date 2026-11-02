const db = require('../config/db');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');

const CONVERSATION_SELECT = `
  SELECT
    c.id,
    c.buyer_id AS "buyerId",
    c.seller_id AS "sellerId",
    CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END AS "otherUserId",
    c.product_id AS "productId",
    c.order_id AS "orderId",
    p.name AS "productName",
    o.order_number AS "orderNumber",
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
    ) AS "unreadCount",
    EXISTS (
      SELECT 1 FROM conversation_blocks b
      WHERE b.blocker_id = $1
        AND b.blocked_id = CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END
    ) AS "blockedByMe",
    EXISTS (
      SELECT 1 FROM conversation_blocks b
      WHERE b.blocker_id = CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END
        AND b.blocked_id = $1
    ) AS "blockedByOther"
  FROM conversations c
  JOIN users bu ON bu.id = c.buyer_id
  JOIN users se ON se.id = c.seller_id
  LEFT JOIN seller_profiles sp ON sp.user_id = c.seller_id
  LEFT JOIN products p ON p.id = c.product_id
  LEFT JOIN orders o ON o.id = c.order_id
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

async function startConversation(buyerId, { sellerId, productId, orderNumber }) {
  if (buyerId === sellerId) throw forbidden('You cannot start a conversation with yourself.');

  let orderId = null;
  let conversationProductId = productId || null;
  if (orderNumber) {
    const orderResult = await db.query(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id AND oi.seller_id = $3
       WHERE o.order_number = $1 AND o.buyer_id = $2
       LIMIT 1`,
      [orderNumber, buyerId, sellerId]
    );
    if (!orderResult.rowCount) throw notFound('That order or seller conversation was not found.');
    orderId = orderResult.rows[0].id;
    conversationProductId = null;
  } else {
    const sellerResult = await db.query(
      `SELECT u.id FROM users u
       JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.is_active = TRUE AND sp.status = 'approved'`,
      [sellerId]
    );
    if (!sellerResult.rowCount) throw notFound('That shop is not available for messaging.');
    if (conversationProductId) {
      const productResult = await db.query(
        `SELECT id FROM products
         WHERE id = $1 AND seller_id = $2 AND status = 'approved'`,
        [conversationProductId, sellerId]
      );
      if (!productResult.rowCount) throw notFound('That product is not available for messaging.');
    }
  }

  const blocked = await db.query(
    `SELECT 1 FROM conversation_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [buyerId, sellerId]
  );
  if (blocked.rowCount) throw forbidden('Messaging is unavailable for this conversation.');

  const inserted = await db.query(
    `INSERT INTO conversations (buyer_id, seller_id, product_id, order_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [buyerId, sellerId, conversationProductId, orderId]
  );
  const conversation = inserted.rows[0] || (await db.query(
    `SELECT id FROM conversations
     WHERE buyer_id = $1 AND seller_id = $2
       AND product_id IS NOT DISTINCT FROM $3
       AND order_id IS NOT DISTINCT FROM $4`,
    [buyerId, sellerId, conversationProductId, orderId]
  )).rows[0];
  if (!conversation) throw conflict('Could not open this conversation. Please try again.');
  return getConversation(buyerId, conversation.id);
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
              m.body, m.attachment_url AS "attachmentUrl",
              m.attachment_mime AS "attachmentMime",
              m.read_at AS "readAt", m.created_at AS "createdAt"
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

async function assertCanMessage(userId, conversationId, client = db) {
  const conversationResult = await client.query(
    `SELECT id, buyer_id AS "buyerId", seller_id AS "sellerId"
     FROM conversations
     WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
     FOR SHARE`,
    [conversationId, userId]
  );
  const conversation = conversationResult.rows[0];
  if (!conversation) throw notFound('Conversation not found.');

  const otherUserId = Number(conversation.buyerId) === Number(userId)
    ? conversation.sellerId
    : conversation.buyerId;
  const block = await client.query(
    `SELECT 1 FROM conversation_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [userId, otherUserId]
  );
  if (block.rowCount) throw forbidden('You cannot send messages in this conversation because one participant blocked the other.');
  return conversation;
}

async function sendMessage(userId, conversationId, { body = '', attachmentUrl = null, attachmentMime = null }) {
  const messageBody = body.trim();
  if (!messageBody && !attachmentUrl) throw badRequest('Write a message or attach an image.');
  if (messageBody.length > 4000) throw badRequest('Messages must be 4000 characters or fewer.');

  return db.withTransaction(async (client) => {
    const conversation = await assertCanMessage(userId, conversationId, client);
    const { rows } = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, body, attachment_url, attachment_mime)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId",
                 body, attachment_url AS "attachmentUrl",
                 attachment_mime AS "attachmentMime",
                 read_at AS "readAt", created_at AS "createdAt"`,
      [conversationId, userId, messageBody || 'Image attachment', attachmentUrl, attachmentMime]
    );
    await client.query('UPDATE conversations SET last_message_at = now() WHERE id = $1', [conversationId]);
    return { message: rows[0], conversation };
  });
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

async function setBlock(userId, conversationId, blocked) {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, buyer_id AS "buyerId", seller_id AS "sellerId"
       FROM conversations
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
       FOR UPDATE`,
      [conversationId, userId]
    );
    const conversation = result.rows[0];
    if (!conversation) throw notFound('Conversation not found.');
    const otherUserId = Number(conversation.buyerId) === Number(userId)
      ? conversation.sellerId
      : conversation.buyerId;
    if (blocked) {
      await client.query(
        `INSERT INTO conversation_blocks (blocker_id, blocked_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, otherUserId]
      );
    } else {
      await client.query(
        'DELETE FROM conversation_blocks WHERE blocker_id = $1 AND blocked_id = $2',
        [userId, otherUserId]
      );
    }
    return { conversationId, blocked, otherUserId };
  });
}

async function reportConversation(userId, conversationId, reason) {
  await getConversation(userId, conversationId);
  const { rows } = await db.query(
    `INSERT INTO conversation_reports (conversation_id, reporter_id, reason)
     VALUES ($1, $2, $3)
     RETURNING id, conversation_id AS "conversationId", reason, status,
               created_at AS "createdAt"`,
    [conversationId, userId, reason]
  );
  return rows[0];
}

async function listReports({ status = 'pending', page = 1, limit = 20 } = {}) {
  const params = [];
  const where = [];
  if (status !== 'all') {
    params.push(status);
    where.push(`r.status = $${params.length}`);
  }
  const offset = (page - 1) * limit;
  const [count, reports] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total FROM conversation_reports r
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      params
    ),
    db.query(
      `SELECT r.id, r.reason, r.status, r.created_at AS "createdAt",
              reporter.full_name AS "reporterName", reporter.email AS "reporterEmail",
              c.id AS "conversationId", buyer.full_name AS "buyerName",
              seller.full_name AS "sellerName", sp.shop_name AS "shopName",
              p.name AS "productName", o.order_number AS "orderNumber",
              transcript.messages AS "recentMessages"
       FROM conversation_reports r
       JOIN conversations c ON c.id = r.conversation_id
       JOIN users reporter ON reporter.id = r.reporter_id
       JOIN users buyer ON buyer.id = c.buyer_id
       JOIN users seller ON seller.id = c.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = c.seller_id
       LEFT JOIN products p ON p.id = c.product_id
       LEFT JOIN orders o ON o.id = c.order_id
       LEFT JOIN LATERAL (
         SELECT string_agg(recent.body, E'\\n' ORDER BY recent.created_at) AS messages
         FROM (
           SELECT m.body, m.created_at
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC, m.id DESC
           LIMIT 10
         ) recent
       ) transcript ON TRUE
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
  ]);
  return {
    reports: reports.rows,
    pagination: {
      page,
      limit,
      total: count.rows[0].total,
      totalPages: Math.max(1, Math.ceil(count.rows[0].total / limit))
    }
  };
}

async function reviewReport(adminId, reportId, status) {
  const result = await db.query(
    `UPDATE conversation_reports
     SET status = $1, reviewed_by = $2, reviewed_at = now()
     WHERE id = $3 AND status = 'pending'
     RETURNING id, status`,
    [status, adminId, reportId]
  );
  if (!result.rowCount) throw notFound('Pending conversation report not found.');
  return result.rows[0];
}

module.exports = {
  listConversations,
  getConversation,
  startConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
  isParticipant,
  assertCanMessage,
  setBlock,
  reportConversation,
  listReports,
  reviewReport
};
