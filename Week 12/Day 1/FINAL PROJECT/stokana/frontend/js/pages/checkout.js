import { mountSite, refreshCartBadge } from '../layout.js';
import { api } from '../api.js';
import { requireUser } from '../auth.js';
import { COUNTIES, showAlert, clearAlert } from '../auth-ui.js';
import { icon } from '../icons.js';
import {
  img,
  toast,
  emptyState,
  errorState,
  errorMessage,
  setButtonLoading,
  confirmDialog
} from '../ui.js';
import { money, escapeHtml, pluralize } from '../format.js';

const root = document.getElementById('checkout-root');
let user = null;
let cart = null;
let checkoutOrder = null;
let shippingPhone = '';
let paymentProvider = 'simulated';
let needsPaymentRetry = false;
let busy = false;

const CHECKOUT_FIELDS = {
  shippingName: {
    id: 'checkout-name',
    message: 'Enter the recipient name using at least 3 characters.',
    valid: (value) => value.length >= 3 && value.length <= 120
  },
  shippingPhone: {
    id: 'checkout-phone',
    message: 'Enter a valid delivery phone number.',
    valid: (value) => /^\+?[0-9 ()-]{7,20}$/.test(value)
  },
  shippingCounty: {
    id: 'checkout-county',
    message: 'Choose your county.',
    valid: (value) => value.length >= 2 && value.length <= 80
  },
  shippingTown: {
    id: 'checkout-town',
    message: 'Enter your town or estate using at least 2 characters.',
    valid: (value) => value.length >= 2 && value.length <= 80
  },
  shippingAddress: {
    id: 'checkout-address',
    message: 'Enter a delivery address with at least 8 characters and a landmark.',
    valid: (value) => value.length >= 8 && value.length <= 500
  },
  notes: {
    id: 'checkout-notes',
    message: 'Order notes must be 500 characters or fewer.',
    valid: (value) => value.length <= 500
  }
};

function showCheckoutFieldErrors(errors) {
  for (const [name, field] of Object.entries(CHECKOUT_FIELDS)) {
    const input = document.getElementById(field.id);
    const errorHost = document.getElementById(`${field.id}-error`);
    if (!input || !errorHost) continue;

    const message = errors[name] || '';
    input.classList.toggle('invalid', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    errorHost.textContent = message;
    errorHost.hidden = !message;
  }

  const firstInvalid = Object.keys(errors)
    .map((name) => document.getElementById(CHECKOUT_FIELDS[name]?.id))
    .find(Boolean);
  firstInvalid?.focus();
  firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function checkoutFieldErrors(form) {
  return Object.fromEntries(
    Object.entries(CHECKOUT_FIELDS)
      .map(([name, field]) => {
        const input = form.elements.namedItem(name);
        const value = input.value.trim();
        return [name, field.valid(value) ? '' : field.message];
      })
      .filter(([, message]) => message)
  );
}

function summaryHtml() {
  return `
    <aside class="checkout-summary">
      <h2>Order summary</h2>
      <div class="order-summary-items">
        ${cart.items
          .map(
            (item) => `<div class="order-summary-item">
              ${img(item.imageUrl, item.name)}
              <div class="grow">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${item.quantity} × ${money(item.price)} · ${escapeHtml(item.shopName)}</span>
              </div>
              <span>${money(item.lineTotal)}</span>
            </div>`
          )
          .join('')}
      </div>
      <div class="summary-line"><span>Subtotal</span><span>${money(cart.summary.subtotal)}</span></div>
      <div class="summary-line"><span>Delivery</span><span>${
        Number(cart.summary.shippingFee) === 0 ? 'Free' : money(cart.summary.shippingFee)
      }</span></div>
      <div class="divider" style="margin:5px 0"></div>
      <div class="summary-line total"><span>Total</span><span>${money(cart.summary.total)}</span></div>
      <button class="btn btn-shopping btn-lg btn-block" type="submit" form="checkout-form" id="place-order">
        Place order · ${money(cart.summary.total)}
      </button>
      <p class="form-hint" style="text-align:center">You’ll confirm payment on the next step.</p>
      <div class="delivery-note" style="border-top:1px solid var(--line);padding-top:13px">
        <div>${icon('lock', { size: 14 })} Your details are only shared with the seller</div>
        <div>${icon('shield-check', { size: 14 })} Orders are protected by STOKANA</div>
      </div>
    </aside>`;
}

function renderCheckout() {
  if (!cart || !cart.items.length) {
    root.innerHTML = emptyState({
      iconName: 'cart',
      title: 'Your cart is empty',
      text: 'Add products to your cart before checking out.',
      action: '<a class="btn btn-primary" href="/explore">Explore products</a>'
    });
    return;
  }

  if (!cart.summary.canCheckout) {
    root.innerHTML = emptyState({
      iconName: 'alert-circle',
      title: 'Your cart needs attention',
      text: 'Some items are unavailable or exceed current stock. Update your cart to continue.',
      action: '<a class="btn btn-primary" href="/cart">Review your cart</a>'
    });
    return;
  }

  root.innerHTML = `
    <div class="checkout-layout">
      <div>
        <div id="checkout-alert"></div>
        <form id="checkout-form" class="checkout-form" novalidate style="padding-top:0">
          <div class="checkout-section">
            <h2><span class="step-num">1</span> Delivery details</h2>
            <div class="form-grid">
              <div class="form-group span-2">
                <label class="form-label" for="checkout-name">Recipient full name</label>
                <input class="input" id="checkout-name" name="shippingName" type="text" value="${escapeHtml(
                  user.fullName || ''
                )}" required minlength="3" maxlength="120" autocomplete="name" aria-describedby="checkout-name-error">
                <span class="form-error" id="checkout-name-error" hidden></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkout-phone">Phone number</label>
                <input class="input" id="checkout-phone" name="shippingPhone" type="tel" value="${escapeHtml(
                  user.phone || ''
                )}" placeholder="+254 712 345 678" required autocomplete="tel" aria-describedby="checkout-phone-error">
                <span class="form-error" id="checkout-phone-error" hidden></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkout-county">County</label>
                <select class="select" id="checkout-county" name="shippingCounty" required aria-describedby="checkout-county-error">
                  <option value="">Choose county</option>
                  ${COUNTIES.map((county) => `<option value="${county}">${county}</option>`).join('')}
                </select>
                <span class="form-error" id="checkout-county-error" hidden></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkout-town">Town / estate</label>
                <input class="input" id="checkout-town" name="shippingTown" type="text" placeholder="e.g. Westlands" required minlength="2" maxlength="80" aria-describedby="checkout-town-error">
                <span class="form-error" id="checkout-town-error" hidden></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkout-address">Delivery address</label>
                <input class="input" id="checkout-address" name="shippingAddress" type="text" placeholder="Building, street and nearest landmark" required minlength="8" maxlength="500" aria-describedby="checkout-address-error">
                <span class="form-error" id="checkout-address-error" hidden></span>
              </div>
              <div class="form-group span-2">
                <label class="form-label" for="checkout-notes">Order notes <span class="optional">(optional)</span></label>
                <textarea class="textarea" id="checkout-notes" name="notes" rows="2" maxlength="500" placeholder="Delivery instructions, preferred time or anything the seller should know." aria-describedby="checkout-notes-error"></textarea>
                <span class="form-error" id="checkout-notes-error" hidden></span>
              </div>
            </div>
          </div>

          <div class="checkout-section">
            <h2><span class="step-num">2</span> Payment method</h2>
            <div class="payment-method">
              <span class="pay-logo">${icon('smartphone', { size: 22 })}</span>
              <div class="grow">
                <strong>${paymentProvider === 'mpesa' ? 'M-PESA' : 'M-PESA (sandbox)'}</strong>
                <span>${
                  paymentProvider === 'mpesa'
                    ? 'Pay securely using an M-PESA prompt sent to your phone.'
                    : 'Pay using a simulated mobile money prompt. No real money moves in this environment.'
                }</span>
              </div>
              ${icon('check-circle', { size: 19 })}
            </div>
            <div class="alert info" style="margin:14px 0 0">
              ${icon('info', { size: 16 })}
              <div>Your order is reserved while payment is pending. STOKANA confirms payment on the server before sellers are notified.</div>
            </div>
          </div>
        </form>
      </div>
      ${summaryHtml()}
    </div>`;

  document.getElementById('checkout-form').addEventListener('submit', placeOrder);
  document.getElementById('checkout-form').addEventListener('input', clearCheckoutFieldError);
  document.getElementById('checkout-form').addEventListener('change', clearCheckoutFieldError);
}

function clearCheckoutFieldError(event) {
  const name = event.target.name;
  const field = CHECKOUT_FIELDS[name];
  if (!field) return;
  const errorHost = document.getElementById(`${field.id}-error`);
  event.target.classList.remove('invalid');
  event.target.setAttribute('aria-invalid', 'false');
  if (errorHost) {
    errorHost.textContent = '';
    errorHost.hidden = true;
  }
}

async function placeOrder(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const alertHost = document.getElementById('checkout-alert');
  clearAlert(alertHost);

  const fieldErrors = checkoutFieldErrors(form);
  showCheckoutFieldErrors(fieldErrors);
  if (Object.keys(fieldErrors).length) {
    return;
  }

  const value = (name) => form.elements.namedItem(name).value.trim();
  const payload = {
    shippingName: value('shippingName'),
    shippingPhone: value('shippingPhone'),
    shippingCounty: value('shippingCounty'),
    shippingTown: value('shippingTown'),
    shippingAddress: value('shippingAddress'),
    ...(value('notes') ? { notes: value('notes') } : {})
  };

  const button = document.getElementById('place-order');
  busy = true;
  setButtonLoading(button, true, 'Placing order…');
  try {
    const data = await api.post('/orders/checkout', payload);
    checkoutOrder = data.order;
    shippingPhone = payload.shippingPhone;
    paymentProvider = data.payment?.provider || 'simulated';
    needsPaymentRetry = false;
    refreshCartBadge();
    renderPaymentStep();
  } catch (error) {
    showAlert(alertHost, errorMessage(error), 'danger', 'Could not place your order');
    if (error.details?.length) {
      showCheckoutFieldErrors(
        Object.fromEntries(error.details.map(({ field, message }) => [field, message]))
      );
    }
    setButtonLoading(button, false);
    toast(errorMessage(error), 'error');
    busy = false;
    return;
  }
  busy = false;
}

function renderPaymentStep() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const isMpesa = paymentProvider === 'mpesa';
  root.innerHTML = `
    <div style="max-width:620px;margin:0 auto;padding:28px 0 60px">
      <div class="content-card" style="padding:clamp(22px,4vw,34px)">
        <div class="row-between" style="margin-bottom:18px">
          <span class="badge amber" id="payment-status">${icon('clock', { size: 13 })} Awaiting payment</span>
          <span class="muted" style="font-size:12px">Order ${escapeHtml(checkoutOrder.orderNumber)}</span>
        </div>
        <div style="text-align:center;margin-bottom:22px">
          <div class="empty-icon" style="margin:0 auto 14px;background:var(--blue-50);color:var(--blue-600)">${icon(
            'smartphone',
            { size: 27 }
          )}</div>
          <h1 style="font-size:clamp(24px,4vw,30px);margin-bottom:6px">${money(checkoutOrder.total)}</h1>
          <p class="muted" style="font-size:13px">${isMpesa ? 'M-PESA payment' : 'M-PESA sandbox payment'} for ${pluralize(
            checkoutOrder.itemCount,
            'item'
          )} from STOKANA.</p>
        </div>
        <div id="payment-alert"></div>
        <div class="payment-method" style="margin-bottom:18px">
          <span class="pay-logo">${icon('phone', { size: 21 })}</span>
          <div class="grow">
            <strong>${isMpesa ? 'M-PESA prompt to' : 'Payment request to'} ${escapeHtml(shippingPhone)}</strong>
            <span>${
              isMpesa
                ? 'We’ll send a secure payment request to your phone. Enter your M-PESA PIN to approve it.'
                : 'Confirm the simulated prompt below to complete your order. You can also test a failed payment.'
            }</span>
          </div>
        </div>
        <button class="btn btn-shopping btn-lg btn-block" type="button" id="pay-now">
          ${isMpesa ? 'Send M-PESA prompt' : `Pay ${money(checkoutOrder.total)}`}
        </button>
        <div class="row-between" style="margin-top:12px">
          ${isMpesa ? '' : '<button class="btn btn-ghost btn-sm" type="button" id="pay-failed">Simulate failed payment</button>'}
          <button class="btn btn-ghost btn-sm" type="button" id="cancel-order">Cancel order</button>
        </div>
        <div class="delivery-note" style="border-top:1px solid var(--line);margin-top:18px">
          <div>${icon('lock', { size: 14 })} ${
            isMpesa ? 'Your PIN is entered only on your phone, never on STOKANA.' : 'Sandbox mode — no real charges are made.'
          }</div>
          <div>${icon('shield-check', { size: 14 })} ${
            isMpesa
              ? 'Safaricom confirmation is required before the order is processed.'
              : 'Payment is verified by STOKANA before the order is processed.'
          }</div>
        </div>
      </div>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:14px">
        <a href="/account/orders">View all orders</a> · Your order will stay reserved until payment is completed.
      </p>
    </div>`;

  document.getElementById('pay-now').addEventListener('click', () => {
    if (isMpesa) payMpesa();
    else pay('success');
  });
  document.getElementById('pay-failed')?.addEventListener('click', () => pay('failed'));
  document.getElementById('cancel-order').addEventListener('click', cancelOrder);
}

async function payMpesa() {
  if (busy) return;
  busy = true;
  const payButton = document.getElementById('pay-now');
  const alertHost = document.getElementById('payment-alert');
  let promptRequested = false;
  clearAlert(alertHost);
  setButtonLoading(payButton, true, 'Requesting M-PESA prompt…');

  try {
    if (needsPaymentRetry) {
      await api.post(`/orders/${encodeURIComponent(checkoutOrder.orderNumber)}/payment/retry`);
      needsPaymentRetry = false;
    }

    const data = await api.post(
      `/orders/${encodeURIComponent(checkoutOrder.orderNumber)}/payment/stk-push`,
      { phone: shippingPhone }
    );
    promptRequested = true;
    const status = document.getElementById('payment-status');
    if (status) {
      status.className = 'badge amber';
      status.textContent = 'Awaiting M-PESA confirmation';
    }
    const instruction = document.querySelector('.payment-method .grow span');
    if (instruction && data.message) instruction.textContent = data.message;
    setButtonLoading(payButton, true, 'Waiting for payment…');
    await pollMpesaPayment();
  } catch (error) {
    showAlert(
      alertHost,
      errorMessage(error),
      'danger',
      promptRequested ? 'Could not check M-PESA payment status' : 'Could not start M-PESA payment'
    );
    setButtonLoading(payButton, false);
    payButton.textContent = promptRequested ? 'Check payment status' : 'Try M-PESA again';
  } finally {
    busy = false;
  }
}

async function pollMpesaPayment() {
  const alertHost = document.getElementById('payment-alert');
  const payButton = document.getElementById('pay-now');
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
    const data = await api.get(`/orders/${encodeURIComponent(checkoutOrder.orderNumber)}`);
    const order = data.order;
    if (order.paymentStatus === 'paid') {
      renderPaymentSuccess(order);
      return;
    }
    if (order.paymentStatus === 'failed') {
      needsPaymentRetry = true;
      const status = document.getElementById('payment-status');
      if (status) {
        status.className = 'badge red badge-dot';
        status.textContent = 'Payment not completed';
      }
      showAlert(
        alertHost,
        'The M-PESA payment was not completed. You can retry without placing another order.',
        'danger',
        'Payment failed'
      );
      setButtonLoading(payButton, false);
      payButton.textContent = 'Try M-PESA again';
      return;
    }
  }
  setButtonLoading(payButton, false);
  payButton.textContent = 'Check payment status';
  showAlert(
    alertHost,
    'We have not received confirmation yet. Check your phone or check the payment status again.',
    'info',
    'Still waiting'
  );
}

async function pay(outcome) {
  if (busy) return;
  busy = true;
  const payButton = document.getElementById('pay-now');
  const failedButton = document.getElementById('pay-failed');
  const alertHost = document.getElementById('payment-alert');
  clearAlert(alertHost);
  setButtonLoading(payButton, true, outcome === 'failed' ? 'Processing…' : 'Confirming payment…');
  if (failedButton) failedButton.disabled = true;

  try {
    if (needsPaymentRetry) {
      await api.post(`/orders/${encodeURIComponent(checkoutOrder.orderNumber)}/payment/retry`);
      needsPaymentRetry = false;
    }

    const data = await api.post(
      `/orders/${encodeURIComponent(checkoutOrder.orderNumber)}/payment/simulate`,
      { outcome }
    );

    if (outcome === 'failed') {
      needsPaymentRetry = true;
      const status = document.getElementById('payment-status');
      if (status) {
        status.className = 'badge red badge-dot';
        status.innerHTML = 'Failed';
      }
      showAlert(
        alertHost,
        data.message || 'The payment failed. You can try again safely — no new order will be created.',
        'danger',
        'Payment failed'
      );
      setButtonLoading(payButton, false);
      payButton.textContent = 'Try payment again';
      if (failedButton) failedButton.disabled = false;
    } else {
      renderPaymentSuccess(data.order || checkoutOrder);
    }
  } catch (error) {
    showAlert(alertHost, errorMessage(error), 'danger', 'Payment could not be completed');
    setButtonLoading(payButton, false);
    if (failedButton) failedButton.disabled = false;
  } finally {
    busy = false;
  }
}

function renderPaymentSuccess(order) {
  const orderNumber = order.orderNumber || checkoutOrder.orderNumber;
  root.innerHTML = `
    <div style="max-width:560px;margin:0 auto;padding:48px 0 70px;text-align:center">
      <div class="empty-icon" style="margin:0 auto 16px;width:64px;height:64px;background:var(--success-bg);color:var(--success)">${icon(
        'check',
        { size: 30 }
      )}</div>
      <h1 style="font-size:clamp(25px,4vw,32px);margin-bottom:8px">Payment confirmed</h1>
      <p class="muted" style="font-size:13.5px;line-height:1.65;max-width:420px;margin:0 auto 20px">
        Order <strong style="color:var(--ink)">${escapeHtml(orderNumber)}</strong> is now being processed.
        The seller has been notified to prepare your delivery.
      </p>
      <div class="row" style="justify-content:center;gap:9px;flex-wrap:wrap">
        <a class="btn btn-primary" href="/account/order?order=${encodeURIComponent(orderNumber)}">View order</a>
        <a class="btn btn-secondary" href="/explore">Continue shopping</a>
      </div>
      <p class="muted" style="font-size:11.5px;margin-top:20px">Taking you to your order…</p>
    </div>`;
  window.setTimeout(() => {
    window.location.href = `/account/order?order=${encodeURIComponent(orderNumber)}&paid=1`;
  }, 1500);
}

async function cancelOrder() {
  const confirmed = await confirmDialog({
    title: 'Cancel this order?',
    message: 'The order will be cancelled and any reserved stock will be released. You can place a new order later.',
    confirmLabel: 'Cancel order',
    danger: true
  });
  if (!confirmed) return;
  try {
    await api.post(`/orders/${encodeURIComponent(checkoutOrder.orderNumber)}/cancel`);
    toast('Order cancelled.');
    window.location.href = `/account/order?order=${encodeURIComponent(checkoutOrder.orderNumber)}`;
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function init() {
  await mountSite();
  user = await requireUser({ roles: ['buyer'] });
  if (!user) return;

  try {
    const [cartData, paymentMethod] = await Promise.all([
      api.get('/cart'),
      api.get('/payments/method')
    ]);
    cart = cartData;
    paymentProvider = paymentMethod.provider;
    renderCheckout();
  } catch (error) {
    root.innerHTML = errorState(errorMessage(error));
    root.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
