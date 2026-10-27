import { api, queryString } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { panel, statGrid } from '../dashboard-ui.js';
import { barChart, pageLoader, errorState, toast, errorMessage } from '../ui.js';
import { escapeHtml, money, formatDate, pluralize, plainNumber } from '../format.js';

const MAX_BARS = 20;

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const params = new URLSearchParams(window.location.search);
let from = isIsoDate(params.get('from')) ? params.get('from') : isoDaysAgo(29);
let to = isIsoDate(params.get('to')) ? params.get('to') : isoToday();
let dash = null;
let loading = false;

function syncUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  window.history.replaceState({}, '', url);
}

function shortDay(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function chartSeries(daily) {
  if (daily.length <= MAX_BARS) {
    return daily.map((row) => ({ label: shortDay(row.day), gross: Number(row.gross) || 0 }));
  }

  const bucketSize = Math.ceil(daily.length / MAX_BARS);
  const buckets = [];
  for (let index = 0; index < daily.length; index += bucketSize) {
    const slice = daily.slice(index, index + bucketSize);
    buckets.push({
      label: shortDay(slice[0].day),
      gross: slice.reduce((sum, row) => sum + (Number(row.gross) || 0), 0)
    });
  }
  return buckets;
}

function topList(rows, renderRow, emptyText) {
  if (!rows.length) {
    return `<div class="card-body"><p class="tiny muted" style="margin:0">${escapeHtml(
      emptyText
    )}</p></div>`;
  }
  return `<div class="card-body">
    <div class="top-list">
      ${rows.map((row, index) => renderRow(row, index)).join('')}
    </div>
  </div>`;
}

function renderShell() {
  dash.content.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-body">
        <form id="reports-filter" class="table-toolbar" style="margin:0;padding:0;border:0;align-items:flex-end">
          <div class="toolbar-filters">
            <div>
              <label class="form-label" for="report-from">From</label>
              <input class="input" type="date" id="report-from" name="from" value="${escapeHtml(from)}" required>
            </div>
            <div>
              <label class="form-label" for="report-to">To</label>
              <input class="input" type="date" id="report-to" name="to" value="${escapeHtml(to)}" required>
            </div>
            <button class="btn btn-primary btn-sm" type="submit" style="margin-bottom:1px">
              ${icon('filter', { size: 15 })} Apply range
            </button>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-ghost btn-sm" type="button" data-range="7">7 days</button>
            <button class="btn btn-ghost btn-sm" type="button" data-range="30">30 days</button>
            <button class="btn btn-ghost btn-sm" type="button" data-range="90">90 days</button>
          </div>
        </form>
      </div>
    </div>
    <div id="reports-host">${pageLoader()}</div>`;

  const form = dash.content.querySelector('#reports-filter');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyRange(
      dash.content.querySelector('#report-from').value,
      dash.content.querySelector('#report-to').value
    );
  });

  dash.content.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
      const days = Number(button.dataset.range);
      dash.content.querySelector('#report-from').value = isoDaysAgo(days - 1);
      dash.content.querySelector('#report-to').value = isoToday();
      form.requestSubmit();
    });
  });
}

function applyRange(nextFrom, nextTo) {
  if (!isIsoDate(nextFrom) || !isIsoDate(nextTo)) {
    toast('Choose both a start and end date.', 'error');
    return;
  }
  if (nextFrom > nextTo) {
    toast('The start date must be on or before the end date.', 'error');
    return;
  }
  from = nextFrom;
  to = nextTo;
  syncUrl();
  load();
}

function render(data) {
  const host = dash.content.querySelector('#reports-host');
  const { summary, daily, topProducts, topSellers, topCategories } = data;

  from = data.range.from;
  to = data.range.to;
  dash.content.querySelector('#report-from').value = from;
  dash.content.querySelector('#report-to').value = to;

  const chart = barChart(chartSeries(daily), {
    valueKey: 'gross',
    formatter: (value) => money(value, { compact: true })
  });

  host.innerHTML = `
    ${statGrid([
      {
        label: 'Paid orders',
        value: plainNumber(summary.orders),
        iconName: 'shopping-bag',
        foot: 'Orders paid in this period'
      },
      {
        label: 'Gross sales',
        value: money(summary.grossSales, { compact: true }),
        iconName: 'trending-up',
        tone: 'blue',
        foot: `${money(summary.sellerEarnings, { compact: true })} paid to sellers`
      },
      {
        label: 'Commission earned',
        value: money(summary.commission, { compact: true }),
        iconName: 'wallet',
        tone: 'green',
        foot: 'Platform revenue'
      },
      {
        label: 'Average order value',
        value: money(summary.averageOrderValue),
        iconName: 'chart',
        foot: 'Per paid order'
      }
    ])}

    <div style="margin-top:16px">
      ${panel({
        title: 'Daily paid sales',
        subtitle: `${formatDate(`${from}T00:00:00`)} – ${formatDate(
          `${to}T00:00:00`
        )} · ${pluralize(summary.orders, 'paid order')}`,
        body: `<div class="card-body">${chart}</div>`
      })}
    </div>

    <div class="admin-report-grid" style="margin-top:16px">
      ${panel({
        title: 'Top shops',
        subtitle: 'By sales value in this period',
        body: topList(
          topSellers,
          (seller, index) => `<a class="top-list-row" style="color:inherit"
            href="/shop/${encodeURIComponent(seller.shopSlug)}" target="_blank" rel="noopener">
            <span class="rank">${index + 1}</span>
            <div class="grow">
              <strong>${escapeHtml(seller.shopName)}</strong>
              <span>${pluralize(seller.orders, 'order')} · ${money(seller.commission, {
                compact: true
              })} commission</span>
            </div>
            <span class="amount">${money(seller.revenue, { compact: true })}</span>
          </a>`,
          'No shop sales in this period.'
        )
      })}

      <div class="list-stack">
        ${panel({
          title: 'Top products',
          subtitle: 'Best sellers by revenue',
          body: topList(
            topProducts,
            (product, index) => `<div class="top-list-row">
              <span class="rank">${index + 1}</span>
              <div class="grow">
                <strong>${escapeHtml(product.productName)}</strong>
                <span>${pluralize(product.units, 'unit')} sold</span>
              </div>
              <span class="amount">${money(product.revenue, { compact: true })}</span>
            </div>`,
            'No product sales in this period.'
          )
        })}
        ${panel({
          title: 'Top categories',
          subtitle: 'Demand by department',
          body: topList(
            topCategories,
            (category, index) => `<div class="top-list-row">
              <span class="rank">${index + 1}</span>
              <div class="grow">
                <strong>${escapeHtml(category.categoryName)}</strong>
                <span>${pluralize(category.units, 'unit')} sold</span>
              </div>
              <span class="amount">${money(category.revenue, { compact: true })}</span>
            </div>`,
            'No category sales in this period.'
          )
        })}
      </div>
    </div>`;
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#reports-host');
  if (host) host.innerHTML = pageLoader();

  try {
    const data = await api.get(`/admin/reports${queryString({ from, to })}`);
    render(data);
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
    active: '/admin/reports',
    title: 'Reports',
    subtitle: 'Revenue, commissions and demand for any period.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/commissions">Seller payouts</a>'
  });
  if (!dash) return;

  syncUrl();
  renderShell();
  await load();
}

init();
