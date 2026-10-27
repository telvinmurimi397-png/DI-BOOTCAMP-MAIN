import { icon } from './icons.js';
import {
  money,
  escapeHtml,
  formatDate,
  statusMeta,
  initials,
  monthShort,
  plainNumber
} from './format.js';

export const PLACEHOLDER = '/assets/placeholder.svg';

export function img(url, alt = '', attrs = '') {
  return `<img src="${escapeHtml(url || PLACEHOLDER)}" alt="${escapeHtml(alt)}" loading="lazy" ${attrs}>`;
}

export function stars(rating = 0, { count = null, size = 13 } = {}) {
  const value = Number(rating) || 0;
  const filled = Math.round(value);
  const starIcons = Array.from({ length: 5 }, (_, index) =>
    icon('star-filled', { size, className: index < filled ? '' : 'empty' })
  ).join('');
  const suffix = count === null ? '' : ` <span>(${plainNumber(count)})</span>`;
  return `<span class="rating"><span class="stars">${starIcons}</span>${
    value > 0 ? `<span>${value.toFixed(1)}</span>${suffix}` : '<span>New</span>'
  }</span>`;
}

export function productCard(product, { quickAdd = true } = {}) {
  const soldOut = Number(product.stock) <= 0;
  const compare = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const price = Number(product.price);
  const discount = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
  const condition = product.condition && product.condition !== 'new'
    ? `<span class="badge amber">${escapeHtml(statusMeta(product.condition).label)}</span>`
    : '';
  const featured = product.isFeatured ? '<span class="badge blue">Featured</span>' : '';
  const soldBadge = soldOut ? '<span class="badge red">Sold out</span>' : '';
  const discountBadge = discount > 0 ? `<span class="badge red">-${discount}%</span>` : '';
  const quantityButton = quickAdd
    ? `<button class="quick-add" type="button" data-add-to-cart="${product.id}" ${
        soldOut ? 'disabled' : ''
      } aria-label="Add ${escapeHtml(product.name)} to cart" title="${soldOut ? 'Sold out' : 'Add to cart'}">${icon(
        'plus',
        { size: 18 }
      )}</button>`
    : '';

  return `
    <article class="product-card${soldOut ? ' is-sold-out' : ''}" data-product-card>
      <a class="product-media" href="/product/${encodeURIComponent(product.slug)}" aria-label="${escapeHtml(product.name)}">
        ${img(product.imageUrl, product.name)}
        <span class="product-flags">${soldBadge}${discountBadge}${condition}${featured}</span>
        ${quantityButton}
      </a>
      <div class="product-body">
        <span class="product-cat">${escapeHtml(product.categoryName || 'Marketplace')}</span>
        <h3 class="product-name"><a href="/product/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h3>
        <div class="product-meta">
          ${stars(product.ratingAverage, { count: product.ratingCount })}
          ${soldOut ? '<span class="text-danger strong">Unavailable</span>' : `<span>${escapeHtml(product.stock)} in stock</span>`}
        </div>
        <div class="product-price-row">
          <span class="price">${money(price)}</span>
          ${compare > price ? `<span class="price-was">${money(compare)}</span>` : ''}
        </div>
        <div class="product-seller">
          ${icon('store', { size: 13 })}
          <span>${escapeHtml(product.shopName || 'STOKANA seller')}</span>
        </div>
      </div>
    </article>`;
}

export function skeletonCards(count = 4) {
  return Array.from({ length: count }, () => '<div class="skeleton skeleton-card"></div>').join('');
}

export function skeletonLines(count = 3) {
  return Array.from(
    { length: count },
    (_, index) =>
      `<div class="skeleton skeleton-line${index === count - 1 ? ' short' : ''}"></div>`
  ).join('');
}

export function emptyState({ iconName = 'package', title, text = '', action = '' }) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon(iconName, { size: 26 })}</div>
      <h3>${escapeHtml(title)}</h3>
      ${text ? `<p>${escapeHtml(text)}</p>` : ''}
      ${action}
    </div>`;
}

export function errorState(message = 'Something went wrong.', retryLabel = 'Try again') {
  return `
    <div class="empty-state">
      <div class="empty-icon" style="background:var(--danger-bg);color:var(--danger)">${icon('alert-circle', { size: 26 })}</div>
      <h3>Could not load this page</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-secondary" type="button" data-retry>${icon('refresh', { size: 16 })} ${escapeHtml(retryLabel)}</button>
    </div>`;
}

export function categoryTile(category) {
  const iconName = category.icon === 'phone' ? 'smartphone' : category.icon;
  return `
    <a class="category-tile" href="/explore?category=${encodeURIComponent(category.slug)}">
      <span class="category-icon">${icon(iconName || 'tags', { size: 21 })}</span>
      <span>
        <strong>${escapeHtml(category.name)}</strong>
        <span>${plainNumber(category.productCount || 0)} products</span>
      </span>
    </a>`;
}

export function shopCard(shop) {
  const logo = shop.logoUrl
    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.shopName)}">`
    : initials(shop.shopName);
  return `
    <a class="shop-card" href="/shop/${encodeURIComponent(shop.shopSlug)}">
      <div class="shop-card-head">
        <span class="shop-logo">${logo}</span>
        <span class="grow">
          <strong>${escapeHtml(shop.shopName)}</strong>
          <span>${escapeHtml(shop.town || shop.county || 'Kenya')}</span>
        </span>
        ${icon('arrow-up-right', { size: 17, className: 'muted' })}
      </div>
      <p>${escapeHtml(shop.description || 'A trusted STOKANA shop serving customers across Kenya.')}</p>
      <div class="shop-card-foot">
        <span>${icon('package', { size: 13 })} ${plainNumber(shop.productCount)} products</span>
        ${stars(shop.ratingAverage, { count: shop.reviewCount, size: 11 })}
      </div>
    </a>`;
}

export function paginationHtml({ page = 1, totalPages = 1, total = 0, limit = 12 }) {
  if (totalPages <= 1) {
    return total > 0 ? `<div class="pagination"><span class="pagination-info">${plainNumber(total)} results</span></div>` : '';
  }
  const pages = [];
  const push = (value) => {
    if (!pages.includes(value)) pages.push(value);
  };
  push(1);
  if (page > 3) push('…');
  for (let index = Math.max(2, page - 1); index <= Math.min(totalPages - 1, page + 1); index += 1) push(index);
  if (page < totalPages - 2) push('…');
  push(totalPages);

  return `
    <div class="pagination">
      <span class="pagination-info">Showing ${plainNumber(Math.min((page - 1) * limit + 1, total))}–${plainNumber(
        Math.min(page * limit, total)
      )} of ${plainNumber(total)}</span>
      <div class="pagination-btns">
        <button class="page-btn" type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevron-left', { size: 15 })}</button>
        ${pages
          .map((value) =>
            value === '…'
              ? '<span class="page-btn ellipsis">…</span>'
              : `<button class="page-btn${value === page ? ' active' : ''}" type="button" data-page="${value}">${value}</button>`
          )
          .join('')}
        <button class="page-btn" type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Next page">${icon('chevron-right', { size: 15 })}</button>
      </div>
    </div>`;
}

export function barChart(data, { valueKey = 'gross', labelKey = 'label', formatter = money } = {}) {
  if (!data?.length) return '<div class="table-empty">No data for this period yet.</div>';
  const max = Math.max(...data.map((row) => Number(row[valueKey]) || 0), 1);
  return `
    <div class="chart">
      ${data
        .map((row) => {
          const value = Number(row[valueKey]) || 0;
          const height = Math.max(value > 0 ? 6 : 2, Math.round((value / max) * 100));
          return `<div class="chart-col" title="${escapeHtml(formatter(value))}">
            <span class="chart-value">${value > 0 ? escapeHtml(formatter(value)) : ''}</span>
            <div class="chart-bar" style="height:${height}%"></div>
            <span class="chart-label">${escapeHtml(row[labelKey] || monthShort(row.month || ''))}</span>
          </div>`;
        })
        .join('')}
    </div>`;
}

export function avatar(name, { size = '', soft = false, image = null } = {}) {
  const classes = `avatar${size ? ` ${size}` : ''}${soft ? ' soft' : ''}`;
  return `<span class="${classes}">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}">` : escapeHtml(initials(name))}</span>`;
}

let toastStack = null;

export function toast(message, type = 'success', duration = 3800) {
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    toastStack.setAttribute('role', 'status');
    toastStack.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastStack);
  }

  const element = document.createElement('div');
  element.className = `toast ${type}`;
  const iconName = type === 'error' ? 'alert-circle' : type === 'info' ? 'info' : 'check-circle';
  element.innerHTML = `${icon(iconName, { size: 18 })}<span>${escapeHtml(message)}</span>`;
  toastStack.appendChild(element);

  window.setTimeout(() => {
    element.classList.add('leaving');
    window.setTimeout(() => element.remove(), 220);
  }, duration);
}

export function errorMessage(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

let activeModal = null;

export function openModal({ title = '', subtitle = '', body = '', footer = '', size = '', onMount = null } = {}) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || 'Dialog')}">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button class="icon-btn" type="button" data-close-modal aria-label="Close dialog">${icon('x', { size: 18 })}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;

  const close = () => closeModal();
  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', close));

  document.body.appendChild(backdrop);
  document.body.classList.add('no-scroll');
  activeModal = backdrop;

  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  backdrop._onKey = onKey;

  onMount?.(backdrop.querySelector('.modal'));
  const focusable = backdrop.querySelector('input, button, select, textarea');
  focusable?.focus({ preventScroll: true });

  return backdrop;
}

export function closeModal() {
  if (!activeModal) return;
  document.removeEventListener('keydown', activeModal._onKey);
  activeModal.remove();
  document.body.classList.remove('no-scroll');
  activeModal = null;
}

export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeModal();
      resolve(value);
    };

    const backdrop = openModal({
      title,
      size: 'narrow',
      body: `<p class="muted" style="font-size:13.5px;line-height:1.65">${escapeHtml(message)}</p>`,
      footer: `<button class="btn btn-secondary" type="button" data-cancel>${escapeHtml(cancelLabel)}</button>
               <button class="btn ${danger ? 'btn-danger' : ''}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>`
    });

    backdrop.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    backdrop.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) finish(false);
    });
  });
}

export function promptDialog({
  title = 'Provide a reason',
  label = 'Reason',
  placeholder = '',
  confirmLabel = 'Submit',
  required = true,
  danger = false
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeModal();
      resolve(value);
    };

    const backdrop = openModal({
      title,
      size: 'narrow',
      body: `<label class="form-group">
          <span class="form-label">${escapeHtml(label)}</span>
          <textarea class="textarea" data-reason rows="4" placeholder="${escapeHtml(placeholder)}"></textarea>
          <span class="form-error hidden" data-reason-error>Please provide a reason.</span>
        </label>`,
      footer: `<button class="btn btn-secondary" type="button" data-cancel>Cancel</button>
               <button class="btn ${danger ? 'btn-danger' : ''}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>`
    });

    const textarea = backdrop.querySelector('[data-reason]');
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => finish(null));
    backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
      const value = textarea.value.trim();
      if (required && !value) {
        textarea.classList.add('invalid');
        backdrop.querySelector('[data-reason-error]').classList.remove('hidden');
        textarea.focus();
        return;
      }
      finish(value);
    });
    textarea.addEventListener('input', () => {
      textarea.classList.remove('invalid');
      backdrop.querySelector('[data-reason-error]').classList.add('hidden');
    });
  });
}

export function setButtonLoading(button, loading, loadingLabel = 'Working…') {
  if (!button) return;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.classList.add('is-loading');
    button.innerHTML = `<span class="spinner"></span> ${escapeHtml(loadingLabel)}`;
  } else {
    button.disabled = false;
    button.classList.remove('is-loading');
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

export function orderStatusTone(status) {
  return statusMeta(status).tone;
}

export function formatPrice(value) {
  return money(value);
}

export function safeDate(value) {
  return formatDate(value);
}

export function pageLoader() {
  return '<div class="page-loading"><span class="spinner dark lg"></span><span>Loading…</span></div>';
}

export function escape(value) {
  return escapeHtml(value);
}
