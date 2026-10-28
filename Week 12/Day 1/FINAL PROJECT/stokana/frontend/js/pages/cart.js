import { mountSite, refreshCartBadge } from '../layout.js';
import { api } from '../api.js';
import { requireUser } from '../auth.js';
import {
  img,
  toast,
  emptyState,
  errorState,
  confirmDialog,
  productCard,
  errorMessage
} from '../ui.js';
import { icon } from '../icons.js';
import { money, escapeHtml, pluralize } from '../format.js';

const subtitle = document.getElementById('cart-subtitle');
let root = document.getElementById('cart-root');

let cart = null;
let busy = false;

function freeShippingNote(summary) {
  const threshold = Number(summary.freeShippingThreshold) || 0;
  const subtotal = Number(summary.subtotal) || 0;
  if (!threshold || subtotal >= threshold) return '';
  return `<div class="cart-free-shipping" style="font-size:11.5px;color:var(--muted);background:var(--surface-soft);border-radius:8px;padding:9px 11px">
    Add <strong style="color:var(--ink)">${money(threshold - subtotal)}</strong> more for free delivery.
  </div>`;
}

function itemHtml(item) {
  const stock = Number(item.stock);
  const soldOut = stock <= 0;
  const unavailable = !item.isAvailable;

  return `
    <div class="cart-item${unavailable ? ' is-unavailable' : ''}" data-cart-item="${item.itemId}" style="${
    unavailable ? 'opacity:.72' : ''
  }">
      <a href="/product/${encodeURIComponent(item.slug)}">
        ${img(item.imageUrl, item.name, 'width="84" height="84"')}
      </a>
      <div class="cart-item-main">
        <a href="/product/${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a>
        <div class="shop">from <a href="/shop/${encodeURIComponent(item.shopSlug)}" style="display:inline;font-size:inherit;font-weight:600">${escapeHtml(
    item.shopName
  )}</a></div>
        <div class="cart-item-controls">
          <div class="qty sm" data-cart-qty>
            <button type="button" data-cart-step="-1" aria-label="Decrease quantity" ${
              item.quantity <= 1 ? 'disabled' : ''
            }>${icon('minus', { size: 14 })}</button>
            <span data-cart-qty-value>${item.quantity}</span>
            <button type="button" data-cart-step="1" aria-label="Increase quantity" ${
              soldOut || item.quantity >= stock ? 'disabled' : ''
            }>${icon('plus', { size: 14 })}</button>
          </div>
          <button class="remove-btn" type="button" data-remove-item aria-label="Remove ${escapeHtml(
            item.name
          )} from cart">${icon('trash', { size: 16 })}</button>
          <span class="muted" style="font-size:11px">${soldOut ? 'Sold out' : `${stock} in stock`}</span>
        </div>
        ${unavailable ? `<div class="cart-issue">${icon('alert-circle', { size: 12 })} ${escapeHtml(item.issue)}</div>` : ''}
      </div>
      <div class="cart-item-price">
        <strong>${money(item.lineTotal)}</strong>
        <span>${money(item.price)} each</span>
      </div>
    </div>`;
}

function renderSummary(summary) {
  return `
    <aside class="cart-summary">
      <h2>Order summary</h2>
      <div class="summary-line"><span>Subtotal (${pluralize(summary.itemCount, 'item')})</span><span>${money(
    summary.subtotal
  )}</span></div>
      <div class="summary-line"><span>Delivery</span><span>${
        Number(summary.shippingFee) === 0 ? '<span class="badge green">Free</span>' : money(summary.shippingFee)
      }</span></div>
      ${freeShippingNote(summary)}
      <div class="divider" style="margin:5px 0"></div>
      <div class="summary-line total"><span>Total</span><span>${money(summary.total)}</span></div>
      ${
        summary.canCheckout
          ? `<a class="btn btn-shopping btn-lg btn-block" href="/checkout">Proceed to checkout ${icon('arrow-right', {
              size: 16
            })}</a>`
          : `<button class="btn btn-shopping btn-lg btn-block" type="button" disabled>Proceed to checkout</button>
             <p class="form-error" style="text-align:center">Remove unavailable items to continue.</p>`
      }
      <div class="delivery-note" style="border-top:1px solid var(--line);margin-top:2px">
        <div>${icon('shield-check', { size: 14 })} Secure checkout with buyer protection</div>
        <div>${icon('truck', { size: 14 })} Delivery coordinated by each seller</div>
        <div>${icon('lock', { size: 14 })} Payment is confirmed on the server</div>
      </div>
    </aside>`;
}

function bindItems() {
  root.querySelectorAll('[data-cart-item]').forEach((row) => {
    const itemId = Number(row.dataset.cartItem);
    row.querySelectorAll('[data-cart-step]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = cart.items.find((entry) => Number(entry.itemId) === itemId);
        if (!item) return;
        const quantity = item.quantity + Number(button.dataset.cartStep);
        if (quantity < 1 || quantity > Number(item.stock)) return;
        updateQuantity(itemId, quantity);
      });
    });
    row.querySelector('[data-remove-item]')?.addEventListener('click', () => removeItem(itemId));
  });

  root.querySelector('[data-clear-cart]')?.addEventListener('click', clearCart);
}

async function updateQuantity(itemId, quantity) {
  if (busy) return;
  busy = true;
  const row = root.querySelector(`[data-cart-item="${itemId}"]`);
  row?.querySelectorAll('button').forEach((button) => (button.disabled = true));
  row?.style.setProperty('opacity', '.6');
  try {
    const data = await api.patch(`/cart/items/${itemId}`, { quantity });
    applyCart(data, { keepFocus: true });
    refreshCartBadge();
  } catch (error) {
    toast(errorMessage(error), 'error');
    render();
  } finally {
    busy = false;
  }
}

async function removeItem(itemId) {
  if (busy) return;
  const item = cart.items.find((entry) => Number(entry.itemId) === itemId);
  const confirmed = await confirmDialog({
    title: 'Remove this item?',
    message: item ? `${item.name} will be removed from your cart.` : 'This item will be removed from your cart.',
    confirmLabel: 'Remove item',
    danger: true
  });
  if (!confirmed) return;

  busy = true;
  try {
    const data = await api.delete(`/cart/items/${itemId}`);
    applyCart(data);
    refreshCartBadge();
    toast('Item removed from your cart.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    busy = false;
  }
}

async function clearCart() {
  if (busy) return;
  const confirmed = await confirmDialog({
    title: 'Clear your cart?',
    message: 'All items will be removed. You can always add them again later.',
    confirmLabel: 'Clear cart',
    danger: true
  });
  if (!confirmed) return;
  busy = true;
  try {
    const data = await api.delete('/cart');
    applyCart(data);
    refreshCartBadge();
    toast('Your cart has been cleared.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    busy = false;
  }
}

function renderEmpty() {
  subtitle.textContent = 'Your cart is waiting to be filled.';
  root.outerHTML = `<div id="cart-root">${emptyState({
    iconName: 'cart',
    title: 'Your cart is empty',
    text: 'Explore the marketplace and add products from verified Kenyan shops.',
    action: '<a class="btn btn-primary" href="/explore">Start shopping</a>'
  })}</div>`;
  root = document.getElementById('cart-root');
}

function render() {
  if (!cart || !cart.items.length) {
    renderEmpty();
    return;
  }

  root.outerHTML = `
    <div class="cart-layout" id="cart-root">
      <div class="content-card">
        <div class="row-between" style="margin-bottom:4px">
          <h2 style="font-size:18px">Items (${pluralize(cart.summary.itemCount, 'item')})</h2>
          <button class="btn btn-ghost btn-sm" type="button" data-clear-cart>Clear cart</button>
        </div>
        ${cart.summary.unavailableItemCount > 0
          ? `<div class="alert warning" style="margin:10px 0 4px">${icon(
              'alert-circle',
              { size: 16 }
            )}<div>${pluralize(cart.summary.unavailableItemCount, 'item')} in your cart ${
              cart.summary.unavailableItemCount === 1 ? 'is' : 'are'
            } unavailable and excluded from your total.</div></div>`
          : ''}
        ${cart.items.map((item) => itemHtml(item)).join('')}
      </div>
      ${renderSummary(cart.summary)}
    </div>`;

  root = document.getElementById('cart-root');
  bindItems();
}

function applyCart(data, { keepFocus = false } = {}) {
  cart = data;
  const summary = cart.summary;
  subtitle.textContent = summary.itemCount
    ? `${pluralize(summary.itemCount, 'item')} from ${pluralize(
        new Set(cart.items.map((item) => item.shopName)).size,
        'shop'
      )} — ready when you are.`
    : 'Your cart is waiting to be filled.';
  render();
  loadSuggestions();
}

let suggestionsLoaded = false;
async function loadSuggestions() {
  if (suggestionsLoaded) return;
  suggestionsLoaded = true;
  try {
    const data = await api.get('/cart/suggestions');
    const host = document.getElementById('cart-root');
    if (!host || !data.products?.length) return;
    host.insertAdjacentHTML(
      'afterend',
      `<section style="padding:8px 0 64px" id="cart-suggestions">
        <div class="section-head" style="margin-bottom:18px">
          <div>
            <span class="eyebrow">Popular right now</span>
            <h2 style="font-size:clamp(22px,3vw,28px);margin-top:8px">You might also like</h2>
          </div>
          <a class="btn btn-ghost" href="/explore">Explore all ${icon('arrow-right', { size: 15 })}</a>
        </div>
        <div class="results-grid">${data.products.map((product) => productCard(product)).join('')}</div>
      </section>`
    );
    document.getElementById('cart-suggestions')?.addEventListener('click', (event) => {
      if (event.target.closest('[data-add-to-cart]')) {
        window.setTimeout(() => loadCart(), 900);
      }
    });
  } catch {
    suggestionsLoaded = false;
  }
}

async function loadCart() {
  try {
    const data = await api.get('/cart');
    cart = data;
    applyCart(data);
  } catch (error) {
    root.innerHTML = errorState(errorMessage(error));
    root.querySelector('[data-retry]')?.addEventListener('click', loadCart);
  }
}

async function init() {
  await mountSite();
  const user = await requireUser({ roles: ['buyer'] });
  if (!user) return;
  await loadCart();
}

init();
