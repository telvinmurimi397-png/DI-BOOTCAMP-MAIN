import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { attachPagination, bindTabs, tabsHtml } from '../dashboard-ui.js';
import {
  pageLoader,
  errorState,
  emptyState,
  toast,
  setButtonLoading,
  promptDialog,
  errorMessage
} from '../ui.js';
import {
  escapeHtml,
  initials,
  money,
  formatDate,
  statusBadge,
  pluralize,
  debounce
} from '../format.js';

const TABS = [
  { value: 'all', label: 'All shops' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' }
];

const EMPTY_COPY = {
  all: ['No shops yet', 'Seller applications appear here when someone registers a shop.'],
  pending: ['No pending applications', 'New seller applications land here for review.'],
  approved: ['No approved shops', 'Shops you approve appear here.'],
  rejected: ['No rejected shops', 'Applications you reject are kept here for the record.'],
  suspended: ['No suspended shops', 'Shops you suspend appear here.']
};

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let search = params.get('q') || '';
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;

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

function renderShell() {
  dash.content.innerHTML = `
    <div class="table-toolbar">
      <div id="seller-tabs">${tabsHtml(TABS, status, { ariaLabel: 'Filter seller shops' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="seller-search" value="${escapeHtml(search)}"
            placeholder="Search shop or owner" aria-label="Search shops">
        </div>
      </div>
    </div>
    <div class="account-orders-toolbar">
      <span class="tiny muted" id="sellers-total">Loading shops…</span>
      <span class="tiny muted">Approving a shop lets the seller publish products.</span>
    </div>
    <div id="sellers-host">${pageLoader()}</div>
    <div id="sellers-pagination"></div>`;

  bindTabs(dash.content.querySelector('#seller-tabs'), (value) => {
    status = value;
    page = 1;
    syncUrl();
    load();
  });

  const input = dash.content.querySelector('#seller-search');
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

function actionsFor(seller) {
  const base = [];
  if (seller.status === 'pending' || seller.status === 'rejected') {
    base.push(`<button class="btn btn-success btn-sm" type="button" data-action="approve"
      data-id="${seller.id}" data-shop="${escapeHtml(seller.shopName)}">${icon('check', { size: 15 })} Approve shop</button>`);
  }
  if (seller.status === 'suspended') {
    base.push(`<button class="btn btn-success btn-sm" type="button" data-action="approve"
      data-id="${seller.id}" data-shop="${escapeHtml(seller.shopName)}">${icon('check', { size: 15 })} Reinstate shop</button>`);
  }
  if (seller.status === 'pending') {
    base.push(`<button class="btn btn-secondary btn-sm" type="button" data-action="reject"
      data-id="${seller.id}" data-shop="${escapeHtml(seller.shopName)}">Reject</button>`);
  }
  if (seller.status === 'approved') {
    base.push(`<button class="btn btn-secondary btn-sm" type="button" data-action="suspend"
      data-id="${seller.id}" data-shop="${escapeHtml(seller.shopName)}">Suspend</button>`);
  }
  return base.join('');
}

function sellerCard(seller) {
  const logo = seller.logoUrl
    ? `<img src="${escapeHtml(seller.logoUrl)}" alt="${escapeHtml(seller.shopName)}" loading="lazy">`
    : escapeHtml(initials(seller.shopName) || 'S');
  const viewShop =
    seller.status === 'approved'
      ? `<a class="btn btn-ghost btn-sm" href="/shop/${encodeURIComponent(seller.shopSlug)}" target="_blank"
           rel="noopener">${icon('globe', { size: 15 })} View shop</a>`
      : '';
  const actionButtons = actionsFor(seller);

  return `<article class="card">
    <div class="card-body">
      <div class="seller-card-head">
        <span class="seller-avatar">${logo}</span>
        <div class="grow">
          <h3>${escapeHtml(seller.shopName)}</h3>
          <div class="seller-contact">
            <span>${icon('user', { size: 12 })} ${escapeHtml(seller.ownerName)}</span>
            <span>${icon('mail', { size: 12 })} ${escapeHtml(seller.email)}</span>
            ${seller.phone ? `<span>${icon('phone', { size: 12 })} ${escapeHtml(seller.phone)}</span>` : ''}
            <span>${icon('map-pin', { size: 12 })} ${escapeHtml(
              [seller.town, seller.county].filter(Boolean).join(', ') || 'Kenya'
            )}</span>
          </div>
        </div>
        <div class="row" style="gap:6px">
          ${statusBadge(seller.status)}
          <span class="tiny muted">Joined ${formatDate(seller.createdAt)}</span>
        </div>
      </div>

      <p class="seller-description">${escapeHtml(
        seller.description || 'No shop description provided.'
      )}</p>

      ${
        seller.rejectionReason
          ? `<div class="alert ${seller.status === 'suspended' ? 'danger' : 'warning'}"
               style="margin-top:12px;padding:9px 12px;font-size:11px">
              ${icon('info', { size: 14 })}<div>${escapeHtml(seller.rejectionReason)}</div>
            </div>`
          : ''
      }

      <div class="seller-stats">
        <span><strong>${seller.productCount}</strong> products</span>
        <span><strong>${seller.orderCount}</strong> paid orders</span>
        <span><strong>${money(seller.grossSales, { compact: true })}</strong> gross sales</span>
        <span><strong>${seller.approvedAt ? formatDate(seller.approvedAt) : '—'}</strong> approved</span>
      </div>

      <div class="seller-actions">
        ${viewShop}
        ${actionButtons}
      </div>
    </div>
  </article>`;
}

function renderSellers(data) {
  const host = dash.content.querySelector('#sellers-host');
  const paginationHost = dash.content.querySelector('#sellers-pagination');
  const totalHost = dash.content.querySelector('#sellers-total');

  totalHost.textContent = pluralize(data.pagination.total, 'shop');

  if (!data.sellers.length) {
    const copy = EMPTY_COPY[status] || EMPTY_COPY.all;
    host.innerHTML = `<div class="card">${emptyState({
      iconName: 'store',
      title: copy[0],
      text: copy[1],
      action: status === 'pending' ? '' : '<a class="btn btn-secondary" href="/admin/sellers">View all shops</a>'
    })}</div>`;
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = `<div class="list-stack">${data.sellers.map(sellerCard).join('')}</div>`;
  host.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => review(button));
  });

  attachPagination(paginationHost, data.pagination, (next) => {
    page = next;
    syncUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

async function review(button) {
  const action = button.dataset.action;
  let reason;
  if (action === 'reject' || action === 'suspend') {
    reason = await promptDialog({
      title: `${action === 'reject' ? 'Reject' : 'Suspend'} ${button.dataset.shop}`,
      label: 'Reason shared with the seller',
      placeholder:
        action === 'reject'
          ? 'Explain what needs to change before this shop can be approved.'
          : 'Explain why this shop is being suspended.',
      confirmLabel: action === 'reject' ? 'Reject application' : 'Suspend shop',
      danger: true
    });
    if (!reason) return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/admin/sellers/${button.dataset.id}/review`, {
      action,
      reason: reason || undefined
    });
    toast(result.message);
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#sellers-host');
  const paginationHost = dash.content.querySelector('#sellers-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/admin/sellers${queryString({
        status: status === 'all' ? undefined : status,
        q: search || undefined,
        page,
        limit: 10
      })}`
    );
    renderSellers(data);
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
    active: '/admin/sellers',
    title: 'Seller approvals',
    subtitle: 'Approve shops before their products can go live.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/products">Product approvals</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
