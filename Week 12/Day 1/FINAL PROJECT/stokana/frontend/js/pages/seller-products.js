import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import {
  attachPagination,
  bindTabs,
  stockEditor,
  tableHtml,
  tabsHtml,
  updateTabCounts
} from '../dashboard-ui.js';
import {
  img,
  pageLoader,
  errorState,
  emptyState,
  confirmDialog,
  toast,
  setButtonLoading,
  errorMessage
} from '../ui.js';
import { escapeHtml, money, statusBadge, pluralize, debounce, formatDate } from '../format.js';

const TABS = [
  { value: 'all', label: 'All', count: 0 },
  { value: 'approved', label: 'Live', count: 0 },
  { value: 'pending', label: 'Pending', count: 0 },
  { value: 'rejected', label: 'Rejected', count: 0 },
  { value: 'archived', label: 'Archived', count: 0 }
];

const EMPTY_COPY = {
  all: ['No products yet', 'Create your first listing and submit it for review.'],
  approved: ['No live products', 'Approved products appear here and in the marketplace.'],
  pending: ['Nothing awaiting review', 'Products you submit for approval will be listed here.'],
  rejected: ['No rejected products', 'If a product needs changes, the reason appears here.'],
  archived: ['No archived products', 'Archived products are hidden from the marketplace.']
};

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let search = params.get('q') || '';
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;
let lastResult = null;

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
      <div id="product-tabs">${tabsHtml(TABS, status, { ariaLabel: 'Filter products' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="product-search" value="${escapeHtml(search)}"
            placeholder="Search your products" aria-label="Search your products">
        </div>
      </div>
    </div>
    <div class="card" id="products-card">
      <div id="products-host">${pageLoader()}</div>
      <div id="products-pagination" style="padding:0 16px"></div>
    </div>`;

  bindTabs(dash.content.querySelector('#product-tabs'), (value) => {
    status = value;
    page = 1;
    syncUrl();
    load();
  });

  const input = dash.content.querySelector('#product-search');
  input?.addEventListener(
    'input',
    debounce(() => {
      search = input.value.trim();
      page = 1;
      syncUrl();
      load();
    }, 350)
  );
}

function rowHtml(product) {
  const compare = Number(product.compareAtPrice || 0);
  const price = Number(product.price);
  const archived = product.status === 'archived';
  const productHref = `/seller/products/edit?id=${product.id}`;
  const viewLink =
    product.status === 'approved'
      ? `<a class="btn btn-secondary btn-sm btn-icon" href="/product/${encodeURIComponent(product.slug)}"
           target="_blank" rel="noopener" title="View in store">${icon('eye', { size: 15 })}</a>`
      : '';

  return `<tr>
    <td>
      <div class="table-product">
        ${img(product.imageUrl, product.name, 'class="table-thumb" width="42" height="42"')}
        <div>
          <a class="cell-main" style="display:block" href="${productHref}">${escapeHtml(product.name)}</a>
          <span class="cell-sub">${escapeHtml(product.categoryName)}</span>
          ${
            product.status === 'rejected' && product.rejectionReason
              ? `<span class="cell-sub" style="color:var(--danger)">${escapeHtml(product.rejectionReason)}</span>`
              : ''
          }
        </div>
      </div>
    </td>
    <td>
      <span class="cell-main">${money(price)}</span>
      ${compare > price ? `<span class="cell-sub"><s>${money(compare)}</s></span>` : ''}
    </td>
    <td>${archived ? `<span class="cell-main">${Number(product.stock)}</span>` : stockEditor(product)}</td>
    <td>${statusBadge(product.status)}</td>
    <td>
      <span class="cell-main">${pluralize(product.unitsSold, 'unit')}</span>
      <span class="cell-sub">${money(product.grossSales, { compact: true })} sold</span>
    </td>
    <td><span class="cell-sub" style="margin:0">${formatDate(product.createdAt)}</span></td>
    <td>
      <div class="table-actions">
        ${viewLink}
        ${
          archived
            ? '<span class="tiny muted">Archived</span>'
            : `<a class="btn btn-secondary btn-sm btn-icon" href="${productHref}" title="Edit product">${icon('edit', {
                size: 15
              })}</a>
               <button class="btn btn-ghost btn-sm btn-icon" type="button" data-archive="${product.id}"
                 data-name="${escapeHtml(product.name)}" title="Archive product">${icon('trash', { size: 15 })}</button>`
        }
      </div>
    </td>
  </tr>`;
}

function renderResult(data) {
  lastResult = data;
  const host = dash.content.querySelector('#products-host');
  const paginationHost = dash.content.querySelector('#products-pagination');
  const tabsHost = dash.content.querySelector('#product-tabs');

  updateTabCounts(tabsHost, {
    all: data.counts.total,
    approved: data.counts.approved,
    pending: data.counts.pending,
    rejected: data.counts.rejected,
    archived: data.counts.archived
  });

  if (!data.products.length) {
    const copy = EMPTY_COPY[status] || EMPTY_COPY.all;
    host.innerHTML = emptyState({
      iconName: 'package',
      title: copy[0],
      text: search ? `No products match “${search}”.` : copy[1],
      action: '<a class="btn btn-primary" href="/seller/products/new">Add a product</a>'
    });
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = tableHtml(
    ['Product', 'Price', 'Stock', 'Status', 'Sold', 'Added', ''],
    data.products.map(rowHtml)
  );

  host.querySelectorAll('[data-stock-save]').forEach((button) => {
    button.addEventListener('click', () => saveStock(button));
  });
  host.querySelectorAll('[data-archive]').forEach((button) => {
    button.addEventListener('click', () => archiveProduct(button));
  });

  attachPagination(paginationHost, data.pagination, (next) => {
    page = next;
    syncUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

async function saveStock(button) {
  const id = button.dataset.stockSave;
  const input = dash.content.querySelector(`[data-stock-input="${id}"]`);
  if (!input) return;
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 0) {
    toast('Stock must be a whole number of zero or more.', 'error');
    input.focus();
    return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/seller/products/${id}/stock`, { stock: value });
    toast(result.message);
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function archiveProduct(button) {
  const ok = await confirmDialog({
    title: 'Archive this product?',
    message: `“${button.dataset.name}” will be removed from the marketplace. Existing orders are not affected.`,
    confirmLabel: 'Archive product',
    danger: true
  });
  if (!ok) return;

  setButtonLoading(button, true, '');
  try {
    const result = await api.delete(`/seller/products/${button.dataset.archive}`);
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
  const host = dash.content.querySelector('#products-host');
  const paginationHost = dash.content.querySelector('#products-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/seller/products${queryString({
        status: status === 'all' ? undefined : status,
        q: search || undefined,
        page,
        limit: 15
      })}`
    );
    renderResult(data);
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
    role: 'seller',
    active: '/seller/products',
    title: 'Products',
    subtitle: 'Manage listings, stock levels and approval status.',
    actions: `<a class="btn btn-primary btn-sm" href="/seller/products/new">${icon('plus', { size: 15 })} Add a product</a>`
  });
  if (!dash) return;

  renderShell();
  await load();

  if (lastResult && search) {
    const input = dash.content.querySelector('#product-search');
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }
}

init();
