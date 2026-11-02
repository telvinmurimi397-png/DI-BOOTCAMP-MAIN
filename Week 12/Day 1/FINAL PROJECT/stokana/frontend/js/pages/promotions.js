import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { errorState, toast, errorMessage, setButtonLoading } from '../ui.js';
import { escapeHtml, formatDate, money } from '../format.js';

const isAdmin = window.location.pathname.startsWith('/admin/');
const prefix = isAdmin ? '/admin' : '/seller';
let dash = null;
let promotions = [];

function render() {
  const promoRows = promotions.length
    ? promotions.map((promotion) => `<article class="content-card" style="padding:14px">
        <div class="row-between" style="gap:12px">
          <div>
            <strong>${escapeHtml(promotion.code || `Flash sale · product #${promotion.productId}`)}</strong>
            <div class="tiny muted">${promotion.discountType === 'percent'
              ? `${Number(promotion.discountValue)}% off`
              : `${money(promotion.discountValue)} off`}
              · ${promotion.isActive ? 'Active' : 'Paused'}
              ${promotion.endsAt ? ` · Ends ${formatDate(promotion.endsAt)}` : ''}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" data-toggle-promotion="${promotion.id}" data-active="${promotion.isActive}">
            ${promotion.isActive ? 'Pause' : 'Activate'}
          </button>
        </div>
      </article>`).join('')
    : '<p class="tiny muted">No promotions yet.</p>';

  dash.content.innerHTML = `
    <div class="content-card">
      <div class="section-head"><div><h2>Create a promotion</h2>
        <p>Discount codes apply in checkout. Scheduled flash sales adjust the listed product price automatically.</p></div></div>
      <form id="promotion-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="promotion-kind">Promotion type</label>
          <select class="select" name="kind" id="promotion-kind">
            <option value="coupon">Discount code</option>
            <option value="flash_sale">Flash sale</option>
          </select>
        </div>
        <div class="form-group" id="promotion-code-field">
          <label class="form-label" for="promotion-code">Code</label>
          <input class="input" id="promotion-code" name="code" maxlength="40" placeholder="e.g. WELCOME10">
        </div>
        <div class="form-group" id="promotion-product-field" hidden>
          <label class="form-label" for="promotion-product">Product ID</label>
          <input class="input" id="promotion-product" name="productId" type="number" min="1" step="1">
        </div>
        <div class="form-group">
          <label class="form-label">Discount type</label>
          <select class="select" name="discountType"><option value="percent">Percentage</option><option value="fixed">Fixed KSh</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Discount value</label>
          <input class="input" name="discountValue" type="number" min="0.01" step="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">Minimum subtotal (KSh)</label>
          <input class="input" name="minimumSubtotal" type="number" min="0" step="0.01" value="0">
        </div>
        ${isAdmin ? `<div class="form-group">
          <label class="form-label">Usage limit <span class="optional">(optional)</span></label>
          <input class="input" name="usageLimit" type="number" min="1" step="1">
        </div>` : ''}
        <div class="form-group">
          <label class="form-label">Starts <span class="optional">(optional)</span></label>
          <input class="input" name="startsAt" type="datetime-local">
        </div>
        <div class="form-group">
          <label class="form-label">Ends <span class="optional">(optional)</span></label>
          <input class="input" name="endsAt" type="datetime-local">
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Create promotion</button></div>
      </form>
    </div>
    <div class="content-card" style="margin-top:16px">
      <div class="section-head"><div><h2>Your promotions</h2>
        <p>${isAdmin ? 'Platform codes and flash sales.' : 'Codes and flash sales for your shop.'}</p></div></div>
      <div class="list-stack">${promoRows}</div>
    </div>`;

  const form = dash.content.querySelector('#promotion-form');
  const kind = form.elements.namedItem('kind');
  const syncKind = () => {
    const sale = kind.value === 'flash_sale';
    form.querySelector('#promotion-code-field').hidden = sale;
    form.querySelector('#promotion-product-field').hidden = !sale;
  };
  kind.addEventListener('change', syncKind);
  syncKind();
  form.addEventListener('submit', createPromotion);
  dash.content.querySelectorAll('[data-toggle-promotion]').forEach((button) => {
    button.addEventListener('click', () => togglePromotion(button));
  });
}

async function createPromotion(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const toIso = (value) => value ? new Date(value).toISOString() : undefined;
  const payload = {
    kind: data.kind,
    code: data.kind === 'coupon' ? data.code.trim() || undefined : undefined,
    productId: data.kind === 'flash_sale' && data.productId ? Number(data.productId) : undefined,
    discountType: data.discountType,
    discountValue: Number(data.discountValue),
    minimumSubtotal: Number(data.minimumSubtotal || 0),
    usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
    startsAt: toIso(data.startsAt),
    endsAt: toIso(data.endsAt)
  };
  const button = form.querySelector('button[type="submit"]');
  setButtonLoading(button, true, 'Creating…');
  try {
    await api.post(`${prefix}/promotions`, payload);
    toast('Promotion created.');
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function togglePromotion(button) {
  try {
    await api.patch(`${prefix}/promotions/${button.dataset.togglePromotion}`, {
      isActive: button.dataset.active !== 'true'
    });
    await load();
    toast('Promotion updated.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function load() {
  try {
    const data = await api.get(`${prefix}/promotions`);
    promotions = data.promotions;
    render();
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', load);
  }
}

async function init() {
  dash = await initDashboard({
    role: isAdmin ? 'admin' : 'seller',
    active: isAdmin ? '/admin/promotions' : '/seller/promotions',
    title: 'Promotions',
    subtitle: isAdmin ? 'Manage marketplace discounts and flash sales.' : 'Run discount codes and sales for your shop.'
  });
  if (dash) await load();
}

init();
