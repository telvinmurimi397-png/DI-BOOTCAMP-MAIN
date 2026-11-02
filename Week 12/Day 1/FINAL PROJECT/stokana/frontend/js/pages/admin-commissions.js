import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { attachPagination, bindTabs, panel, statGrid, tableHtml, tabsHtml } from '../dashboard-ui.js';
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
const PAYMENT_TABS = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
];

const params = new URLSearchParams(window.location.search);
let status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'all';
let paymentStatus = PAYMENT_TABS.some((tab) => tab.value === params.get('paymentStatus'))
  ? params.get('paymentStatus')
  : 'all';
let paymentPage = Math.max(1, Number(params.get('paymentPage')) || 1);
let dash = null;
let loading = false;
let sellersById = new Map();

function syncUrl() {
  const url = new URL(window.location.href);
  if (status === 'all') url.searchParams.delete('status');
  else url.searchParams.set('status', status);
  if (paymentStatus === 'all') url.searchParams.delete('paymentStatus');
  else url.searchParams.set('paymentStatus', paymentStatus);
  if (paymentPage === 1) url.searchParams.delete('paymentPage');
  else url.searchParams.set('paymentPage', String(paymentPage));
  window.history.replaceState({}, '', url);
}

function paymentRow(payment) {
  const reference = payment.transactionRef || payment.providerRef;
  const secondaryReference = payment.transactionRef && payment.providerRef !== payment.transactionRef
    ? `<span class="cell-sub">Request: ${escapeHtml(payment.providerRef)}</span>`
    : '';
  return `<tr>
    <td>
      <a class="cell-main" href="/admin/orders?q=${encodeURIComponent(payment.orderNumber)}">${escapeHtml(payment.orderNumber)}</a>
      <span class="cell-sub">${formatDate(payment.createdAt)}</span>
    </td>
    <td>
      <span class="cell-main">${escapeHtml(payment.buyerName)}</span>
      <span class="cell-sub">${escapeHtml(payment.buyerEmail)}</span>
    </td>
    <td>
      <span class="cell-main">${payment.provider === 'mpesa' ? 'M-Pesa' : 'Test simulator'}</span>
    </td>
    <td>
      <span class="cell-main">${escapeHtml(reference || 'No provider reference')}</span>
      ${secondaryReference}
    </td>
    <td>${money(payment.amount)}</td>
    <td>
      ${money(payment.orderTotal)}
      <span class="cell-sub">Commission lines: ${payment.commissionCount}/${payment.itemCount}</span>
    </td>
    <td>${statusBadge(payment.status)}</td>
    <td>${statusBadge(payment.reconciliationStatus)}</td>
    <td>${Number(payment.refundedAmount) > 0
      ? `${money(payment.refundedAmount)}<span class="cell-sub">${escapeHtml(payment.refundReferences)}</span>`
      : '<span class="tiny muted">—</span>'}</td>
  </tr>`;
}

function renderPayments(data) {
  const host = dash.content.querySelector('#payment-reconciliation-host');
  const { summary, payments, pagination } = data;
  const table = payments.length
    ? tableHtml(
        ['Order', 'Buyer', 'Provider', 'M-Pesa receipt / request', 'Paid', 'Order total', 'Payment', 'Reconciliation', 'Refunded'],
        payments.map(paymentRow)
      )
    : '<div class="table-empty">No M-Pesa payment attempts match this filter.</div>';
  host.innerHTML = `
    ${statGrid([
      { label: 'Successful payments', value: summary.successful, iconName: 'check-circle', tone: 'green' },
      { label: 'Pending payments', value: summary.pending, iconName: 'clock', tone: 'amber' },
      { label: 'Failed attempts', value: summary.failed, iconName: 'alert-circle', tone: 'red' },
      { label: 'Reconciliation issues', value: summary.paymentMismatches, iconName: 'alert-circle', tone: 'red' },
      { label: 'Paid orders missing payment', value: summary.paidOrdersWithoutPayment, iconName: 'alert-circle', tone: 'amber' },
      { label: 'Refunded', value: money(summary.refundedAmount), iconName: 'wallet', tone: 'blue' }
    ])}
    <div style="margin-top:16px">
      ${panel({
        title: 'M-Pesa transaction reconciliation',
        subtitle: 'Verified Daraja receipts are matched against paid order totals and commission records.',
        action: `<div id="payment-tabs">${tabsHtml(PAYMENT_TABS, paymentStatus, {
          ariaLabel: 'Filter M-Pesa payment attempts'
        })}</div>`,
        body: table,
        footer: '<div id="payment-pagination" style="padding:0"></div>'
      })}
    </div>`;
  bindTabs(host.querySelector('#payment-tabs'), (value) => {
    paymentStatus = value;
    paymentPage = 1;
    syncUrl();
    load();
  });
  attachPagination(host.querySelector('#payment-pagination'), pagination, (next) => {
    paymentPage = next;
    syncUrl();
    load();
  });
}

function renderShell() {
  dash.content.innerHTML = `
    <div id="payment-reconciliation-host"></div>
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
          <span class="form-hint">Enter the M-Pesa payout receipt. Each reference can only be used once.</span>
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
    const [data, payments] = await Promise.all([
      api.get(`/admin/commissions${queryString({ status: status === 'all' ? undefined : status })}`),
      api.get(`/admin/payments${queryString({
        status: paymentStatus === 'all' ? undefined : paymentStatus,
        page: paymentPage,
        limit: 30
      })}`)
    ]);
    renderData(data);
    renderPayments(payments);
  } catch (error) {
    if (balancesHost) {
      balancesHost.innerHTML = errorState(errorMessage(error));
      balancesHost.querySelector('[data-retry]')?.addEventListener('click', load);
    }
    const paymentHost = dash.content.querySelector('#payment-reconciliation-host');
    if (paymentHost) paymentHost.innerHTML = errorState(errorMessage(error));
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
