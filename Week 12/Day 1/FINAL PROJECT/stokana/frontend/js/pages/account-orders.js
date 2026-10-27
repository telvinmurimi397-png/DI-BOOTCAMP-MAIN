import { api, queryString } from '../api.js';
import { initAccount } from '../account-ui.js';
import { buyerOrderCard } from '../order-ui.js';
import {
  emptyState,
  errorState,
  pageLoader,
  paginationHtml,
  errorMessage
} from '../ui.js';
import { escapeHtml, pluralize } from '../format.js';

const TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'active', label: 'Active' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const EMPTY_COPY = {
  all: {
    title: 'No orders yet',
    text: 'Your first STOKANA order will appear here with payment and delivery tracking.'
  },
  active: {
    title: 'No active orders',
    text: 'Orders awaiting payment, being prepared or in transit show up here.'
  },
  awaiting_payment: {
    title: 'Nothing awaiting payment',
    text: 'Unpaid orders are held here until you complete checkout.'
  },
  delivered: {
    title: 'No delivered orders yet',
    text: 'When an order arrives you can review the products from its detail page.'
  },
  cancelled: {
    title: 'No cancelled orders',
    text: 'Orders you cancel will be listed here for your records.'
  }
};

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let page = Math.max(1, Number(params.get('page')) || 1);
let account = null;
let loading = false;

function renderShell() {
  account.content.innerHTML = `
    <div class="account-orders-toolbar">
      <div class="tabs" role="tablist" aria-label="Filter orders">
        ${TABS.map(
          (tab) => `<button class="tab${tab.value === status ? ' active' : ''}" type="button" role="tab" aria-selected="${
            tab.value === status
          }" data-status="${tab.value}">${escapeHtml(tab.label)}</button>`
        ).join('')}
      </div>
      <span class="tiny muted" id="orders-total">Loading…</span>
    </div>
    <div id="orders-host">${pageLoader()}</div>
    <div id="orders-pagination"></div>`;

  account.content.querySelectorAll('[data-status]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.status === status) return;
      status = button.dataset.status;
      page = 1;
      syncUrl();
      account.content.querySelectorAll('[data-status]').forEach((tab) => {
        const active = tab.dataset.status === status;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      loadOrders();
    });
  });
}

function syncUrl() {
  const url = new URL(window.location.href);
  if (status === 'all') url.searchParams.delete('status');
  else url.searchParams.set('status', status);
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  window.history.replaceState({}, '', url);
}

function renderOrders({ orders, pagination }) {
  const host = account.content.querySelector('#orders-host');
  const totalHost = account.content.querySelector('#orders-total');
  const paginationHost = account.content.querySelector('#orders-pagination');

  totalHost.textContent = pluralize(pagination.total, 'order');

  if (!orders.length) {
    const copy = EMPTY_COPY[status] || EMPTY_COPY.all;
    host.innerHTML = `<div class="orders-empty-card">${emptyState({
      iconName: 'package',
      title: copy.title,
      text: copy.text,
      action: '<a class="btn btn-primary" href="/explore">Explore the marketplace</a>'
    })}</div>`;
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = `<div class="orders-list">${orders.map((order) => buyerOrderCard(order)).join('')}</div>`;
  paginationHost.innerHTML = paginationHtml(pagination);

  paginationHost.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = Number(button.dataset.page);
      if (!next || next < 1 || next > pagination.totalPages || next === page) return;
      page = next;
      syncUrl();
      loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function loadOrders() {
  if (loading) return;
  loading = true;
  const host = account.content.querySelector('#orders-host');
  const paginationHost = account.content.querySelector('#orders-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/orders${queryString({ page, limit: 8, status: status === 'all' ? undefined : status })}`
    );
    renderOrders(data);
  } catch (error) {
    if (host) {
      host.innerHTML = errorState(errorMessage(error));
      host.querySelector('[data-retry]')?.addEventListener('click', () => loadOrders());
    }
  } finally {
    loading = false;
  }
}

async function init() {
  account = await initAccount({
    active: '/account/orders',
    title: 'My orders',
    subtitle: 'Track payments, deliveries and reviews for every purchase.',
    actions: '<a class="btn btn-secondary btn-sm" href="/explore">Continue shopping</a>'
  });
  if (!account) return;

  renderShell();
  await loadOrders();
}

init();
