import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { attachPagination, bindTabs, statGrid, tableHtml, tabsHtml } from '../dashboard-ui.js';
import {
  pageLoader,
  errorState,
  emptyState,
  toast,
  setButtonLoading,
  confirmDialog,
  errorMessage
} from '../ui.js';
import {
  escapeHtml,
  money,
  formatDate,
  statusBadge,
  shipmentStatusLabel,
  pluralize,
  plainNumber,
  debounce
} from '../format.js';

const TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'pending_payment', label: 'Unpaid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const EMPTY_COPY = {
  all: ['No orders yet', 'Orders appear here as soon as buyers check out.'],
  pending_payment: ['No unpaid orders', 'Orders waiting for payment appear here.'],
  processing: ['No orders in processing', 'Paid orders awaiting fulfilment appear here.'],
  shipped: ['No shipped orders', 'Orders moving to buyers appear here.'],
  delivered: ['No delivered orders', 'Completed deliveries appear here.'],
  cancelled: ['No cancelled orders', 'Orders cancelled by buyers or admins appear here.']
};

const SHIPMENT_TONES = {
  pending: 'amber',
  packed: 'amber',
  shipped: 'blue',
  dispatched: 'blue',
  in_transit: 'blue',
  out_for_delivery: 'blue',
  delivered: 'green',
  cancelled: 'red'
};

const FULFILMENT_OPTIONS = [
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let search = params.get('q') || '';
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;
let ordersById = new Map();

function syncUrl() {
  const url = new URL(window.location.href);
  if (status === 'all') url.searchParams.delete('status');
  else url.searchParams.set('status', status);
  if (search) url.searchParams.set('q', search);
  else url.searchParams.delete('q');
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  window.history.replaceState({}, '', url);
}

function shipmentBadge(value) {
  return `<span class="badge ${SHIPMENT_TONES[value] || 'grey'}">${escapeHtml(
    shipmentStatusLabel(value)
  )}</span>`;
}

function renderShell() {
  dash.content.innerHTML = `
    <div id="orders-summary"></div>
    <div class="table-toolbar">
      <div id="order-tabs">${tabsHtml(TABS, status, { ariaLabel: 'Filter orders by status' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="order-search" value="${escapeHtml(search)}"
            placeholder="Order number or buyer" aria-label="Search orders">
        </div>
      </div>
    </div>
    <div class="account-orders-toolbar">
      <span class="tiny muted" id="orders-total">Loading orders…</span>
      <span class="tiny muted">Paid orders move into fulfilment; unpaid orders can only be cancelled.</span>
    </div>
    <div class="card">
      <div id="orders-host">${pageLoader()}</div>
      <div id="orders-pagination" style="padding:0 16px"></div>
    </div>`;

  bindTabs(dash.content.querySelector('#order-tabs'), (value) => {
    status = value;
    page = 1;
    syncUrl();
    load();
  });

  const input = dash.content.querySelector('#order-search');
  input.addEventListener(
    'input',
    debounce(() => {
      search = input.value.trim();
      page = 1;
      syncUrl();
      load();
    }, 350)
  );
}

function renderSummary(summary) {
  dash.content.querySelector('#orders-summary').innerHTML = statGrid([
    { label: 'Total orders', value: plainNumber(summary.totalOrders), iconName: 'shopping-bag' },
    {
      label: 'Delivered',
      value: plainNumber(summary.delivered),
      iconName: 'check-circle',
      tone: 'green'
    },
    {
      label: 'Awaiting payment',
      value: plainNumber(summary.unpaid),
      iconName: 'clock',
      tone: 'amber'
    },
    {
      label: 'Paid order value',
      value: money(summary.paidValue, { compact: true }),
      iconName: 'wallet',
      tone: 'blue'
    }
  ]);
}

function statusControls(order) {
  if (order.status === 'cancelled') {
    return '<span class="tiny muted">Closed</span>';
  }

  if (order.paymentStatus !== 'paid') {
    return `<button class="btn btn-secondary btn-sm" type="button" data-cancel-order="${order.id}">
      Cancel order
    </button>`;
  }

  const options = FULFILMENT_OPTIONS.map(
    (option) => `<option value="${option.value}" ${option.value === order.status ? 'disabled' : ''}>
      ${option.label}${option.value === order.status ? ' (current)' : ''}
    </option>`
  ).join('');

  return `<div class="table-actions">
    <select class="select" data-order-select="${order.id}" aria-label="New status for ${
    escapeHtml(order.orderNumber)
  }" style="min-width:140px">
      <option value="">Update status…</option>
      ${options}
    </select>
    <button class="btn btn-secondary btn-sm" type="button" data-order-save="${order.id}" disabled>
      Update
    </button>
  </div>`;
}

function orderRow(order) {
  const shipments = Array.isArray(order.shipmentStatuses) ? order.shipmentStatuses.filter(Boolean) : [];
  const shipmentCell = shipments.length
    ? `<div class="row wrap" style="gap:4px">${shipments.map(shipmentBadge).join('')}</div>`
    : '<span class="tiny muted">No shipment</span>';

  return `<tr>
    <td>
      <span class="cell-main">${escapeHtml(order.orderNumber)}</span>
      <span class="cell-sub">${formatDate(order.createdAt)}</span>
    </td>
    <td>
      <span class="cell-main">${escapeHtml(order.buyerName)}</span>
      <span class="cell-sub">${escapeHtml(order.buyerEmail)}</span>
    </td>
    <td>${pluralize(order.itemCount, 'item')}</td>
    <td><span class="cell-sub" style="margin:0">${escapeHtml(order.sellers || '—')}</span></td>
    <td>
      <strong>${money(order.total)}</strong>
      <span class="cell-sub">Shipping ${money(order.shippingFee)}</span>
    </td>
    <td>${statusBadge(order.paymentStatus)}</td>
    <td>${statusBadge(order.status)}</td>
    <td>${shipmentCell}</td>
    <td>${statusControls(order)}</td>
  </tr>`;
}

function bindControls(host) {
  host.querySelectorAll('[data-order-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const save = host.querySelector(`[data-order-save="${select.dataset.orderSelect}"]`);
      if (save) save.disabled = !select.value;
    });
  });

  host.querySelectorAll('[data-order-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const order = ordersById.get(Number(button.dataset.orderSave));
      const select = host.querySelector(`[data-order-select="${button.dataset.orderSave}"]`);
      if (!order || !select?.value) return;
      applyStatus(order, select.value, button);
    });
  });

  host.querySelectorAll('[data-cancel-order]').forEach((button) => {
    button.addEventListener('click', () => {
      const order = ordersById.get(Number(button.dataset.cancelOrder));
      if (order) applyStatus(order, 'cancelled', button);
    });
  });
}

function renderOrders(data) {
  const host = dash.content.querySelector('#orders-host');
  const paginationHost = dash.content.querySelector('#orders-pagination');
  const totalHost = dash.content.querySelector('#orders-total');

  renderSummary(data.summary);
  totalHost.textContent = pluralize(data.pagination.total, 'matching order');
  ordersById = new Map(data.orders.map((order) => [order.id, order]));

  if (!data.orders.length) {
    const copy = EMPTY_COPY[status] || EMPTY_COPY.all;
    host.innerHTML = emptyState({
      iconName: 'shopping-bag',
      title: copy[0],
      text: search ? `No orders match “${search}”.` : copy[1]
    });
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = tableHtml(
    ['Order', 'Buyer', 'Items', 'Sellers', 'Total', 'Payment', 'Status', 'Shipment', ''],
    data.orders.map(orderRow)
  );
  bindControls(host);

  attachPagination(paginationHost, data.pagination, (next) => {
    page = next;
    syncUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

async function applyStatus(order, nextStatus, button) {
  if (nextStatus === 'cancelled') {
    const ok = await confirmDialog({
      title: `Cancel ${order.orderNumber}?`,
      message:
        order.paymentStatus === 'paid'
          ? 'Paid orders cannot be cancelled from this screen until a refund is processed.'
          : 'Stock reservations will be released and the buyer will see the order as cancelled.',
      confirmLabel: 'Cancel order',
      danger: true
    });
    if (!ok) return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/admin/orders/${order.id}/status`, { status: nextStatus });
    toast(result.message || 'Order status updated.');
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#orders-host');
  const paginationHost = dash.content.querySelector('#orders-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/admin/orders${queryString({
        status: status === 'all' ? undefined : status,
        q: search || undefined,
        page,
        limit: 15
      })}`
    );
    renderOrders(data);
  } catch (error) {
    if (host) {
      host.innerHTML = errorState(errorMessage(error));
      host.querySelector('[data-retry]')?.addEventListener('click', load);
    }
  } finally {
    loading = false;
  }
}

async function init() {
  dash = await initDashboard({
    role: 'admin',
    active: '/admin/orders',
    title: 'Orders',
    subtitle: 'Monitor every order and keep fulfilment moving.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/reports">View reports</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
