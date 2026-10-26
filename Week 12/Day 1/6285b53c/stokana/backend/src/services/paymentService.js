const db = require('../config/db');
const { conflict, notFound } = require('../utils/errors');

async function simulatePayment(buyerId, orderNumber, outcome) {
  return db.withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus",
              total, paid_at AS "paidAt"
       FROM orders
       WHERE order_number = $1 AND buyer_id = $2
       FOR UPDATE`,
      [orderNumber, buyerId]
    );
    const order = orderResult.rows[0];
    if (!order) throw notFound('Order not found.');

    if (order.paymentStatus === 'paid') {
      return {
        alreadyProcessed: true,
        message: 'This payment was already verified. No new charges or commissions were created.',
        order: { orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus }
      };
    }
    if (order.status === 'cancelled') throw conflict('This order was cancelled.');

    const paymentResult = await client.query(
      `SELECT id, provider_ref AS "providerRef", amount, status
       FROM payments
       WHERE order_id = $1 AND status = 'pending'
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [order.id]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      throw conflict('There is no pending payment for this order. Start a new payment attempt.', {
        code: 'NO_PENDING_PAYMENT'
      });
    }

    if (outcome === 'failed') {
      await client.query(
        `UPDATE payments
         SET status = 'failed', failure_reason = 'Simulated payment failure', raw_payload = $2
         WHERE id = $1`,
        [payment.id, { source: 'simulated', outcome: 'failed' }]
      );
      await client.query(
        "UPDATE orders SET payment_status = 'failed' WHERE id = $1",
        [order.id]
      );
      return {
        alreadyProcessed: false,
        message: 'Payment failed. Your order is still reserved; try payment again.',
        order: { orderNumber: order.orderNumber, status: order.status, paymentStatus: 'failed' }
      };
    }

    if (Number(payment.amount) !== Number(order.total)) {
      throw conflict('The payment amount does not match the order total. Payment was not accepted.');
    }

    await client.query(
      `UPDATE payments
       SET status = 'success', verified_at = now(), raw_payload = $2
       WHERE id = $1`,
      [
        payment.id,
        {
          source: 'simulated',
          verifiedServerSide: true,
          amount: payment.amount,
          providerRef: payment.providerRef
        }
      ]
    );

    await client.query(
      `UPDATE orders
       SET status = 'processing', payment_status = 'paid', paid_at = now()
       WHERE id = $1 AND payment_status <> 'paid'`,
      [order.id]
    );

    await client.query(
      `INSERT INTO commissions
         (order_id, order_item_id, seller_id, rate, gross_amount, commission_amount, seller_earnings)
       SELECT oi.order_id, oi.id, oi.seller_id, oi.commission_rate, oi.line_total,
              oi.commission_amount, oi.seller_earnings
       FROM order_items oi
       WHERE oi.order_id = $1
       ON CONFLICT (order_item_id) DO NOTHING`,
      [order.id]
    );

    await client.query(
      `INSERT INTO shipments (order_id, seller_id, status)
       SELECT $1, seller_id, 'pending'
       FROM order_items
       WHERE order_id = $1
       GROUP BY seller_id
       ON CONFLICT (order_id, seller_id) DO NOTHING`,
      [order.id]
    );

    return {
      alreadyProcessed: false,
      message: 'Payment verified. The sellers have been notified to fulfil your order.',
      order: { orderNumber: order.orderNumber, status: 'processing', paymentStatus: 'paid' },
      payment: { providerRef: payment.providerRef, amount: payment.amount, status: 'success' }
    };
  });
}

module.exports = { simulatePayment };
