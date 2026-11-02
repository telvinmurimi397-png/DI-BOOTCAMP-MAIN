const db = require('../config/db');
const { sendEmail } = require('./verificationDelivery');

async function notifyOrder(orderNumber, { subject, message, audience = 'all' }) {
  let rows;
  try {
    const result = await db.query(
      `SELECT DISTINCT u.email, u.role
       FROM orders o
       JOIN users u ON u.id = o.buyer_id OR u.id IN (
         SELECT oi.seller_id FROM order_items oi WHERE oi.order_id = o.id
       )
       WHERE o.order_number = $1
         AND (($2 = 'all') OR ($2 = 'buyer' AND u.id = o.buyer_id)
              OR ($2 = 'sellers' AND u.id <> o.buyer_id))`,
      [orderNumber, audience]
    );
    rows = result.rows;
  } catch (error) {
    console.error('Could not load recipients for an order notification.', { orderNumber, error });
    return;
  }
  const deliveries = await Promise.allSettled(
    rows.map((recipient) =>
      sendEmail(
        recipient.email,
        subject,
        `${message}\n\nOrder ${orderNumber}\n\nSign in to STOKANA to view the latest order details.`
      )
    )
  );
  deliveries.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('Order notification delivery failed.', {
        orderNumber,
        recipient: rows[index].email,
        error: result.reason
      });
    }
  });
}

module.exports = { notifyOrder };
