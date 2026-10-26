import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { bindTabs, panel, statGrid, tableHtml, tabsHtml } from '../dashboard-ui.js';
import {
  pageLoader,
  errorState,
  toast,
  setButtonLoading,
  openModal,
  closeModal,
  errorMessage
} from '../ui.js';
import { escapeHtml, money, formatDate, statusBadge, pluralize } from '../format.js';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'earned', label: 'Earned' },
  { value: 'paid', label: 'Paid' }
];

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let dash = null;
let loading = false;
let sellersById = new Map();

function syncUrl() {
  const url = new URL(window.location.href);
  if (status === 'all') url.searchParams.delete('status');
  else url.searchParams.set('status', status);
  window.history.replaceState({}, '', url);
}

function renderShell() {
  dash.content.innerHTML = `
    <div id="commission-summary"></div>
    <div id="balances-host" style="margin-top:16px">${pageLoader()}</div>
    <div id="ledger-host" style="margin-top:16px"></div>`;
}

function renderSummary(totals) {
  dash.content.querySelector('#commission-summary').innerHTML = statGrid([
    {
      label: 'Platform commission',
      value: money(totals.platformCommission, { compact: true }),
      iconName: 'wallet',
      tone: 'green',
      foot: 'All time'
    },
    {
      label: 'Available for payout',
      value: money(totals.availableBalance, { compact: true }),
      iconName: 'trending-up',
      tone: 'blue',
      foot: 'Earned, not yet paid'
    },
    {
      label: 'Paid out',
      value: money(totals.paidOut, { compact: true }),
      iconName: 'check-circle',
      foot: 'Settled to sellers'
    },
    {
      label: 'Seller earnings',
      value: money(totals.sellerEarnings, { compact: true }),
      iconName: 'users',
      foot: 'Lifetime total'
    }
  ]);
}

function sellerRow(seller) {
  const available = Number(seller.availableBalance);
  const action =
    available > 0
      ? `<button class="btn btn-primary btn-sm" type="button" data-payout="${seller.sellerId}">
           Record payout
         </button>`
      : '<span class="tiny muted">Nothing due</span>';

  return `<tr>
    <td>
      <a class="cell-main" href="/shop/${encodeURIComponent(seller.shopSlug)}" target="_blank"
        rel="noopener">${escapeHtml(seller.shopName)}</a>
      <span class="cell-sub">${escapeHtml(seller.email)}</span>
    </td>
    <td>${money(seller.grossSales)}</td>
    <td>${money(seller.platformCommission)}</td>
    <td><strong>${money(seller.availableBalance)}</strong></td>
    <td>${money(seller.paidOut)}</td>
    <td><span class="cell-sub" style="margin:0">${
      seller.lastPayoutAt ? formatDate(seller.lastPayoutAt) : 'Never'
    }</span></td>
    <td><div class="table-actions">${action}</div></td>
  </tr>`;
}

function ledgerRow(entry) {
  return `<tr>
    <td>
      <span class="cell-main">${escapeHtml(entry.orderNumber)}</span>
      <span class="cell-sub">${formatDate(entry.createdAt)}</span>
    </td>
    <td>${escapeHtml(entry.shopName)}</td>
    <td><span class="cell-sub" style="margin:0">${escapeHtml(entry.productName)}</span></td>
    <td>${money(entry.grossAmount)}</td>
    <td>${money(entry.commissionAmount)}</td>
    <td><strong>${money(entry.sellerEarnings)}</strong></td>
    <td>${statusBadge(entry.status)}</td>
    <td>
      ${
        entry.payoutReference
          ? `<span class="cell-main" style="font-size:12px">${escapeHtml(entry.payoutReference)}</span>
             <span class="cell-sub">${entry.paidAt ? formatDate(entry.paidAt) : ''}</span>`
          : '<span class="tiny muted">—</span>'
      }
    </td>
  </tr>`;
}

function renderData(data) {
  const balancesHost = dash.content.querySelector('#balances-host');
  const ledgerHost = dash.content.querySelector('#ledger-host');

  renderSummary(data.totals);
  sellersById = new Map(data.sellers.map((seller) => [seller.sellerId, seller]));

  const balancesBody = data.sellers.length
    ? tableHtml(
        ['Shop', 'Gross sales', 'Commission', 'Available', 'Paid out', 'Last payout', ''],
        data.sellers.map(sellerRow)
      )
    : `<div class="table-empty">No seller earnings have been recorded yet.</div>`;

  balancesHost.innerHTML = panel({
    title: 'Seller balances',
    subtitle: 'Available earnings are settled in one payout per seller.',
    body: balancesBody
  });

  const ledgerBody = data.recent.length
    ? tableHtml(
        ['Order', 'Shop', 'Product', 'Gross', 'Commission', 'Seller earns', 'Status', 'Payout'],
        data.recent.map(ledgerRow)
      )
    : `<div class="table-empty">No commission entries match this filter.</div>`;

  ledgerHost.innerHTML = panel({
    title: 'Recent commissions',
    subtitle: `Latest ${pluralize(data.recent.length, 'entry', 'entries')} · ${
      status === 'all' ? 'all statuses' : status === 'earned' ? 'earned only' : 'paid only'
    }`,
    action: `<div id="commission-tabs">${tabsHtml(TABS, status, {
      ariaLabel: 'Filter commission entries'
    })}</div>`,
    body: ledgerBody
  });

  bindTabs(dash.content.querySelector('#commission-tabs'), (value) => {
    status = value;
    syncUrl();
    load();
  });

  balancesHost.querySelectorAll('[data-payout]').forEach((button) => {
    button.addEventListener('click', () => {
      const seller = sellersById.get(Number(button.dataset.payout));
      if (seller) openPayout(seller);
    });
  });
}

function openPayout(seller) {
  const backdrop = openModal({
    title: `Record payout · ${seller.shopName}`,
    subtitle: 'This settles all of the seller’s earned commission lines.',
    size: 'narrow',
    body: `
      <div style="background:var(--surface-soft);border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <div class="row" style="justify-content:space-between">
          <span class="tiny muted">Available balance</span>
          <strong style="font-size:18px">${money(seller.availableBalance)}</strong>
        </div>
        <div class="row" style="justify-content:space-between;margin-top:8px">
          <span class="tiny muted">Lifetime earnings</span>
          <span>${money(seller.lifetimeEarnings)}</span>
        </div>
        <div class="row" style="justify-content:space-between;margin-top:8px">
          <span class="tiny muted">Paid out before</span>
          <span>${money(seller.paidOut)}</span>
        </div>
      </div>
      <div id="payout-alert"></div>
      <form id="payout-form" style="display:grid;gap:12px">
        <div class="form-group">
          <label class="form-label" for="payout-reference">Payout reference</label>
          <input class="input" id="payout-reference" maxlength="120" required
            placeholder="e.g. M-Pesa receipt QKJ4X8LM2P">
          <span class="form-hint">M-Pesa receipt or bank transfer reference. Each reference can only be used once.</span>
        </div>
      </form>`,
    footer: `<button class="btn btn-secondary" type="button" data-close-modal>Cancel</button>
             <button class="btn btn-primary" type="button" id="payout-submit">
               Record ${money(seller.availableBalance)} payout
             </button>`,
    onMount(modal) {
      const form = modal.querySelector('#payout-form');
      const input = modal.querySelector('#payout-reference');
      const alertHost = modal.querySelector('#payout-alert');
      const submit = modal.querySelector('#payout-submit');

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submit.click();
      });

      submit.addEventListener('click', async () => {
        const reference = input.value.trim();
        alertHost.innerHTML = '';
        input.classList.remove('invalid');

        if (reference.length < 3) {
          input.classList.add('invalid');
          alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
            ${icon('alert-circle', { size: 15 })}<div>Add a payout reference of at least 3 characters.</div>
          </div>`;
          input.focus();
          return;
        }

        setButtonLoading(submit, true, 'Recording…');
        try {
          const result = await api.post('/admin/payouts', {
            sellerId: seller.sellerId,
            reference
          });
          closeModal();
          toast(result.message);
          await load();
        } catch (error) {
          setButtonLoading(submit, false);
          alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
            ${icon('alert-circle', { size: 15 })}<div>${escapeHtml(errorMessage(error))}</div>
          </div>`;
        }
      });
    }
  });

  backdrop.querySelector('#payout-reference')?.focus();
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const balancesHost = dash.content.querySelector('#balances-host');
  if (balancesHost) balancesHost.innerHTML = pageLoader();

  try {
    const data = await api.get(
      `/admin/commissions${queryString({ status: status === 'all' ? undefined : status })}`
    );
    renderData(data);
  } catch (error) {
    if (balancesHost) {
      balancesHost.innerHTML = errorState(errorMessage(error));
      balancesHost.querySelector('[data-retry]')?.addEventListener('click', load);
    }
  } finally {
    loading = false;
  }
}

async function init() {
  dash = await initDashboard({
    role: 'admin',
    active: '/admin/commissions',
    title: 'Commissions & payouts',
    subtitle: 'Track platform commission and settle seller earnings.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/settings">Commission settings</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
