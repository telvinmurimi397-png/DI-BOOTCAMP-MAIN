import { img } from './ui.js';
import { icon } from './icons.js';
import { money, escapeHtml, formatDate, statusBadge, pluralize } from './format.js';

export function buyerOrderCard(order) {
  const awaitingPayment = order.status === 'pending_payment' && order.paymentStatus !== 'paid';
  const shipmentCount = Array.isArray(order.shipmentStatuses) ? order.shipmentStatuses.length : 0;

  return `<article class="order-card">
    <header class="order-card-head">
      <div>
        <strong>${escapeHtml(order.orderNumber)}</strong>
        <div class="tiny muted" style="margin-top:2px">Placed ${formatDate(order.createdAt)}</div>
      </div>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        ${statusBadge(order.status, { dot: true })}
        ${
          awaitingPayment
            ? '<span class="badge amber">Payment due</span>'
            : order.paymentStatus
            ? statusBadge(order.paymentStatus)
            : ''
        }
      </div>
    </header>
    <div class="order-card-body">
      <div class="order-preview" style="padding:14px 0">
        ${img(order.previewImage, 'Order preview', 'width="58" height="58"')}
        <div class="grow">
          <strong style="display:block;font-size:13px">${pluralize(
            order.itemCount,
            'item'
          )} · ${pluralize(order.unitCount, 'unit')}</strong>
          <span class="tiny muted">${shipmentCount ? `${pluralize(shipmentCount, 'shipment')} created` : 'Preparing for dispatch'}</span>
        </div>
        <div class="order-line-total">${money(order.total)}</div>
      </div>
    </div>
    <footer class="order-card-foot">
      <span class="tiny muted">${
        order.payment?.providerRef
          ? `Payment ${escapeHtml(order.payment.providerRef)}`
          : awaitingPayment
          ? 'Complete payment to start fulfilment'
          : 'No successful payment yet'
      }</span>
      <div class="row" style="gap:8px">
        ${
          awaitingPayment
            ? `<a class="btn btn-primary btn-sm" href="/account/order?order=${encodeURIComponent(order.orderNumber)}">Pay now</a>`
            : ''
        }
        <a class="btn btn-secondary btn-sm" href="/account/order?order=${encodeURIComponent(order.orderNumber)}">
          View details ${icon('arrow-right', { size: 14 })}
        </a>
      </div>
    </footer>
  </article>`;
}
