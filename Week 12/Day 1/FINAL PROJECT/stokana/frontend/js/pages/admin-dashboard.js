import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { barChart, pageLoader, errorState, errorMessage } from '../ui.js';
import { statGrid, panel, tableHtml } from '../dashboard-ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  statusBadge,
  pluralize
} from '../format.js';

function recentOrdersBody(orders) {
  if (!orders.length) return '<div class="table-empty">No orders have been placed yet.</div>';
  return tableHtml(
    ['Order', 'Buyer', 'Items', 'Payment', 'Status', 'Total'],
    orders.map(
      (order) => `<tr>
        <td>
          <span class="cell-main">${escapeHtml(order.orderNumber)}</span>
          <span class="cell-sub">${formatDate(order.createdAt)}</span>
        </td>
        <td>${escapeHtml(order.buyerName)}</td>
        <td>${pluralize(order.itemCount, 'item')}</td>
        <td>${statusBadge(order.paymentStatus)}</td>
        <td>${statusBadge(order.status)}</td>
        <td class="cell-main">${money(order.total)}</td>
      </tr>`
    )
  );
}

function topSellersBody(sellers) {
  if (!sellers.length) {
    return '<div class="card-body"><p class="tiny muted" style="margin:0">No seller sales yet.</p></div>';
  }
  return `<div class="card-body">
    <div class="top-list">
      ${sellers
        .map(
          (seller, index) => `<a class="top-list-row" style="color:inherit" href="/shop/${encodeURIComponent(
            seller.shopSlug
          )}" target="_blank" rel="noopener">
            <span class="rank">${index + 1}</span>
            <div class="grow">
              <strong>${escapeHtml(seller.shopName)}</strong>
              <span>${pluralize(seller.orders, 'order')} · ${money(seller.commission, { compact: true })} commission</span>
            </div>
            <span class="amount">${money(seller.grossSales, { compact: true })}</span>
          </a>`
        )
        .join('')}
    </div>
  </div>`;
}

function render(dash, data) {
  const { counts, revenue, recentOrders, topSellers, monthlyRevenue } = data;
  const pendingTotal = Number(counts.pendingSellers) + Number(counts.pendingProducts);
  const commissionTotal = monthlyRevenue.reduce((sum, row) => sum + Number(row.commission || 0), 0);

  dash.content.innerHTML = `
    ${
      pendingTotal > 0
        ? `<div class="alert warning" style="margin-bottom:16px">
            ${icon('alert-circle', { size: 18 })}
            <div><strong>${pendingTotal} item${pendingTotal === 1 ? '' : 's'} waiting for review.</strong>
              ${counts.pendingSellers} seller application${Number(counts.pendingSellers) === 1 ? '' : 's'} and
              ${counts.pendingProducts} product${Number(counts.pendingProducts) === 1 ? '' : 's'} need a decision.
              <a href="/admin/sellers">Review sellers</a> or <a href="/admin/products">review products</a>.</div>
          </div>`
        : ''
    }

    ${statGrid([
      {
        label: 'Gross revenue',
        value: money(revenue.grossRevenue, { compact: true }),
        iconName: 'trending-up',
        tone: 'green',
        foot: `${pluralize(counts.paidOrders, 'paid order')}`
      },
      {
        label: 'Commission earned',
        value: money(revenue.commissionEarned, { compact: true }),
        iconName: 'building',
        tone: '',
        foot: `${money(revenue.paidOut, { compact: true })} paid out to sellers`
      },
      {
        label: 'Pending payouts',
        value: money(revenue.pendingPayouts, { compact: true }),
        iconName: 'wallet',
        tone: 'amber',
        foot: '<a href="/admin/commissions">Open commissions →</a>'
      },
      {
        label: 'Marketplace accounts',
        value: String(counts.buyers + counts.sellers),
        iconName: 'users',
        tone: 'purple',
        foot: `${counts.buyers} buyers · ${counts.sellers} sellers`
      }
    ])}

    <div class="dash-grid-2 dash-section">
      ${panel({
        title: 'Revenue trend',
        subtitle: 'Paid orders over the last six months.',
        action: '<a class="btn btn-secondary btn-sm" href="/admin/reports">Open reports</a>',
        body: `<div class="card-body">${barChart(monthlyRevenue, { valueKey: 'revenue' })}</div>`,
        footer: `<span>Commission ${money(commissionTotal, { compact: true })}</span>
          <span class="muted">·</span>
          <span>${pluralize(counts.totalOrders, 'order')} all time</span>`
      })}
      ${panel({
        title: 'Operational queues',
        subtitle: 'Where attention is needed across the marketplace.',
        body: `<div class="card-body">
          <div class="status-list">
            <div class="status-row">
              <div class="grow"><strong>Seller applications</strong><span>Waiting for approval</span></div>
              <span class="count">${counts.pendingSellers}</span>
            </div>
            <div class="status-row">
              <div class="grow"><strong>Product submissions</strong><span>Waiting for review</span></div>
              <span class="count">${counts.pendingProducts}</span>
            </div>
            <div class="status-row">
              <div class="grow"><strong>Unpaid orders</strong><span>Checkout started, payment pending</span></div>
              <span class="count">${counts.unpaidOrders}</span>
            </div>
            <div class="status-row">
              <div class="grow"><strong>Live products</strong><span>Approved and visible to buyers</span></div>
              <span class="count">${counts.liveProducts}</span>
            </div>
          </div>
          <div class="quick-actions" style="margin-top:18px">
            <a class="quick-action" href="/admin/sellers">${icon('shield-check', { size: 17 })} Seller approvals</a>
            <a class="quick-action" href="/admin/products">${icon('package', { size: 17 })} Product approvals</a>
            <a class="quick-action" href="/admin/orders">${icon('list', { size: 17 })} Manage orders</a>
            <a class="quick-action" href="/admin/categories">${icon('tags', { size: 17 })} Categories</a>
          </div>
        </div>`
      })}
    </div>

    <div class="dash-grid-2 dash-section">
      ${panel({
        title: 'Recent orders',
        subtitle: 'The latest checkout activity across all sellers.',
        action: '<a class="btn btn-secondary btn-sm" href="/admin/orders">All orders</a>',
        body: recentOrdersBody(recentOrders)
      })}
      ${panel({
        title: 'Top sellers',
        subtitle: 'By gross sales recorded on commissions.',
        action: '<a class="btn btn-secondary btn-sm" href="/admin/commissions">Commissions</a>',
        body: topSellersBody(topSellers)
      })}
    </div>`;
}

async function init() {
  const dash = await initDashboard({
    role: 'admin',
    active: '/admin',
    title: 'Marketplace overview',
    subtitle: 'Approvals, revenue and operations at a glance.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/reports">View reports</a>'
  });
  if (!dash) return;

  dash.content.innerHTML = pageLoader();
  try {
    const data = await api.get('/admin/overview');
    render(dash, data);
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
