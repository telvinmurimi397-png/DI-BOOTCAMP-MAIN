const db = require('../config/db');
const env = require('../config/env');
const mpesa = require('./mpesaService');
const { ApiError, badRequest, conflict, notFound } = require('../utils/errors');

async function completeOrderPayment(client, orderId) {
  await client.query(
    `UPDATE orders
     SET status = 'processing', payment_status = 'paid', paid_at = now()
     WHERE id = $1 AND payment_status <> 'paid'`,
    [orderId]
  );
  await client.query(
    `INSERT INTO commissions
       (order_id, order_item_id, seller_id, rate, gross_amount, commission_amount, seller_earnings)
     SELECT oi.order_id, oi.id, oi.seller_id, oi.commission_rate, oi.line_total,
            oi.commission_amount, oi.seller_earnings
     FROM order_items oi
     WHERE oi.order_id = $1
     ON CONFLICT (order_item_id) DO NOTHING`,
    [orderId]
  );
  await client.query(
    `INSERT INTO shipments (order_id, seller_id, status)
     SELECT $1, seller_id, 'pending'
     FROM order_items
     WHERE order_id = $1
     GROUP BY seller_id
     ON CONFLICT (order_id, seller_id) DO NOTHING`,
    [orderId]
  );
}

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

    await completeOrderPayment(client, order.id);

    return {
      alreadyProcessed: false,
      message: 'Payment verified. The sellers have been notified to fulfil your order.',
      order: { orderNumber: order.orderNumber, status: 'processing', paymentStatus: 'paid' },
      payment: { providerRef: payment.providerRef, amount: payment.amount, status: 'success' }
    };
  });
}

async function startMpesaPayment(buyerId, orderNumber, phone) {
  if (env.paymentProvider !== 'mpesa') {
    throw conflict('M-PESA payments are not enabled.');
  }
  try {
    mpesa.assertConfigured();
  } catch (error) {
    throw new ApiError(503, error.message);
  }
  let normalizedPhone;
  try {
    normalizedPhone = mpesa.normalizePhone(phone);
  } catch (error) {
    throw badRequest(error.message);
  }

  const initiation = await db.withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus", total
       FROM orders WHERE order_number = $1 AND buyer_id = $2 FOR UPDATE`,
      [orderNumber, buyerId]
    );
    const order = orderResult.rows[0];
    if (!order) throw notFound('Order not found.');
    if (order.paymentStatus === 'paid') {
      return { alreadyPaid: true, orderNumber: order.orderNumber };
    }
    if (order.status === 'cancelled') throw conflict('This order was cancelled.');

    const paymentResult = await client.query(
      `SELECT id, amount, raw_payload AS "rawPayload"
       FROM payments
       WHERE order_id = $1 AND provider = 'mpesa' AND status = 'pending'
       ORDER BY created_at DESC, id DESC
       LIMIT 1 FOR UPDATE`,
      [order.id]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      throw conflict('There is no pending M-PESA payment for this order. Retry the payment first.');
    }

    const rawPayload = payment.rawPayload || {};
    if (rawPayload.checkoutRequestId) {
      return {
        alreadyInitiated: true,
        orderNumber: order.orderNumber,
        customerMessage: rawPayload.customerMessage
      };
    }
    if (rawPayload.initiationStatus === 'requesting') {
      return { alreadyRequesting: true, orderNumber: order.orderNumber };
    }
    if (!rawPayload.callbackToken) {
      throw conflict('The M-PESA callback token is missing. Retry the payment to create a fresh request.');
    }

    await client.query(
      `UPDATE payments
       SET raw_payload = $2
       WHERE id = $1 AND status = 'pending'`,
      [payment.id, { ...rawPayload, initiationStatus: 'requesting', initiationStartedAt: new Date().toISOString() }]
    );
    return {
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      amount: Number(payment.amount),
      callbackToken: rawPayload.callbackToken
    };
  });

  if (initiation.alreadyPaid) {
    return { status: 'paid', orderNumber: initiation.orderNumber };
  }
  if (initiation.alreadyInitiated || initiation.alreadyRequesting) {
    return {
      status: 'pending',
      orderNumber: initiation.orderNumber,
      message: initiation.customerMessage || 'M-PESA request is being processed. Check your phone.'
    };
  }

  let result;
  try {
    result = await mpesa.initiateStkPush({
      phone: normalizedPhone,
      amount: Math.round(initiation.amount),
      orderNumber: initiation.orderNumber,
      callbackToken: initiation.callbackToken
    });
  } catch (error) {
    await db.query(
      `UPDATE payments
       SET raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $2::jsonb
       WHERE id = $1 AND status = 'pending'`,
      [
        initiation.paymentId,
        JSON.stringify({ initiationStatus: 'failed', initiationError: error.message })
      ]
    );
    throw new ApiError(502, error.message);
  }

  await db.query(
    `UPDATE payments
     SET phone = $2, raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $3::jsonb
     WHERE id = $1 AND status = 'pending'`,
    [
      initiation.paymentId,
      normalizedPhone,
      JSON.stringify({
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        customerMessage: result.customerMessage,
        initiationStatus: 'initiated'
      })
    ]
  );
  return {
    status: 'pending',
    orderNumber: initiation.orderNumber,
    message: result.customerMessage
  };
}

function metadataValue(metadata, name) {
  return metadata?.Item?.find((item) => item.Name === name)?.Value;
}

async function handleMpesaCallback(callbackToken, body) {
  if (env.paymentProvider !== 'mpesa') {
    throw conflict('M-PESA payments are not enabled.');
  }
  if (!/^[a-f0-9]{64}$/i.test(String(callbackToken || ''))) {
    throw badRequest('Invalid M-PESA callback token.');
  }
  const callback = body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID || callback.ResultCode === undefined) {
    throw badRequest('Invalid M-PESA callback payload.');
  }

  const lookup = await db.query(
    `SELECT p.id, p.order_id AS "orderId", p.amount, p.status,
            p.raw_payload AS "rawPayload", o.order_number AS "orderNumber",
            o.total, o.status AS "orderStatus", o.payment_status AS "paymentStatus"
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.provider = 'mpesa' AND p.raw_payload->>'callbackToken' = $1`,
    [callbackToken]
  );
  const payment = lookup.rows[0];
  if (!payment) throw notFound('M-PESA payment request not found.');

  if (payment.status === 'success') {
    return { accepted: true, alreadyProcessed: true };
  }
  const expectedCheckoutId = payment.rawPayload?.checkoutRequestId;
  const expectedMerchantId = payment.rawPayload?.merchantRequestId;
  if (!expectedCheckoutId || expectedCheckoutId !== callback.CheckoutRequestID ||
      (expectedMerchantId && expectedMerchantId !== callback.MerchantRequestID)) {
    throw badRequest('M-PESA callback does not match the payment request.');
  }

  if (Number(callback.ResultCode) !== 0) {
    await db.withTransaction(async (client) => {
      const locked = await client.query(
        'SELECT id, status FROM payments WHERE id = $1 FOR UPDATE',
        [payment.id]
      );
      if (locked.rows[0]?.status !== 'pending') return;
      await client.query(
        `UPDATE payments
         SET status = 'failed', failure_reason = $2, raw_payload = raw_payload || $3::jsonb
         WHERE id = $1`,
        [
          payment.id,
          String(callback.ResultDesc || 'M-PESA payment was not completed.').slice(0, 500),
          JSON.stringify({ callback })
        ]
      );
      await client.query(
        `UPDATE orders SET payment_status = 'failed'
         WHERE id = $1 AND payment_status <> 'paid'`,
        [payment.orderId]
      );
    });
    return { accepted: true };
  }

  const result = await mpesa.queryStkPush(expectedCheckoutId);
  if (String(result.ResultCode) !== '0' ||
      (result.CheckoutRequestID && result.CheckoutRequestID !== expectedCheckoutId)) {
    throw conflict('Safaricom has not confirmed the M-PESA payment yet.');
  }
  const amount = Number(metadataValue(callback.CallbackMetadata, 'Amount'));
  const receipt = metadataValue(callback.CallbackMetadata, 'MpesaReceiptNumber');
  if (!Number.isFinite(amount) || amount !== Number(payment.amount) ||
      amount !== Number(payment.total) || !receipt) {
    throw conflict('The M-PESA payment details did not match the order total.');
  }

  await db.withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus"
       FROM orders WHERE id = $1 FOR UPDATE`,
      [payment.orderId]
    );
    const order = orderResult.rows[0];
    if (!order || order.status === 'cancelled') {
      throw conflict('The order was cancelled before payment confirmation.');
    }
    const paymentResult = await client.query(
      `SELECT id, status FROM payments WHERE id = $1 FOR UPDATE`,
      [payment.id]
    );
    if (paymentResult.rows[0]?.status === 'success' || order.paymentStatus === 'paid') return;
    if (paymentResult.rows[0]?.status !== 'pending') {
      throw conflict('This M-PESA payment is no longer pending.');
    }
    await client.query(
      `UPDATE payments
       SET status = 'success', verified_at = now(), raw_payload = raw_payload || $2::jsonb
       WHERE id = $1`,
      [
        payment.id,
        JSON.stringify({
          callback,
          verification: { resultCode: result.ResultCode, resultDescription: result.ResultDesc }
        })
      ]
    );
    await completeOrderPayment(client, order.id);
  });
  return { accepted: true };
}

module.exports = { simulatePayment, startMpesaPayment, handleMpesaCallback };
