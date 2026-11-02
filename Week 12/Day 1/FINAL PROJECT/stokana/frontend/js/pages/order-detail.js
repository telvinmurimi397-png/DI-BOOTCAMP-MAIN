import { api } from '../api.js';
import { initAccount } from '../account-ui.js';
import { icon } from '../icons.js';
import {
  img,
  stars,
  toast,
  emptyState,
  errorState,
  confirmDialog,
  openModal,
  closeModal,
  setButtonLoading,
  errorMessage
} from '../ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  formatDateTime,
  statusBadge,
  statusMeta,
  shipmentStatusLabel,
  pluralize
} from '../format.js';

const orderNumber = new URLSearchParams(window.location.search).get('order') || '';
let account = null;
let order = null;
let paymentProvider = 'mpesa';
let busy = false;

function timelineHtml(current) {
  const status = current.status;
  const paid = current.paymentStatus === 'paid';

  if (status === 'cancelled') {
    return `<div class="timeline">
      ${timelineStep(true, 'Order placed', formatDateTime(current.createdAt), true)}
      ${timelineStep(true, 'Order cancelled', current.cancelledAt ? formatDateTime(current.cancelledAt) : 'Cancelled', true)}
    </div>`;
  }

  const shipped = ['shipped', 'delivered'].includes(status);
  const processing = ['processing', 'shipped', 'delivered'].includes(status);
  const delivered = status === 'delivered';

  return `<div class="timeline">
    ${timelineStep(true, 'Order placed', formatDateTime(current.createdAt))}
    ${timelineStep(paid, 'Payment confirmed', paid && current.paidAt ? formatDateTime(current.paidAt) : 'Awaiting payment', false, !paid)}
    ${timelineStep(processing, 'Processing', processing ? 'Seller is preparing your order' : '', false, paid && !processing)}
    ${timelineStep(shipped, 'Shipped', shipped ? 'Your parcel is on the way' : '', false, processing && !shipped)}
    ${timelineStep(delivered, 'Delivered', delivered ? 'Order completed' : '', false, shipped && !delivered)}
  </div>`;
}

function timelineStep(done, title, detail, danger = false, currentStep = false) {
  return `<div class="timeline-step${done ? ' done' : ''}${currentStep ? ' current' : ''}">
    <span class="timeline-dot">${done ? icon('check', { size: 12, strokeWidth: 3 }) : danger ? icon('x', { size: 12 }) : icon('clock', { size: 12 })}</span>
    <div class="timeline-content">
      <strong>${escapeHtml(title)}</strong>
      ${detail ? `<span>${escapeHtml(detail)}</span>` : ''}
    </div>
  </div>`;
}

function itemHtml(item, renderedShipmentIds) {
  const activeReturn = item.returnRequests.find((request) =>
    ['pending', 'approved'].includes(request.status)
  );
  const completedReturn = [...item.returnRequests].reverse().find((request) =>
    request.status === 'refunded'
  );
  const previouslyRequested = item.returnRequests
    .filter((request) => request.status !== 'rejected')
    .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
  const canRequestReturn = item.canRequestReturn && previouslyRequested < Number(item.quantity);
  const shipmentId = String(item.shipmentId || '');
  const showConfirmDelivery = item.canConfirmDelivery && !renderedShipmentIds.has(shipmentId);
  if (shipmentId) renderedShipmentIds.add(shipmentId);
  return `<div class="order-line" style="align-items:flex-start">
    ${img(item.imageUrl, item.productName, 'width="58" height="58"')}
    <div class="order-line-main">
      <strong style="display:block;font-size:13px;line-height:1.35">${escapeHtml(item.productName)}</strong>
      ${item.variantAttributes ? `<span class="muted">${Object.entries(item.variantAttributes)
        .map(([name, value]) => `${escapeHtml(name)}: ${escapeHtml(value)}`).join(' · ')}</span>` : ''}
      <span>${item.quantity} × ${money(item.unitPrice)} · <a href="/shop/${encodeURIComponent(
    item.shopSlug
  )}" style="display:inline;font-size:inherit;font-weight:600">${escapeHtml(item.shopName || 'Shop')}</a></span>
      <button class="btn btn-ghost btn-sm" type="button" data-message-seller="${item.sellerId}" style="margin-top:5px">
        ${icon('message', { size: 13 })} Message this shop about the order
      </button>
      ${
        item.shipmentId
          ? `<div class="row" style="gap:8px;margin-top:7px;flex-wrap:wrap">
              <span class="badge ${statusMeta(item.shipmentStatus === 'delivered' ? 'delivered' : 'blue').tone}" style="font-size:10px">${escapeHtml(
              shipmentStatusLabel(item.shipmentStatus)
            )}</span>
              ${item.trackingNumber
                ? `<span class="muted" style="font-size:10.5px">${escapeHtml(item.carrier || 'Courier')} · ${escapeHtml(item.trackingNumber)}${item.trackingUrl ? ` · <a href="${escapeHtml(item.trackingUrl)}" target="_blank" rel="noopener noreferrer">Track shipment</a>` : ''}</span>`
                : item.trackingUrl
                  ? `<a href="${escapeHtml(item.trackingUrl)}" target="_blank" rel="noopener noreferrer" class="tiny">Track shipment</a>`
                  : ''}
              ${item.pickupLocationLabel ? `<span class="muted tiny">Pickup: ${escapeHtml(item.pickupLocationLabel)}${item.pickupLocationTown ? ` · ${escapeHtml(item.pickupLocationTown)}` : ''}</span>` : ''}
              ${showConfirmDelivery ? `<button class="btn btn-secondary btn-sm" type="button" data-confirm-delivery="${escapeHtml(shipmentId)}">Confirm delivery</button>` : ''}
            </div>`
          : ''
      }
      ${
        item.reviewId
          ? `<div class="row" style="gap:6px;margin-top:6px">${stars(item.reviewRating, { size: 11 })}<span class="muted" style="font-size:10.5px">You reviewed this item</span></div>`
          : item.canReview
          ? `<button class="btn btn-ghost btn-sm" type="button" data-review-item="${item.id}" style="margin-top:6px">${icon(
              'star',
              { size: 14 }
            )} Write a review</button>`
          : ''
      }
      ${activeReturn
        ? `<div class="row" style="gap:6px;margin-top:8px"><span class="tiny muted">Return request · ${statusBadge(activeReturn.status)}</span></div>`
        : `${completedReturn
          ? `<div class="tiny muted" style="margin-top:7px">Refund recorded: ${money(completedReturn.refundAmount)}${completedReturn.refundReference ? ` · ${escapeHtml(completedReturn.refundReference)}` : ''}</div>`
          : ''}
          ${canRequestReturn
            ? `<button class="btn btn-ghost btn-sm" type="button" data-request-return="${item.id}" style="margin-top:7px">Request return / refund</button>`
            : ''}`}
    </div>
    <div class="order-line-total">${money(item.lineTotal)}</div>
  </div>`;
}

function paymentHistoryHtml() {
  if (!order.payments?.length) return '<p class="muted" style="font-size:12.5px">No payment attempts yet.</p>';
  return `<div class="info-list">
    ${order.payments
      .map(
        (payment) => `<div class="info-row">
          <dt>
            <strong style="display:block;color:var(--ink);font-size:12px;font-family:ui-monospace,Menlo,monospace">${escapeHtml(
              payment.transactionRef || payment.providerRef
            )}</strong>
            <span style="font-size:11px">${escapeHtml(payment.provider)} · ${formatDateTime(payment.createdAt)}</span>
            ${payment.transactionRef ? `<span style="display:block;font-size:10.5px;color:var(--muted)">Request: ${escapeHtml(payment.providerRef)}</span>` : ''}
          </dt>
          <dd style="display:grid;justify-items:end;gap:4px">
            <span style="font-size:12.5px">${money(payment.amount)}</span>
            ${statusBadge(payment.status)}
            ${payment.failureReason ? `<span class="muted" style="font-weight:400;font-size:10.5px">${escapeHtml(payment.failureReason)}</span>` : ''}
          </dd>
        </div>`
      )
      .join('')}
  </div>`;
}

function render() {
  const renderedShipmentIds = new Set();
  account.content.innerHTML = `
    <div id="order-alert"></div>
    <div class="order-detail-head">
      <div>
        <h1>${escapeHtml(order.orderNumber)}</h1>
        <p class="muted" style="font-size:12px;margin-top:4px">Placed ${formatDateTime(order.createdAt)} · ${pluralize(
    order.items.length,
    'line item'
  )}</p>
      </div>
      <div class="row" style="gap:7px">
        ${statusBadge(order.status, { dot: true })}
        ${statusBadge(order.paymentStatus)}
      </div>
    </div>

    <div class="detail-grid">
      <div>
        <div class="content-card" style="padding:8px 22px">
          <h2 style="padding-top:14px;font-size:17px">Items</h2>
          ${order.items.map((item) => itemHtml(item, renderedShipmentIds)).join('')}
        </div>

        <div class="content-card">
          <h2 style="font-size:17px">Delivery details</h2>
          <div class="spec-grid">
            <div class="summary-line"><span>Recipient</span><span>${escapeHtml(order.shippingName)}</span></div>
            <div class="summary-line"><span>Phone</span><span>${escapeHtml(order.shippingPhone)}</span></div>
            <div class="summary-line"><span>County</span><span>${escapeHtml(order.shippingCounty)}</span></div>
            <div class="summary-line"><span>Town / estate</span><span>${escapeHtml(order.shippingTown)}</span></div>
            <div class="summary-line" style="grid-column:1/-1"><span>Address</span><span style="text-align:right;max-width:70%">${escapeHtml(
              order.shippingAddress
            )}</span></div>
            ${
              order.notes
                ? `<div class="summary-line" style="grid-column:1/-1"><span>Notes</span><span style="text-align:right;max-width:70%">${escapeHtml(
                    order.notes
                  )}</span></div>`
                : ''
            }
          </div>
        </div>

        <div class="content-card">
          <h2 style="font-size:17px">Payment history</h2>
          ${paymentHistoryHtml()}
        </div>
      </div>

      <aside class="sticky-summary">
        <div class="content-card">
          <h2 style="font-size:16px;margin-bottom:14px">Order progress</h2>
          ${timelineHtml(order)}
        </div>
        <div class="content-card">
          <h2 style="font-size:16px;margin-bottom:12px">Summary</h2>
          <div class="summary-line"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
          <div class="summary-line"><span>Delivery</span><span>${
            Number(order.shippingFee) === 0 ? 'Free' : money(order.shippingFee)
          }</span></div>
          <div class="divider" style="margin:12px 0"></div>
          <div class="summary-line total"><span>Total</span><span>${money(order.total)}</span></div>
          ${
            order.canRetryPayment
              ? `<div style="display:grid;gap:8px;margin-top:16px">
                  <button class="btn btn-shopping btn-block" type="button" id="pay-order">${paymentProvider === 'mpesa' ? 'Pay with M-Pesa' : 'Pay now'}</button>
                  <button class="btn btn-ghost btn-block" type="button" id="cancel-order">Cancel order</button>
                </div>`
              : ''
          }
          ${order.cancellationRequest
            ? `<div class="alert info" style="margin-top:12px"><div><strong>Cancellation request</strong><br>${statusBadge(order.cancellationRequest.status)}</div></div>`
            : ''}
          ${order.canRequestCancellation
            ? `<button class="btn btn-ghost btn-block" type="button" id="request-cancellation" style="margin-top:12px">${order.cancellationRequest?.status === 'rejected' ? 'Submit another cancellation request' : 'Request order cancellation'}</button>`
            : ''}
          <div style="display:grid;gap:8px;margin-top:16px">
            <a class="btn btn-secondary btn-block" href="/account/orders">All orders</a>
            <a class="btn btn-ghost btn-block" href="/explore">Continue shopping</a>
          </div>
        </div>
        <div class="content-card">
          <div class="delivery-note" style="border-top:0;padding-top:0">
            <div>${icon('shield-check', { size: 15 })} Buyer protection is active on this order</div>
            <div>${icon('message', { size: 15 })} Message each shop about its order items</div>
          </div>
        </div>
      </aside>
    </div>`;

  account.content.querySelectorAll('[data-review-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = order.items.find((entry) => String(entry.id) === button.dataset.reviewItem);
      if (item) openReviewModal(item);
    });
  });
  account.content.querySelectorAll('[data-message-seller]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const data = await api.post('/messages/conversations', {
          sellerId: Number(button.dataset.messageSeller),
          orderNumber
        });
        window.location.href = `/account/messages?conversation=${data.conversation.id}`;
      } catch (error) {
        toast(errorMessage(error), 'error');
      }
    });
  });
  account.content.querySelectorAll('[data-confirm-delivery]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const result = await api.post(
          `/orders/${encodeURIComponent(order.orderNumber)}/shipments/${button.dataset.confirmDelivery}/confirm-delivery`
        );
        toast(result.message || 'Delivery confirmed.');
        await loadOrder({ silent: true });
      } catch (error) {
        toast(errorMessage(error), 'error');
        button.disabled = false;
      }
    });
  });

  account.content.querySelector('#pay-order')?.addEventListener('click', payOrder);
  account.content.querySelector('#cancel-order')?.addEventListener('click', cancelOrder);
  account.content.querySelector('#request-cancellation')?.addEventListener('click', () =>
    openAdjustmentRequest({ requestType: 'cancellation' })
  );
  account.content.querySelectorAll('[data-request-return]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = order.items.find((entry) => String(entry.id) === button.dataset.requestReturn);
      if (item) openAdjustmentRequest({ requestType: 'return_refund', item });
    });
  });

  if (new URLSearchParams(window.location.search).get('paid') === '1') {
    const alertHost = document.getElementById('order-alert');
    if (alertHost) {
      alertHost.innerHTML = `<div class="alert success" style="margin-bottom:18px">${icon(
        'check-circle',
        { size: 18 }
      )}<div><strong>Payment received.</strong> Your order is now being processed by the seller.</div></div>`;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('paid');
    window.history.replaceState({}, '', url);
  }
}

function openAdjustmentRequest({ requestType, item = null }) {
  const isReturn = requestType === 'return_refund';
  openModal({
    title: isReturn ? 'Request a return and refund' : 'Request order cancellation',
    subtitle: isReturn ? item.productName : order.orderNumber,
    body: `<form id="adjustment-request-form" style="display:grid;gap:14px">
      ${isReturn ? `<label class="form-group">
        <span class="form-label">Quantity to return</span>
        <input class="input" type="number" name="quantity" min="1" max="${item.quantity}" value="1" required>
      </label>` : '<p class="muted" style="font-size:12px">The request will pause seller fulfilment while it is reviewed.</p>'}
      <label class="form-group">
        <span class="form-label">Reason</span>
        <textarea class="textarea" name="reason" rows="4" minlength="10" maxlength="2000" required
          placeholder="${isReturn ? 'Describe the issue with this delivered item.' : 'Tell us why you need to cancel this order.'}"></textarea>
      </label>
    </form>`,
    footer: `<button class="btn btn-secondary" type="button" data-close-modal>Keep order</button>
      <button class="btn btn-primary" type="button" id="adjustment-request-submit">Submit request</button>`,
    onMount(modal) {
      modal.querySelector('#adjustment-request-submit').addEventListener('click', async (event) => {
        const submit = event.currentTarget;
        const form = modal.querySelector('#adjustment-request-form');
        if (!form.reportValidity()) return;
        const reason = form.elements.namedItem('reason').value.trim();
        if (reason.length < 10) {
          form.elements.namedItem('reason').setCustomValidity('Please provide at least 10 characters.');
          form.reportValidity();
          form.elements.namedItem('reason').setCustomValidity('');
          return;
        }
        setButtonLoading(submit, true, 'Submitting…');
        try {
          await api.post(`/orders/${encodeURIComponent(order.orderNumber)}/requests`, {
            requestType,
            reason,
            ...(isReturn ? {
              orderItemId: item.id,
              quantity: Number(form.elements.namedItem('quantity').value)
            } : {})
          });
          closeModal();
          toast(isReturn ? 'Return request submitted.' : 'Cancellation request submitted.');
          await loadOrder({ silent: true });
        } catch (error) {
          setButtonLoading(submit, false);
          toast(errorMessage(error), 'error');
        }
      });
    }
  });
}

function openReviewModal(item) {
  let rating = 5;
  const backdrop = openModal({
    title: 'Write a review',
    subtitle: item.productName,
    body: `
      <form id="review-form" style="display:grid;gap:15px">
        <div class="form-group">
          <span class="form-label">Your rating</span>
          <div class="stars-input" data-stars-input>
            ${Array.from({ length: 5 }, (_, index) => `<button type="button" data-rating="${index + 1}" class="active" aria-label="${index + 1} star${index === 0 ? '' : 's'}">${icon('star-filled', { size: 24 })}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="review-title">Headline <span class="optional">(optional)</span></label>
          <input class="input" id="review-title" name="title" maxlength="150" placeholder="Sum up your experience">
        </div>
        <div class="form-group">
          <label class="form-label" for="review-comment">Your review <span class="optional">(optional)</span></label>
          <textarea class="textarea" id="review-comment" name="comment" rows="4" maxlength="2000" placeholder="Tell other buyers about the product, delivery and seller communication."></textarea>
        </div>
      </form>`,
    footer: `<button class="btn btn-secondary" type="button" data-close-modal>Cancel</button>
             <button class="btn btn-primary" type="button" id="review-submit">Publish review</button>`,
    onMount(modal) {
      const starsHost = modal.querySelector('[data-stars-input]');
      starsHost.querySelectorAll('[data-rating]').forEach((button) => {
        button.addEventListener('click', () => {
          rating = Number(button.dataset.rating);
          starsHost.querySelectorAll('[data-rating]').forEach((entry) => {
            entry.classList.toggle('active', Number(entry.dataset.rating) <= rating);
          });
        });
      });

      modal.querySelector('#review-submit').addEventListener('click', async (event) => {
        const submit = event.currentTarget;
        setButtonLoading(submit, true, 'Publishing…');
        try {
          await api.post('/reviews', {
            orderItemId: item.id,
            rating,
            title: modal.querySelector('#review-title').value.trim() || undefined,
            comment: modal.querySelector('#review-comment').value.trim() || undefined
          });
          closeModal();
          toast('Thanks — your review is now live.');
          await loadOrder({ silent: true });
        } catch (error) {
          setButtonLoading(submit, false);
          toast(errorMessage(error), 'error');
        }
      });
    }
  });
  return backdrop;
}

async function payOrder() {
  if (busy) return;
  busy = true;
  const button = document.getElementById('pay-order');
  const isMpesa = paymentProvider === 'mpesa';
  setButtonLoading(button, true, isMpesa ? 'Requesting M-Pesa prompt…' : 'Confirming…');
  try {
    const hasPending = order.payments.some((payment) =>
      payment.status === 'pending' && payment.provider === paymentProvider
    );
    if (!hasPending) {
      await api.post(`/orders/${encodeURIComponent(order.orderNumber)}/payment/retry`);
    }
    if (isMpesa) {
      const result = await api.post(
        `/orders/${encodeURIComponent(order.orderNumber)}/payment/mpesa`,
        { phone: order.shippingPhone }
      );
      toast(result.message || 'Check your phone to approve the M-Pesa payment.');
      await pollMpesaPayment();
    } else {
      await api.post(`/orders/${encodeURIComponent(order.orderNumber)}/payment/simulate`, {
        outcome: 'success'
      });
      const url = new URL(window.location.href);
      url.searchParams.set('paid', '1');
      window.location.href = url;
    }
  } catch (error) {
    toast(errorMessage(error), 'error');
    busy = false;
    await loadOrder({ silent: true });
  }
}

async function pollMpesaPayment() {
  const button = document.getElementById('pay-order');
  setButtonLoading(button, true, 'Waiting for M-Pesa confirmation…');
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
    const data = await api.get(`/orders/${encodeURIComponent(order.orderNumber)}`);
    order = data.order;
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
      const url = new URL(window.location.href);
      url.searchParams.set('paid', '1');
      window.location.href = url;
      return;
    }
    if (order.payments.every((payment) => payment.status !== 'pending')) {
      toast('M-Pesa did not complete. You can try again from this page.', 'error');
      busy = false;
      await loadOrder({ silent: true });
      return;
    }
  }
  toast('Still waiting for M-Pesa. Refresh this page to check the latest payment status.');
  busy = false;
  await loadOrder({ silent: true });
}

async function cancelOrder() {
  const confirmed = await confirmDialog({
    title: 'Cancel this order?',
    message: 'Reserved stock will be released back to the seller. This cannot be undone.',
    confirmLabel: 'Cancel order',
    danger: true
  });
  if (!confirmed) return;
  try {
    await api.post(`/orders/${encodeURIComponent(order.orderNumber)}/cancel`);
    toast('Order cancelled.');
    await loadOrder({ silent: true });
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function loadOrder({ silent = false } = {}) {
  try {
    const data = await api.get(`/orders/${encodeURIComponent(orderNumber)}`);
    order = data.order;
    if (!silent) account.content.innerHTML = '';
    render();
  } catch (error) {
    account.content.innerHTML =
      error?.status === 404
        ? emptyState({
            iconName: 'package',
            title: 'Order not found',
            text: 'We could not find this order in your account.',
            action: '<a class="btn btn-primary" href="/account/orders">View your orders</a>'
          })
        : errorState(errorMessage(error));
    if (error?.status !== 404) {
      account.content.querySelector('[data-retry]')?.addEventListener('click', () => loadOrder());
    }
  }
}

async function init() {
  account = await initAccount({
    active: '/account/orders',
    title: 'Order details',
    subtitle: orderNumber ? `Order ${orderNumber}` : 'Track payment and delivery.'
  });
  if (!account) return;

  if (!orderNumber) {
    account.content.innerHTML = emptyState({
      iconName: 'package',
      title: 'Choose an order',
      text: 'Open an order from your order history to see its details.',
      action: '<a class="btn btn-primary" href="/account/orders">View your orders</a>'
    });
    return;
  }

  try {
    const method = await api.get('/payments/method');
    paymentProvider = method.provider;
  } catch (error) {
    account.content.innerHTML = errorState(errorMessage(error));
    account.content.querySelector('[data-retry]')?.addEventListener('click', init);
    return;
  }
  await loadOrder();
}

init();
