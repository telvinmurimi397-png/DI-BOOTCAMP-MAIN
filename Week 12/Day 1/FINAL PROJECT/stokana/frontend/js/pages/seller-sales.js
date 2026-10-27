import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { barChart, pageLoader, errorState, errorMessage } from '../ui.js';
import { statGrid, panel, tableHtml, tabsHtml, bindTabs, attachPagination } from '../dashboard-ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  statusBadge,
  pluralize
} from '../format.js';

let dash = null;
let sales = null;
let filter = 'all';
let tablePage = 1;
const PAGE_SIZE = 12;

function commissionRow(row) {
  return `<tr>
    <td><span class="cell-sub" style="margin:0">${formatDate(row.createdAt)}</span></td>
    <td>
      <span class="cell-main">${escapeHtml(row.orderNumber)}</span>
      <span class="cell-sub">${escapeHtml(row.productName)} × ${Number(row.quantity)}</span>
    </td>
    <td>${money(row.grossAmount)}</td>
    <td>− ${money(row.commissionAmount)}</td>
    <td class="cell-main">${money(row.sellerEarnings)}</td>
    <td>${statusBadge(row.status)}</td>
    <td>
      ${
        row.status === 'paid'
          ? `<span class="cell-main">${escapeHtml(row.payoutReference || 'Paid')}</span>
             <span class="cell-sub">${formatDate(row.paidAt)}</span>`
          : '<span class="cell-sub" style="margin:0">Not paid out</span>'
      }
    </td>
  </tr>`;
}

function renderTable() {
  const host = dash.content.querySelector('#commissions-table');
  const paginationHost = dash.content.querySelector('#commissions-pagination');
  if (!host || !sales) return;

  const rows = sales.commissions.filter((row) => filter === 'all' || row.status === filter);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (tablePage > totalPages) tablePage = totalPages;
  const start = (tablePage - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  if (!rows.length) {
    host.innerHTML = `<div class="table-empty">No ${filter === 'all' ? '' : filter} commission entries yet.</div>`;
    paginationHost.innerHTML = '';
    return;
  }

  host.innerHTML = tableHtml(
    ['Date', 'Order', 'Gross', 'Commission', 'Your earnings', 'Status', 'Payout'],
    visible.map(commissionRow)
  );

  attachPagination(
    paginationHost,
    { page: tablePage, totalPages, total: rows.length, limit: PAGE_SIZE },
    (next) => {
      tablePage = next;
      renderTable();
    }
  );
}

function render(data) {
  sales = data;
  const { summary, monthlySales } = data;
  const monthlyEarned = monthlySales.reduce((sum, row) => sum + Number(row.earnings || 0), 0);

  dash.content.innerHTML = `
    ${statGrid([
      {
        label: 'Available balance',
        value: money(summary.availableBalance),
        iconName: 'wallet',
        tone: 'green',
        foot: 'Earned and waiting for payout'
      },
      {
        label: 'Lifetime earnings',
        value: money(summary.lifetimeEarnings, { compact: true }),
        iconName: 'trending-up',
        tone: '',
        foot: `${money(summary.paidOut, { compact: true })} paid out to date`
      },
      {
        label: 'Gross sales',
        value: money(summary.grossSales, { compact: true }),
        iconName: 'chart',
        tone: 'purple',
        foot: `${pluralize(summary.saleLines, 'sale line')}`
      },
      {
        label: 'Platform commission',
        value: money(summary.commissionTotal, { compact: true }),
        iconName: 'building',
        tone: 'amber',
        foot: 'Deducted automatically at payment'
      }
    ])}

    <div class="payout-banner dash-section">
      <div>
        <strong>Available for payout</strong>
        <div class="amount">${money(summary.availableBalance)}</div>
        <span style="font-size:11px;color:#a9c2e8">${money(monthlyEarned, {
          compact: true
        })} earned in the last six months</span>
      </div>
      <a class="btn" href="/help">How payouts work ${icon('arrow-right', { size: 15 })}</a>
    </div>

    <div class="dash-grid-2 dash-section">
      ${panel({
        title: 'Monthly sales',
        subtitle: 'Gross sales and your earnings over the last six months.',
        body: `<div class="card-body">${barChart(monthlySales, { valueKey: 'gross' })}</div>`,
        footer: `<span>Gross ${money(
          monthlySales.reduce((sum, row) => sum + Number(row.gross || 0), 0),
          { compact: true }
        )}</span><span class="muted">·</span><span>Earnings ${money(monthlyEarned, { compact: true })}</span>`
      })}
      ${panel({
        title: 'Payout schedule',
        subtitle: 'How money moves from a sale to your account.',
        body: `<div class="card-body">
          <div class="status-list">
            <div class="status-row">
              <div class="grow"><strong>1. Buyer pays</strong><span>Commission is calculated per item at checkout.</span></div>
              ${icon('credit-card', { size: 17, className: 'muted' })}
            </div>
            <div class="status-row">
              <div class="grow"><strong>2. Earnings credited</strong><span>Your share becomes available immediately after payment.</span></div>
              ${icon('wallet', { size: 17, className: 'muted' })}
            </div>
            <div class="status-row">
              <div class="grow"><strong>3. Admin records payout</strong><span>STOKANA pays out and records the reference on each sale.</span></div>
              ${icon('check-circle', { size: 17, className: 'muted' })}
            </div>
          </div>
          <div class="settings-note" style="margin-top:16px">
            ${icon('info', { size: 16 })}
            <span>Contact <a href="mailto:hello@stokana.co.ke">hello@stokana.co.ke</a> if your available balance has not changed after a completed payout.</span>
          </div>
        </div>`
      })}
    </div>

    <div class="dash-section">
      ${panel({
        title: 'Commission history',
        subtitle: 'Every sale line, the commission taken and your earnings.',
        action: `<div id="commission-tabs">${tabsHtml(
          [
            { value: 'all', label: 'All' },
            { value: 'earned', label: 'Earned' },
            { value: 'paid', label: 'Paid out' }
          ],
          filter,
          { ariaLabel: 'Filter commission history' }
        )}</div>`,
        body: `<div id="commissions-table"></div>`,
        footer: '<div id="commissions-pagination" style="padding:0"></div>'
      })}
    </div>`;

  bindTabs(dash.content.querySelector('#commission-tabs'), (value) => {
    filter = value;
    tablePage = 1;
    renderTable();
  });
  renderTable();
}

async function init() {
  dash = await initDashboard({
    role: 'seller',
    active: '/seller/sales',
    title: 'Sales & payouts',
    subtitle: 'See what you earned, what STOKANA keeps and what has been paid out.',
    actions: '<a class="btn btn-secondary btn-sm" href="/seller/orders">View orders</a>'
  });
  if (!dash) return;

  dash.content.innerHTML = pageLoader();
  try {
    const data = await api.get('/seller/sales');
    render(data);
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
