import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { attachPagination, bindTabs, tabsHtml, updateTabCounts } from '../dashboard-ui.js';
import {
  img,
  pageLoader,
  errorState,
  emptyState,
  toast,
  setButtonLoading,
  confirmDialog,
  promptDialog,
  errorMessage
} from '../ui.js';
import {
  escapeHtml,
  money,
  formatDate,
  statusBadge,
  pluralize,
  truncate,
  debounce
} from '../format.js';

const TABS = [
  { value: 'pending', label: 'Pending', count: 0 },
  { value: 'approved', label: 'Live', count: 0 },
  { value: 'rejected', label: 'Rejected', count: 0 },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' }
];

const EMPTY_COPY = {
  pending: ['Nothing awaiting review', 'New product submissions appear here for approval.'],
  approved: ['No live products', 'Approved listings appear here and in the marketplace.'],
  rejected: ['No rejected products', 'Listings you reject stay here with the reason.'],
  archived: ['No archived products', 'Products you archive are hidden from the marketplace.'],
  all: ['No products found', 'Sellers have not submitted any products yet.']
};

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'pending';
let search = params.get('q') || '';
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;

function syncUrl() {
  const url = new URL(window.location.href);
  if (status === 'pending') url.searchParams.delete('status');
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
      <div id="product-tabs">${tabsHtml(TABS, status, { ariaLabel: 'Filter products by status' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="product-search" value="${escapeHtml(search)}"
            placeholder="Search product or shop" aria-label="Search products">
        </div>
      </div>
    </div>
    <div class="account-orders-toolbar">
      <span class="tiny muted" id="products-total">Loading products…</span>
      <span class="tiny muted">Approve the seller shop before approving its products.</span>
    </div>
    <div id="products-host">${pageLoader()}</div>
    <div id="products-pagination"></div>`;

  bindTabs(dash.content.querySelector('#product-tabs'), (value) => {
    status = value;
    page = 1;
    syncUrl();
    load();
  });

  const input = dash.content.querySelector('#product-search');
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

function actionsFor(product) {
  const buttons = [];
  const sellerReady = product.sellerStatus === 'approved';
  const approveLabel = product.status === 'archived' ? 'Restore' : 'Approve';
  const sellerTitle = sellerReady ? '' : 'Approve the seller shop first.';

  if (product.status !== 'approved') {
    buttons.push(`<button class="btn btn-success btn-sm" type="button" data-action="approve"
      data-id="${product.id}" data-name="${escapeHtml(product.name)}" ${sellerReady ? '' : 'disabled'}
      title="${escapeHtml(sellerTitle)}">${icon('check', { size: 15 })} ${approveLabel}</button>`);
  }
  if (product.status === 'pending' || product.status === 'rejected') {
    buttons.push(`<button class="btn btn-secondary btn-sm" type="button" data-action="reject"
      data-id="${product.id}" data-name="${escapeHtml(product.name)}">Reject</button>`);
  }
  if (product.status === 'approved' || product.status === 'rejected') {
    buttons.push(`<button class="btn btn-secondary btn-sm" type="button" data-action="archive"
      data-id="${product.id}" data-name="${escapeHtml(product.name)}">Archive</button>`);
  }
  return buttons.join('');
}

function productCard(product) {
  const shop =
    product.sellerStatus === 'approved'
      ? `<a href="/shop/${encodeURIComponent(product.shopSlug)}" target="_blank"
           rel="noopener">${escapeHtml(product.shopName)}</a>`
      : `<span>${escapeHtml(product.shopName)}</span> ${statusBadge(product.sellerStatus)}`;

  const viewProduct =
    product.status === 'approved'
      ? `<a class="btn btn-ghost btn-sm" href="/product/${encodeURIComponent(product.slug)}"
           target="_blank" rel="noopener">${icon('globe', { size: 15 })} View listing</a>`
      : '';

  return `<article class="card">
    <div class="card-body">
      <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
        ${img(product.images?.[0]?.url, product.name, 'class="product-review-thumb"')}
        <div class="grow" style="min-width:min(100%, 240px)">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px">
            <div class="grow">
              <h3>${escapeHtml(product.name)}</h3>
              <div class="product-review-meta">
                <span>${icon('tags', { size: 12 })} ${escapeHtml(product.categoryName)}</span>
                <span>${icon('store', { size: 12 })} ${shop}</span>
                <span>${icon('user', { size: 12 })} ${escapeHtml(product.sellerName)}</span>
                <span>${icon('clock', { size: 12 })} Added ${formatDate(product.createdAt)}</span>
              </div>
            </div>
            <div class="row" style="gap:6px;flex-wrap:wrap">
              ${statusBadge(product.status)}
              ${statusBadge(product.condition)}
            </div>
          </div>

          <p class="seller-description">${escapeHtml(
            product.description
              ? truncate(product.description, 220)
              : 'No description was provided for this listing.'
          )}</p>

          ${
            product.rejectionReason
              ? `<div class="alert ${product.status === 'rejected' ? 'danger' : 'warning'}"
                   style="margin-top:12px;padding:9px 12px;font-size:11px">
                  ${icon('info', { size: 14 })}<div>${escapeHtml(product.rejectionReason)}</div>
                </div>`
              : ''
          }

          <div class="seller-stats">
            <span><strong>${money(product.price)}</strong> price</span>
            <span><strong>${product.stock}</strong> in stock</span>
            <span><strong>${escapeHtml(product.sellerEmail)}</strong> seller email</span>
          </div>

          <div class="seller-actions">
            ${viewProduct}
            ${actionsFor(product)}
          </div>
        </div>
      </div>
    </div>
  </article>`;
}

function renderProducts(data) {
  const host = dash.content.querySelector('#products-host');
  const paginationHost = dash.content.querySelector('#products-pagination');
  const totalHost = dash.content.querySelector('#products-total');
  const tabsHost = dash.content.querySelector('#product-tabs');

  updateTabCounts(tabsHost, data.counts);
  totalHost.textContent = pluralize(data.pagination.total, 'product');

  if (!data.products.length) {
    const copy = EMPTY_COPY[status] || EMPTY_COPY.all;
    const showClear = Boolean(search);
    host.innerHTML = `<div class="card">${emptyState({
      iconName: 'package',
      title: copy[0],
      text: showClear ? `No listings match “${search}”.` : copy[1],
      action: showClear
        ? '<button class="btn btn-secondary" type="button" data-clear-search>Clear search</button>'
        : status !== 'pending'
        ? '<a class="btn btn-secondary" href="/admin/products">Review pending products</a>'
        : ''
    })}</div>`;
    host.querySelector('[data-clear-search]')?.addEventListener('click', () => {
      search = '';
      page = 1;
      syncUrl();
      const input = dash.content.querySelector('#product-search');
      if (input) input.value = '';
      load();
    });
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = `<div class="list-stack">${data.products.map(productCard).join('')}</div>`;
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
  const name = button.dataset.name;
  let reason;

  if (action === 'reject') {
    reason = await promptDialog({
      title: `Reject ${name}`,
      label: 'Reason shared with the seller',
      placeholder: 'Explain what needs to change before this product can be approved.',
      confirmLabel: 'Reject product',
      danger: true
    });
    if (!reason) return;
  }

  if (action === 'archive') {
    const ok = await confirmDialog({
      title: `Archive ${name}?`,
      message: 'This listing will be hidden from the marketplace. You can restore it later.',
      confirmLabel: 'Archive product',
      danger: true
    });
    if (!ok) return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/admin/products/${button.dataset.id}/review`, {
      action,
      reason: reason || undefined
    });
    toast(result.message || 'Product updated.');
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#products-host');
  const paginationHost = dash.content.querySelector('#products-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/admin/products${queryString({
        status,
        q: search || undefined,
        page,
        limit: 10
      })}`
    );
    renderProducts(data);
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
    active: '/admin/products',
    title: 'Product approvals',
    subtitle: 'Review listings before they go live in the marketplace.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/sellers">Seller approvals</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
