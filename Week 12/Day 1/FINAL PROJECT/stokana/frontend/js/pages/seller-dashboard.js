import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { barChart, errorState, pageLoader, stars, errorMessage } from '../ui.js';
import { statGrid, panel, tableHtml } from '../dashboard-ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  statusBadge,
  pluralize
} from '../format.js';

function salesFoot(monthly) {
  const gross = monthly.reduce((sum, row) => sum + Number(row.gross || 0), 0);
  const commission = monthly.reduce((sum, row) => sum + Number(row.commission || 0), 0);
  return `<span>Gross ${money(gross, { compact: true })}</span>
    <span class="muted">·</span>
    <span>Commission ${money(commission, { compact: true })}</span>`;
}

function recentOrdersBody(orders) {
  if (!orders.length) {
    return `<div class="table-empty">No paid orders yet. When a buyer checks out, their order appears here.</div>`;
  }
  return tableHtml(
    ['Order', 'Buyer', 'Items', 'Status', 'Your total'],
    orders.map(
      (order) => `<tr>
        <td>
          <span class="cell-main">${escapeHtml(order.orderNumber)}</span>
          <span class="cell-sub">${formatDate(order.createdAt)}</span>
        </td>
        <td>
          <span class="cell-main">${escapeHtml(order.shippingName)}</span>
          <span class="cell-sub">${escapeHtml(order.shippingTown || order.shippingCounty || 'Kenya')}</span>
        </td>
        <td>${pluralize(order.items.length, 'line')}</td>
        <td>${statusBadge(order.status)}</td>
        <td class="cell-main">${money(order.sellerSubtotal)}</td>
      </tr>`
    )
  );
}

function lowStockBody(products) {
  if (!products.length) {
    return `<div class="card-body"><p class="tiny muted" style="margin:0">Every approved product has more than five units in stock.</p></div>`;
  }
  return `<div class="card-body" style="padding-top:6px;padding-bottom:10px">
    ${products
      .map(
        (product) => `<a class="low-stock-item" href="/seller/products/edit?id=${product.id}">
          <div class="grow">
            <strong>${escapeHtml(product.name)}</strong>
            <span>${money(product.price)}</span>
          </div>
          <span class="badge ${Number(product.stock) === 0 ? 'red' : 'amber'}" style="font-size:10px">
            ${Number(product.stock) === 0 ? 'Sold out' : `${Number(product.stock)} left`}
          </span>
        </a>`
      )
      .join('')}
  </div>`;
}

function reviewsBody(reviews) {
  if (!reviews.length) {
    return `<div class="card-body"><p class="tiny muted" style="margin:0">You have not received any reviews yet. Deliver great orders to earn your first one.</p></div>`;
  }
  return `<div class="card-body" style="padding-top:6px;padding-bottom:10px">
    <div class="mini-list">
      ${reviews
        .map(
          (review) => `<div class="mini-row" style="align-items:flex-start">
            <div class="grow">
              <strong>${escapeHtml(review.title || `Review from ${review.buyerName}`)}</strong>
              <span>${escapeHtml(review.buyerName)} · ${formatDate(review.createdAt)}</span>
              <div style="margin-top:5px">${stars(review.rating, { size: 11 })}</div>
              ${
                review.comment
                  ? `<p class="tiny muted" style="margin:6px 0 0;line-height:1.6">${escapeHtml(review.comment)}</p>`
                  : ''
              }
            </div>
          </div>`
        )
        .join('')}
    </div>
  </div>`;
}

function render(dash, data) {
  const { products, earnings, sales, monthlySales, recentOrders, lowStockProducts, unreadMessages, recentReviews } = data;
  const available = money(earnings.availableBalance);

  dash.content.innerHTML = `
    <div class="alert success" style="margin-bottom:16px">
      ${icon('wallet', { size: 18 })}
      <div><strong>${available} available to pay out.</strong>
      Platform commission on your sales totals ${money(earnings.commissionTotal)}. Payouts are recorded by the STOKANA team.</div>
    </div>

    ${statGrid([
      {
        label: 'Available balance',
        value: available,
        iconName: 'wallet',
        tone: 'green',
        foot: `${money(earnings.paidOut, { compact: true })} paid out · ${money(earnings.lifetimeEarnings, { compact: true })} earned`
      },
      {
        label: 'Gross sales',
        value: money(earnings.grossSales, { compact: true }),
        iconName: 'trending-up',
        tone: '',
        foot: `${sales.paidOrders} paid ${sales.paidOrders === 1 ? 'order' : 'orders'} · ${pluralize(sales.unitsSold, 'unit')}`
      },
      {
        label: 'Live products',
        value: String(products.active),
        iconName: 'package',
        tone: 'purple',
        foot: `${products.pending} awaiting review · ${products.rejected} rejected`
      },
      {
        label: 'Unread messages',
        value: String(unreadMessages),
        iconName: 'message',
        tone: unreadMessages > 0 ? 'amber' : '',
        foot: unreadMessages > 0
          ? '<a href="/seller/messages">Reply to buyers</a>'
          : 'You are all caught up'
      }
    ])}

    <div class="dash-grid-2 dash-section">
      ${panel({
        title: 'Sales performance',
        subtitle: 'Gross sales recorded over the last six calendar months.',
        action: '<a class="btn btn-secondary btn-sm" href="/seller/sales">Sales &amp; payouts</a>',
        body: `<div class="card-body">${barChart(monthlySales, { valueKey: 'gross' })}</div>`,
        footer: salesFoot(monthlySales)
      })}
      ${panel({
        title: 'Store health',
        subtitle: 'The items that need your attention right now.',
        body: `<div class="card-body">
          <div class="status-list">
            <div class="status-row">
              <div class="grow"><strong>Products awaiting review</strong><span>Admin approval before they go live</span></div>
              <span class="count">${products.pending}</span>
            </div>
            <div class="status-row">
              <div class="grow"><strong>Low stock</strong><span>Approved products with 5 units or fewer</span></div>
              <span class="count">${products.lowStockCount}</span>
            </div>
            <div class="status-row">
              <div class="grow"><strong>Unread messages</strong><span>Buyers waiting for a reply</span></div>
              <span class="count">${unreadMessages}</span>
            </div>
          </div>
          <div class="quick-actions" style="margin-top:18px">
            <a class="quick-action" href="/seller/products/new">${icon('plus', { size: 17 })} Add a product</a>
            <a class="quick-action" href="/seller/orders">${icon('truck', { size: 17 })} Fulfil orders</a>
            <a class="quick-action" href="/seller/products">${icon('package', { size: 17 })} Manage stock</a>
            <a class="quick-action" href="/seller/shop">${icon('store', { size: 17 })} Edit shop</a>
          </div>
        </div>`
      })}
    </div>

    <div class="dash-section">
      ${panel({
        title: 'Recent orders',
        subtitle: 'The latest paid orders that include your products.',
        action: '<a class="btn btn-secondary btn-sm" href="/seller/orders">View all orders</a>',
        body: recentOrdersBody(recentOrders)
      })}
    </div>

    <div class="dash-grid-2 equal dash-section">
      ${panel({
        title: 'Low stock',
        subtitle: 'Restock these products to stay visible at checkout.',
        action: '<a class="btn btn-secondary btn-sm" href="/seller/products">Inventory</a>',
        body: lowStockBody(lowStockProducts)
      })}
      ${panel({
        title: 'Latest reviews',
        subtitle: 'What buyers say after receiving your products.',
        body: reviewsBody(recentReviews)
      })}
    </div>`;
}

async function init() {
  const dash = await initDashboard({
    role: 'seller',
    active: '/seller',
    title: 'Store overview',
    subtitle: 'Track sales, stock and buyer conversations in one place.',
    actions: `<a class="btn btn-primary btn-sm" href="/seller/products/new">${icon('plus', { size: 15 })} Add a product</a>`
  });
  if (!dash) return;

  dash.content.innerHTML = pageLoader();
  try {
    const data = await api.get('/seller/overview');
    render(dash, data);
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
