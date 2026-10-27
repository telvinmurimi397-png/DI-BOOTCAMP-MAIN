import { icon } from './icons.js';
import { escapeHtml } from './format.js';
import { paginationHtml } from './ui.js';

export function statCard({ label, value, iconName = 'chart', tone = '', foot = '' }) {
  return `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-label">${escapeHtml(label)}</span>
        <span class="stat-icon ${tone}">${icon(iconName, { size: 17 })}</span>
      </div>
      <div class="stat-value">${escapeHtml(String(value))}</div>
      ${foot ? `<div class="stat-foot">${foot}</div>` : ''}
    </div>`;
}

export function statGrid(cards) {
  return `<div class="stat-grid">${cards.map(statCard).join('')}</div>`;
}

export function tabsHtml(tabs, active, { ariaLabel = 'Filter' } = {}) {
  return `
    <div class="tabs" role="tablist" aria-label="${escapeHtml(ariaLabel)}">
      ${tabs
        .map(
          (tab) => `<button class="tab${tab.value === active ? ' active' : ''}" type="button" role="tab"
            aria-selected="${tab.value === active}" data-tab="${tab.value}">
            ${escapeHtml(tab.label)}${
              tab.count !== undefined
                ? ` <span class="tab-count" data-tab-count="${tab.value}">${Number(tab.count)}</span>`
                : ''
            }
          </button>`
        )
        .join('')}
    </div>`;
}

export function bindTabs(host, onSelect) {
  host.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('active')) return;
      host.querySelectorAll('[data-tab]').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      onSelect(button.dataset.tab);
    });
  });
}

export function updateTabCounts(host, counts = {}) {
  Object.entries(counts).forEach(([key, value]) => {
    const node = host.querySelector(`[data-tab-count="${key}"]`);
    if (node) node.textContent = String(Number(value) || 0);
  });
}

export function attachPagination(host, pagination, onPage) {
  if (!host) return;
  host.innerHTML = paginationHtml(pagination);
  host.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = Number(button.dataset.page);
      if (!next || next < 1 || next > pagination.totalPages || next === pagination.page) return;
      onPage(next);
    });
  });
}

export function tableHtml(headers, rows) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>${headers.map((head) => `<th>${escapeHtml(head)}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`;
}

export function panel({ title = '', subtitle = '', action = '', body = '', footer = '', className = '' }) {
  return `
    <section class="card ${className}">
      ${
        title
          ? `<div class="card-head">
              <div>
                <h3>${escapeHtml(title)}</h3>
                ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
              </div>
              ${action ? `<div class="row wrap" style="gap:8px">${action}</div>` : ''}
            </div>`
          : ''
      }
      ${body}
      ${footer ? `<div class="card-foot">${footer}</div>` : ''}
    </section>`;
}

export function miniRow({ image = '', title, subtitle = '', value = '', meta = '' }) {
  return `
    <div class="mini-row">
      ${image ? `<span class="mini-row-media">${image}</span>` : ''}
      <div class="grow">
        <strong>${title}</strong>
        ${subtitle ? `<span>${subtitle}</span>` : ''}
      </div>
      ${meta ? `<span class="mini-row-meta">${meta}</span>` : ''}
      ${value ? `<strong class="mini-row-value">${value}</strong>` : ''}
    </div>`;
}

export function stockEditor(product) {
  return `
    <div class="stock-editor">
      <input class="input" type="number" min="0" max="100000" step="1" value="${Number(product.stock)}"
        aria-label="Stock for ${escapeHtml(product.name)}" data-stock-input="${product.id}">
      <button class="btn btn-secondary btn-sm" type="button" data-stock-save="${product.id}"
        title="Save stock">${icon('check', { size: 15 })}</button>
    </div>`;
}
