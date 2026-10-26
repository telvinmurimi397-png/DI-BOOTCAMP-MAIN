import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import {
  attachPagination,
  bindTabs,
  tableHtml,
  tabsHtml
} from '../dashboard-ui.js';
import {
  avatar,
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
  formatDate,
  statusBadge,
  pluralize,
  debounce
} from '../format.js';

const TABS = [
  { value: 'all', label: 'All users' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'seller', label: 'Sellers' },
  { value: 'admin', label: 'Admins' }
];

const params = new URLSearchParams(window.location.search);
let role = TABS.some((tab) => tab.value === params.get('role')) ? params.get('role') : 'all';
let search = params.get('q') || '';
let page = Math.max(1, Number(params.get('page')) || 1);
let dash = null;
let loading = false;

function syncUrl() {
  const url = new URL(window.location.href);
  if (role === 'all') url.searchParams.delete('role');
  else url.searchParams.set('role', role);
  if (search) url.searchParams.set('q', search);
  else url.searchParams.delete('q');
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  window.history.replaceState({}, '', url);
}

function renderShell() {
  dash.content.innerHTML = `
    <div class="table-toolbar">
      <div id="user-tabs">${tabsHtml(TABS, role, { ariaLabel: 'Filter users by role' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="user-search" value="${escapeHtml(search)}"
            placeholder="Search name or email" aria-label="Search users">
        </div>
      </div>
    </div>
    <div class="account-orders-toolbar">
      <span class="tiny muted" id="users-total">Loading users…</span>
      <span class="tiny muted">Admins cannot be deactivated from this screen.</span>
    </div>
    <div class="card">
      <div id="users-host">${pageLoader()}</div>
      <div id="users-pagination" style="padding:0 16px"></div>
    </div>`;

  bindTabs(dash.content.querySelector('#user-tabs'), (value) => {
    role = value;
    page = 1;
    syncUrl();
    load();
  });

  const input = dash.content.querySelector('#user-search');
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

function userRow(user) {
  const isAdmin = user.role === 'admin';
  const shop = user.shopName
    ? `<a class="cell-main" href="/shop/${encodeURIComponent(user.shopSlug)}" target="_blank"
         rel="noopener">${escapeHtml(user.shopName)}</a>
       <span class="cell-sub">${statusBadge(user.sellerStatus)}</span>`
    : '<span class="cell-sub" style="margin:0">—</span>';

  return `<tr>
    <td>
      <div class="table-product">
        ${avatar(user.fullName)}
        <div>
          <span class="cell-main">${escapeHtml(user.fullName)}</span>
          <span class="cell-sub">${escapeHtml(user.email)}</span>
        </div>
      </div>
    </td>
    <td>${statusBadge(user.role)}</td>
    <td>${shop}</td>
    <td>${pluralize(user.orderCount, 'order')}</td>
    <td><span class="cell-sub" style="margin:0">${formatDate(user.createdAt)}</span></td>
    <td><span class="cell-sub" style="margin:0">${
      user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'
    }</span></td>
    <td>${statusBadge(user.isActive ? 'active' : 'inactive')}</td>
    <td>
      <div class="table-actions">
        ${
          isAdmin
            ? '<span class="tiny muted">Protected</span>'
            : `<button class="btn ${user.isActive ? 'btn-secondary' : 'btn-success'} btn-sm"
                 type="button" data-user-status="${user.id}" data-active="${user.isActive}"
                 data-name="${escapeHtml(user.fullName)}">
                 ${user.isActive ? 'Deactivate' : 'Reactivate'}
               </button>`
        }
      </div>
    </td>
  </tr>`;
}

function renderUsers(data) {
  const host = dash.content.querySelector('#users-host');
  const paginationHost = dash.content.querySelector('#users-pagination');
  const totalHost = dash.content.querySelector('#users-total');
  totalHost.textContent = pluralize(data.pagination.total, 'matching account');

  if (!data.users.length) {
    host.innerHTML = emptyState({
      iconName: 'users',
      title: 'No users found',
      text: search ? `No accounts match “${search}”.` : 'Users who register appear here.',
      action: search ? '<button class="btn btn-secondary" type="button" data-clear-search>Clear search</button>' : ''
    });
    host.querySelector('[data-clear-search]')?.addEventListener('click', () => {
      search = '';
      page = 1;
      syncUrl();
      const input = dash.content.querySelector('#user-search');
      if (input) input.value = '';
      load();
    });
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = tableHtml(
    ['User', 'Role', 'Shop', 'Orders', 'Joined', 'Last sign-in', 'Status', ''],
    data.users.map(userRow)
  );

  host.querySelectorAll('[data-user-status]').forEach((button) => {
    button.addEventListener('click', () => setStatus(button));
  });

  attachPagination(paginationHost, data.pagination, (next) => {
    page = next;
    syncUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

async function setStatus(button) {
  const active = button.dataset.active === 'true';
  if (active) {
    const ok = await confirmDialog({
      title: `Deactivate ${button.dataset.name}?`,
      message: 'They will be signed out and unable to sign in until an administrator reactivates the account.',
      confirmLabel: 'Deactivate account',
      danger: true
    });
    if (!ok) return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/admin/users/${button.dataset.userStatus}/status`, {
      isActive: !active
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
  const host = dash.content.querySelector('#users-host');
  const paginationHost = dash.content.querySelector('#users-pagination');
  if (host) host.innerHTML = pageLoader();
  if (paginationHost) paginationHost.innerHTML = '';

  try {
    const data = await api.get(
      `/admin/users${queryString({
        role: role === 'all' ? undefined : role,
        q: search || undefined,
        page,
        limit: 20
      })}`
    );
    renderUsers(data);
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
    active: '/admin/users',
    title: 'Users',
    subtitle: 'Review every buyer, seller and administrator on STOKANA.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/sellers">Seller approvals</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
