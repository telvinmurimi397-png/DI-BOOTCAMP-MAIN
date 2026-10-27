import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { attachPagination } from '../dashboard-ui.js';
import {
  pageLoader,
  errorState,
  emptyState,
  toast,
  setButtonLoading,
  errorMessage
} from '../ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  formatDateTime,
  statusBadge,
  pluralize,
  shipmentStatusLabel
} from '../format.js';

const params = new URLSearchParams(window.location.search);
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;

function syncUrl() {
  const url = new URL(window.location.href);
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  window.history.replaceState({}, '', url);
}

function shipmentBadge(status) {
  const tone = {
    delivered: 'green',
    dispatched: 'blue',
    in_transit: 'blue',
    packed: 'amber',
    failed: 'red'
  }[status] || 'grey';
  return `<span class="badge ${tone}">${escapeHtml(shipmentStatusLabel(status))}</span>`;
}

function shipmentForm(order) {
  if (!order.shipmentId) {
    return `<div class="shipment-block">
      <div class="shipment-head">
        <div><h4>Delivery & shipment</h4><span>A shipment is created automatically when payment succeeds.</span></div>
        <span class="badge grey">No shipment yet</span>
      </div>
      <p class="tiny muted" style="margin:0">If this order was just paid, refresh in a moment. Contact support if the shipment record is still missing.</p>
    </div>`;
  }

  if (order.status === 'cancelled') {
    return `<div class="shipment-block">
      <div class="shipment-head">
        <div><h4>Delivery & shipment</h4><span>This order was cancelled by an administrator.</span></div>
        ${shipmentBadge(order.shipmentStatus || 'pending')}
      </div>
    </div>`;
  }

  if (order.shipmentStatus === 'delivered') {
    return `<div class="shipment-block">
      <div class="shipment-head">
        <div><h4>Delivery & shipment</h4><span>The buyer has received this parcel.</span></div>
        ${shipmentBadge('delivered')}
      </div>
      <div class="shipment-meta">
        <span>${icon('truck', { size: 13 })} ${escapeHtml(order.carrier || 'Courier not recorded')}</span>
        <span>Tracking ${escapeHtml(order.trackingNumber || '—')}</span>
        <span>Updated ${formatDateTime(order.shipmentUpdatedAt)}</span>
      </div>
    </div>`;
  }

  const current = order.shipmentStatus || 'pending';
  const options = ['dispatched', 'in_transit', 'delivered', 'failed'];
  const selected = options.includes(current) ? current : 'dispatched';

  return `<div class="shipment-block">
    <div class="shipment-head">
      <div><h4>Delivery & shipment</h4><span>Update the parcel status as it moves to the buyer.</span></div>
      ${shipmentBadge(current)}
    </div>
    <div class="shipment-meta">
      <span>${icon('truck', { size: 13 })} ${escapeHtml(order.carrier || 'Courier not set')}</span>
      <span>Tracking ${escapeHtml(order.trackingNumber || '—')}</span>
      <span>Updated ${formatDateTime(order.shipmentUpdatedAt)}</span>
    </div>
    <form class="order-shipment-form" data-shipment-form="${order.shipmentId}">
      <label class="form-group">
        <span class="form-label">Status</span>
        <select class="select" name="status">
          ${options
            .map(
              (value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${escapeHtml(
                shipmentStatusLabel(value)
              )}</option>`
            )
            .join('')}
        </select>
      </label>
      <label class="form-group">
        <span class="form-label">Courier</span>
        <input class="input" name="carrier" type="text" maxlength="80" value="${escapeHtml(order.carrier || '')}"
          placeholder="e.g. Pickup Mtaani">
      </label>
      <label class="form-group">
        <span class="form-label">Tracking number</span>
        <input class="input" name="trackingNumber" type="text" maxlength="120"
          value="${escapeHtml(order.trackingNumber || '')}" placeholder="e.g. PM-48211">
      </label>
      <button class="btn btn-primary btn-sm" type="submit" data-shipment-submit>
        ${icon('truck', { size: 15 })} Update shipment
      </button>
    </form>
    <p class="form-hint">Dispatch requires a courier or tracking number. The order moves to shipped once every shipment is dispatched.</p>
  </div>`;
}

function orderCard(order) {
  const commission = Math.max(0, Number(order.sellerSubtotal) - Number(order.sellerEarnings));
  const address = [order.shippingAddress, order.shippingTown, order.shippingCounty]
    .filter(Boolean)
    .map((part) => escapeHtml(part))
    .join(', ');

  return `<article class="order-card">
    <header class="order-card-head">
      <div>
        <strong>${escapeHtml(order.orderNumber)}</strong>
        <div class="tiny muted" style="margin-top:2px">Paid ${formatDate(order.paidAt || order.createdAt)}</div>
      </div>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        ${statusBadge(order.status, { dot: true })}
        ${statusBadge(order.paymentStatus)}
      </div>
    </header>
    <div class="order-card-body">
      ${order.items
        .map(
          (item) => `<div class="order-line">
            <img src="${escapeHtml(item.imageUrl || '/assets/placeholder.svg')}" alt="${escapeHtml(item.productName)}"
              loading="lazy" width="58" height="58">
            <div class="order-line-main">
              <strong style="display:block;font-size:13px;color:var(--ink)">${escapeHtml(item.productName)}</strong>
              <span>${Number(item.quantity)} × ${money(item.unitPrice)}</span>
            </div>
            <div class="order-line-total">${money(item.lineTotal)}</div>
          </div>`
        )
        .join('')}

      <div class="seller-order-info">
        <div>
          <div class="form-section-title">Deliver to</div>
          <div style="font-size:12px;line-height:1.75;color:var(--muted-strong)">
            <strong style="color:var(--ink)">${escapeHtml(order.shippingName)}</strong><br>
            ${icon('phone', { size: 12 })} ${escapeHtml(order.shippingPhone)}<br>
            ${icon('map-pin', { size: 12 })} ${address || 'Address provided at checkout'}
          </div>
          ${
            order.notes
              ? `<div class="alert warning" style="margin-top:10px;padding:9px 12px;font-size:11px">
                  ${icon('info', { size: 14 })}<div>${escapeHtml(order.notes)}</div>
                </div>`
              : ''
          }
        </div>
        <div class="seller-order-summary">
          <div><span>Items</span><span>${pluralize(
            order.items.reduce((sum, item) => sum + Number(item.quantity), 0),
            'unit'
          )}</span></div>
          <div><span>Order subtotal</span><span>${money(order.sellerSubtotal)}</span></div>
          <div><span>Platform commission</span><span>− ${money(commission)}</span></div>
          <div class="total"><span>Your earnings</span><span>${money(order.sellerEarnings)}</span></div>
        </div>
      </div>
    </div>
    ${shipmentForm(order)}
  </article>`;
}

async function saveShipment(form) {
  const button = form.querySelector('[data-shipment-submit]');
  const data = Object.fromEntries(new FormData(form));
  const status = data.status;
  const carrier = String(data.carrier || '').trim();
  const trackingNumber = String(data.trackingNumber || '').trim();

  if (status === 'dispatched' && !carrier && !trackingNumber) {
    toast('Add a courier or tracking number when dispatching.', 'error');
    form.querySelector('[name="carrier"]')?.focus();
    return;
  }

  setButtonLoading(button, true, 'Updating…');
  try {
    const result = await api.patch(`/seller/shipments/${form.dataset.shipmentForm}`, {
      status,
      carrier: carrier || undefined,
      trackingNumber: trackingNumber || undefined
    });
    toast(result.message || 'Shipment updated.');
    await load({ quiet: true });
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

function bindCards() {
  dash.content.querySelectorAll('[data-shipment-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveShipment(form);
    });
  });
}

function renderOrders(data) {
  const host = dash.content.querySelector('#orders-host');
  const paginationHost = dash.content.querySelector('#orders-pagination');
  const totalHost = dash.content.querySelector('#orders-total');

  totalHost.textContent = pluralize(data.pagination.total, 'paid order');

  if (!data.orders.length) {
    host.innerHTML = `<div class="card">${emptyState({
      iconName: 'truck',
      title: 'No paid orders yet',
      text: 'Paid orders that include your products appear here with delivery details and shipment controls.',
      action: '<a class="btn btn-primary" href="/seller/products">Manage products</a>'
    })}</div>`;
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = `<div class="orders-list">${data.orders.map(orderCard).join('')}</div>`;
  bindCards();

  attachPagination(paginationHost, data.pagination, (next) => {
    page = next;
    syncUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

async function load({ quiet = false } = {}) {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#orders-host');
  const paginationHost = dash.content.querySelector('#orders-pagination');
  if (!quiet) {
    host.innerHTML = pageLoader();
    paginationHost.innerHTML = '';
  }

  try {
    const data = await api.get(`/seller/orders${queryString({ page, limit: 8 })}`);
    renderOrders(data);
  } catch (error) {
    if (host) {
      host.innerHTML = errorState(errorMessage(error));
      host.querySelector('[data-retry]')?.addEventListener('click', () => load());
    }
  } finally {
    loading = false;
  }
}

async function init() {
  dash = await initDashboard({
    role: 'seller',
    active: '/seller/orders',
    title: 'Orders',
    subtitle: 'Prepare parcels, add tracking and keep buyers informed.',
    actions: '<a class="btn btn-secondary btn-sm" href="/seller/messages">Message buyers</a>'
  });
  if (!dash) return;

  dash.content.innerHTML = `
    <div class="account-orders-toolbar">
      <span class="tiny muted">Only paid orders that include your products are shown.</span>
      <span class="tiny muted" id="orders-total">Loading…</span>
    </div>
    <div id="orders-host">${pageLoader()}</div>
    <div id="orders-pagination"></div>`;

  await load();
}

init();
