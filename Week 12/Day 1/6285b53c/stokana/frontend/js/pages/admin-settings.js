import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { panel } from '../dashboard-ui.js';
import { pageLoader, errorState, toast, setButtonLoading, errorMessage } from '../ui.js';
import { escapeHtml, money } from '../format.js';

let dash = null;

function percentValue(rate) {
  return Number((Number(rate || 0) * 100).toFixed(2));
}

function summaryRows(settings) {
  const rows = [
    ['Commission rate', `${percentValue(settings.commissionRate)}%`],
    ['Standard delivery fee', money(settings.shippingFee)],
    ['Free delivery over', money(settings.freeShippingThreshold)]
  ];
  return rows
    .map(
      ([label, value]) => `<div class="row" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)">
        <span class="tiny muted">${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>`
    )
    .join('');
}

function render(settings) {
  dash.content.innerHTML = `<div class="settings-grid">
    <div class="list-stack">
      ${panel({
        title: 'Commission & delivery',
        subtitle: 'These values are applied at checkout on future orders.',
        body: `<div class="card-body">
          <div id="settings-alert"></div>
          <form id="settings-form" style="display:grid;gap:16px">
            <div class="form-group">
              <label class="form-label" for="settings-rate">Platform commission rate (%)</label>
              <input class="input" id="settings-rate" type="number" min="0" max="50" step="0.1"
                value="${percentValue(settings.commissionRate)}" required>
              <span class="form-hint">Charged on each item's line total. Maximum 50%.</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="settings-shipping">Standard delivery fee (KSh)</label>
                <input class="input" id="settings-shipping" type="number" min="0" max="100000" step="1"
                  value="${Number(settings.shippingFee)}" required>
                <span class="form-hint">Used when an order is below the free-delivery threshold.</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="settings-threshold">Free delivery threshold (KSh)</label>
                <input class="input" id="settings-threshold" type="number" min="0" max="1000000" step="1"
                  value="${Number(settings.freeShippingThreshold)}" required>
                <span class="form-hint">Buyers pay no delivery fee at or above this subtotal.</span>
              </div>
            </div>
            <div class="settings-note">
              ${icon('info', { size: 16 })}
              <div>Changes apply to new orders only. Existing orders keep the commission and delivery
              amounts recorded when they were placed.</div>
            </div>
            <div class="row" style="justify-content:flex-end">
              <button class="btn btn-primary" type="submit" id="settings-save">Save settings</button>
            </div>
          </form>
        </div>`
      })}
    </div>

    <div class="list-stack">
      ${panel({
        title: 'Effective now',
        subtitle: 'Current checkout pricing.',
        body: `<div class="card-body">${summaryRows(settings)}</div>`
      })}
      ${panel({
        title: 'How pricing works',
        body: `<div class="card-body" style="display:grid;gap:10px">
          <p class="tiny muted" style="margin:0;line-height:1.7">
            Commission is calculated per order item at checkout and locked into the order.
            Seller earnings are the line total minus commission.
          </p>
          <p class="tiny muted" style="margin:0;line-height:1.7">
            Delivery is charged once per order, not per seller. Orders at or above the
            free-delivery threshold ship free.
          </p>
          <p class="tiny muted" style="margin:0;line-height:1.7">
            Commission changes never rewrite past sales — settle historical earnings using the
            recorded commission ledger.
          </p>
        </div>`
      })}
    </div>
  </div>`;

  const form = dash.content.querySelector('#settings-form');
  const alertHost = dash.content.querySelector('#settings-alert');
  const save = dash.content.querySelector('#settings-save');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertHost.innerHTML = '';

    const rateInput = dash.content.querySelector('#settings-rate');
    const shippingInput = dash.content.querySelector('#settings-shipping');
    const thresholdInput = dash.content.querySelector('#settings-threshold');

    if (!form.reportValidity()) return;

    const rate = Number(rateInput.value);
    const shippingFee = Number(shippingInput.value);
    const freeShippingThreshold = Number(thresholdInput.value);

    if (!Number.isFinite(rate) || rate < 0 || rate > 50) {
      alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
        ${icon('alert-circle', { size: 15 })}<div>Commission must be between 0% and 50%.</div>
      </div>`;
      rateInput.focus();
      return;
    }

    setButtonLoading(save, true, 'Saving…');
    try {
      const result = await api.patch('/admin/settings', {
        commissionRate: rate / 100,
        shippingFee,
        freeShippingThreshold
      });
      toast(result.message);
      render(result);
    } catch (error) {
      setButtonLoading(save, false);
      alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
        ${icon('alert-circle', { size: 15 })}<div>${escapeHtml(errorMessage(error))}</div>
      </div>`;
    }
  });
}

async function load() {
  dash.content.innerHTML = pageLoader();
  try {
    const settings = await api.get('/admin/settings');
    render(settings);
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', load);
  }
}

async function init() {
  dash = await initDashboard({
    role: 'admin',
    active: '/admin/settings',
    title: 'Platform settings',
    subtitle: 'Set commission and delivery pricing for the marketplace.',
    actions: '<a class="btn btn-secondary btn-sm" href="/admin/commissions">View commissions</a>'
  });
  if (!dash) return;

  await load();
}

init();
