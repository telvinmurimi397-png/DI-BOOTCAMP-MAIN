import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { panel } from '../dashboard-ui.js';
import { COUNTIES } from '../auth-ui.js';
import { pageLoader, errorState, toast, setButtonLoading, errorMessage } from '../ui.js';
import {
  escapeHtml,
  initials,
  formatDate,
  statusBadge,
  pluralize
} from '../format.js';

let dash = null;
let shop = null;
let pickupLocations = [];

function statusMessage() {
  if (shop.status === 'approved') {
    return `<div class="alert success" style="margin-bottom:16px">
      ${icon('check-circle', { size: 18 })}
      <div><strong>Your shop is live.</strong> Buyers can find it at
        <a href="/shop/${encodeURIComponent(shop.shopSlug)}" target="_blank" rel="noopener">/shop/${escapeHtml(
          shop.shopSlug
        )}</a>.</div>
    </div>`;
  }
  if (shop.status === 'pending') {
    return `<div class="alert warning" style="margin-bottom:16px">
      ${icon('clock', { size: 18 })}
      <div><strong>Your shop is awaiting approval.</strong> An administrator is reviewing your details. You can update this profile while you wait.</div>
    </div>`;
  }
  if (shop.status === 'rejected') {
    return `<div class="alert danger" style="margin-bottom:16px">
      ${icon('alert-circle', { size: 18 })}
      <div><strong>Your application was not approved.</strong> ${escapeHtml(
        shop.rejectionReason || 'Contact support for more information.'
      )}</div>
    </div>`;
  }
  return '';
}

function previewHtml() {
  const logo = shop.logoUrl
    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.shopName)}">`
    : escapeHtml(initials(shop.shopName) || 'S');

  return `<div class="card">
    <div class="dash-shop-preview">
      <div class="dash-shop-banner" id="preview-banner"></div>
      <div class="dash-shop-body">
        <span class="dash-shop-logo" id="preview-logo">${logo}</span>
        <h3 id="preview-name">${escapeHtml(shop.shopName)}</h3>
        <div class="dash-shop-meta">
          <span id="preview-location">${icon('map-pin', { size: 12 })} ${escapeHtml(
            [shop.town, shop.county].filter(Boolean).join(', ') || 'Kenya'
          )}</span>
          <span>${icon('package', { size: 12 })} ${pluralize(shop.productCount, 'product')}</span>
        </div>
        <p id="preview-description">${escapeHtml(
          shop.description || 'Add a short description so buyers know what your shop offers.'
        )}</p>
      </div>
    </div>
  </div>`;
}

function statusPanel() {
  return panel({
    title: 'Shop status',
    body: `<div class="card-body">
      <div class="row" style="justify-content:space-between;margin-bottom:14px">
        <span class="tiny muted">Approval status</span>
        ${statusBadge(shop.status)}
      </div>
      <div class="status-list">
        <div class="status-row">
          <div class="grow"><strong>Live products</strong><span>Visible in the marketplace</span></div>
          <span class="count">${shop.liveProductCount}</span>
        </div>
        <div class="status-row">
          <div class="grow"><strong>Total products</strong><span>Including pending and archived</span></div>
          <span class="count">${shop.productCount}</span>
        </div>
        <div class="status-row">
          <div class="grow"><strong>Paid orders</strong><span>Orders containing your products</span></div>
          <span class="count">${shop.orderCount}</span>
        </div>
        <div class="status-row">
          <div class="grow"><strong>Rating</strong><span>${pluralize(shop.reviewCount, 'review')}</span></div>
          <span class="count">${Number(shop.ratingAverage || 0).toFixed(1)}</span>
        </div>
      </div>
      <dl class="detail-grid" style="margin-top:18px">
        <div><dt>Shop URL</dt><dd>/shop/${escapeHtml(shop.shopSlug)}</dd></div>
        <div><dt>Joined</dt><dd>${formatDate(shop.createdAt)}</dd></div>
        <div><dt>Approved</dt><dd>${shop.approvedAt ? formatDate(shop.approvedAt) : '—'}</dd></div>
      </dl>
      ${
        shop.status === 'approved'
          ? `<a class="btn btn-secondary btn-block" style="margin-top:16px" href="/shop/${encodeURIComponent(
              shop.shopSlug
            )}" target="_blank" rel="noopener">${icon('globe', { size: 16 })} View public shop</a>`
          : ''
      }
    </div>`
  });
}

function formPanel() {
  return panel({
    title: 'Public shop details',
    subtitle: 'These details appear on your shop page and product listings.',
    body: `<form class="card-body" id="shop-form" novalidate>
      <div id="shop-alert"></div>
      <div class="form-grid">
        <label class="form-group span-2">
          <span class="form-label">Description</span>
          <textarea class="textarea" name="description" rows="5" maxlength="1000"
            placeholder="Tell buyers what you sell, where you deliver from and what makes your shop different.">${escapeHtml(
              shop.description || ''
            )}</textarea>
          <span class="form-hint"><span id="description-count">${(shop.description || '').length}</span>/1000 characters</span>
        </label>
        <label class="form-group">
          <span class="form-label">Logo URL</span>
          <input class="input" name="logoUrl" type="text" inputmode="url" maxlength="500" value="${escapeHtml(shop.logoUrl || '')}"
            placeholder="https://example.com/logo.png">
          <span class="form-hint">Square images work best. Falls back to initials.</span>
        </label>
        <label class="form-group">
          <span class="form-label">Banner URL</span>
          <input class="input" name="bannerUrl" type="text" inputmode="url" maxlength="500" value="${escapeHtml(shop.bannerUrl || '')}"
            placeholder="https://example.com/banner.jpg">
          <span class="form-hint">Wide image, at least 1200×300px.</span>
        </label>
        <label class="form-group">
          <span class="form-label">County</span>
          <select class="select" name="county">
            <option value="">Choose a county</option>
            ${COUNTIES.map(
              (county) =>
                `<option value="${escapeHtml(county)}" ${county === shop.county ? 'selected' : ''}>${escapeHtml(
                  county
                )}</option>`
            ).join('')}
          </select>
        </label>
        <label class="form-group">
          <span class="form-label">Town or area</span>
          <input class="input" name="town" type="text" maxlength="80" value="${escapeHtml(shop.town || '')}"
            placeholder="e.g. Westlands">
        </label>
        <label class="form-group span-2">
          <span class="form-label">Shop phone</span>
          <input class="input" name="phone" type="tel" maxlength="30" value="${escapeHtml(shop.phone || '')}"
            placeholder="+254 700 000 000">
          <span class="form-hint">Shown to buyers on your public shop page.</span>
        </label>
      </div>
      <div class="form-actions" style="margin-top:18px">
        <button class="btn btn-primary" type="submit" id="save-shop">Save shop profile</button>
      </div>
    </form>`
  });
}

function pickupPanel() {
  const rows = pickupLocations.length
    ? pickupLocations.map((location) => `<article class="status-row" style="align-items:flex-start">
        <div class="grow">
          <strong>${escapeHtml(location.label)}${location.isDefault ? ' · Default' : ''}</strong>
          <span>${escapeHtml(location.addressLine)}, ${escapeHtml(location.town)}, ${escapeHtml(location.county)}</span>
          ${location.contactName ? `<span>${escapeHtml(location.contactName)}${location.phone ? ` · ${escapeHtml(location.phone)}` : ''}</span>` : ''}
          ${location.instructions ? `<span>${escapeHtml(location.instructions)}</span>` : ''}
        </div>
        <div class="row wrap" style="gap:6px">
          <button class="btn btn-ghost btn-sm" type="button" data-pickup-edit="${location.id}">Edit</button>
          ${location.isDefault ? '' : `<button class="btn btn-ghost btn-sm" type="button" data-pickup-default="${location.id}">Make default</button>`}
          <button class="btn btn-ghost btn-sm" type="button" data-pickup-delete="${location.id}">Remove</button>
        </div>
      </article>`).join('')
    : '<p class="tiny muted">Add a pickup address to choose an origin when arranging a courier.</p>';

  return panel({
    title: 'Seller pickup locations',
    subtitle: 'Private shop addresses used as shipment origins. Buyers only see the delivery address they provided.',
    body: `<div class="card-body">
      <div id="pickup-list" class="status-list">${rows}</div>
      <form id="pickup-form" class="form-grid" style="margin-top:20px">
        <input type="hidden" name="locationId">
        <label class="form-group">
          <span class="form-label">Location label</span>
          <input class="input" name="label" required minlength="2" maxlength="80" placeholder="Main shop / Warehouse">
        </label>
        <label class="form-group">
          <span class="form-label">County</span>
          <select class="select" name="county" required>
            <option value="">Choose a county</option>
            ${COUNTIES.map((county) => `<option value="${escapeHtml(county)}">${escapeHtml(county)}</option>`).join('')}
          </select>
        </label>
        <label class="form-group">
          <span class="form-label">Town or area</span>
          <input class="input" name="town" required minlength="2" maxlength="80">
        </label>
        <label class="form-group">
          <span class="form-label">Street address and landmark</span>
          <input class="input" name="addressLine" required minlength="5" maxlength="500">
        </label>
        <label class="form-group">
          <span class="form-label">Pickup contact</span>
          <input class="input" name="contactName" maxlength="120">
        </label>
        <label class="form-group">
          <span class="form-label">Contact phone</span>
          <input class="input" name="phone" type="tel" maxlength="30">
        </label>
        <label class="form-group span-2">
          <span class="form-label">Courier instructions <span class="optional">(optional)</span></span>
          <textarea class="textarea" name="instructions" rows="2" maxlength="500"></textarea>
        </label>
        <label class="form-group span-2 row" style="gap:8px">
          <input type="checkbox" name="isDefault">
          <span class="form-label" style="margin:0">Use as default pickup location</span>
        </label>
        <div class="form-actions span-2">
          <button class="btn btn-primary" type="submit" id="save-pickup">Save pickup location</button>
          <button class="btn btn-secondary" type="button" data-pickup-cancel hidden>Cancel edit</button>
        </div>
      </form>
    </div>`
  });
}

function render() {
  dash.content.innerHTML = `
    ${statusMessage()}
    <div class="dash-grid-2 equal" style="margin-bottom:16px">
      ${previewHtml()}
      ${statusPanel()}
    </div>
    ${formPanel()}
    <div style="margin-top:16px" id="pickup-host">${pickupPanel()}</div>
    <div class="card" style="margin-top:16px">
      <div class="card-body">
        <div class="settings-note">
          ${icon('lock', { size: 16 })}
          <span><strong>Shop name and URL changes need support.</strong> Your shop name is <strong>${escapeHtml(
            shop.shopName
          )}</strong> and your page is <strong>/shop/${escapeHtml(
            shop.shopSlug
          )}</strong>. Email <a href="mailto:teff397@gmail.com">teff397@gmail.com</a> to change them.</span>
        </div>
      </div>
    </div>`;

  bindPreview();
  bindSave();
  bindPickupLocations();
}

function bindPickupLocations() {
  const form = dash.content.querySelector('#pickup-form');
  const cancel = form.querySelector('[data-pickup-cancel]');
  const reset = () => {
    form.reset();
    form.elements.locationId.value = '';
    form.querySelector('#save-pickup').textContent = 'Save pickup location';
    cancel.hidden = true;
  };
  cancel.addEventListener('click', reset);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const id = values.locationId;
    const payload = {
      label: String(values.label).trim(),
      county: String(values.county).trim(),
      town: String(values.town).trim(),
      addressLine: String(values.addressLine).trim(),
      contactName: String(values.contactName || '').trim(),
      phone: String(values.phone || '').trim(),
      instructions: String(values.instructions || '').trim(),
      isDefault: form.elements.isDefault.checked
    };
    const submit = form.querySelector('#save-pickup');
    setButtonLoading(submit, true, 'Saving…');
    try {
      const result = await (id
        ? api.patch(`/seller/pickup-locations/${id}`, payload)
        : api.post('/seller/pickup-locations', payload));
      pickupLocations = result.locations;
      toast(result.message);
      render();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setButtonLoading(submit, false);
    }
  });
  dash.content.querySelectorAll('[data-pickup-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const location = pickupLocations.find((item) => Number(item.id) === Number(button.dataset.pickupEdit));
      if (!location) return;
      form.elements.locationId.value = location.id;
      for (const field of ['label', 'county', 'town', 'addressLine', 'contactName', 'phone', 'instructions']) {
        form.elements[field].value = location[field] || '';
      }
      form.elements.isDefault.checked = location.isDefault;
      form.querySelector('#save-pickup').textContent = 'Update pickup location';
      cancel.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  dash.content.querySelectorAll('[data-pickup-default]').forEach((button) => {
    button.addEventListener('click', async () => {
      const location = pickupLocations.find((item) => Number(item.id) === Number(button.dataset.pickupDefault));
      if (!location) return;
      try {
        const result = await api.patch(`/seller/pickup-locations/${location.id}`, { isDefault: true });
        pickupLocations = result.locations;
        render();
      } catch (error) {
        toast(errorMessage(error), 'error');
      }
    });
  });
  dash.content.querySelectorAll('[data-pickup-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Remove this pickup location? Existing shipments will retain their history.')) return;
      try {
        await api.delete(`/seller/pickup-locations/${button.dataset.pickupDelete}`);
        pickupLocations = (await api.get('/seller/pickup-locations')).locations;
        toast('Pickup location removed.');
        render();
      } catch (error) {
        toast(errorMessage(error), 'error');
      }
    });
  });
}

function applyBanner(url) {
  const banner = dash.content.querySelector('#preview-banner');
  if (!banner) return;
  if (!url) {
    banner.style.backgroundImage = '';
    return;
  }
  banner.style.backgroundImage = `url("${url.replace(/["\\\n\r]/g, (char) => encodeURIComponent(char))}")`;
}

function updatePreview() {
  const form = dash.content.querySelector('#shop-form');
  if (!form) return;
  const values = Object.fromEntries(new FormData(form));

  const name = dash.content.querySelector('#preview-name');
  if (name) name.textContent = shop.shopName;

  const location = dash.content.querySelector('#preview-location');
  if (location) {
    location.innerHTML = `${icon('map-pin', { size: 12 })} ${escapeHtml(
      [values.town, values.county].filter(Boolean).join(', ') || 'Kenya'
    )}`;
  }

  const description = dash.content.querySelector('#preview-description');
  if (description) {
    description.textContent =
      String(values.description || '').trim() ||
      'Add a short description so buyers know what your shop offers.';
  }

  const logo = dash.content.querySelector('#preview-logo');
  if (logo) {
    logo.innerHTML = '';
    const url = String(values.logoUrl || '').trim();
    if (url) {
      const image = document.createElement('img');
      image.src = url;
      image.alt = shop.shopName;
      image.addEventListener('error', () => {
        logo.textContent = initials(shop.shopName) || 'S';
      });
      logo.appendChild(image);
    } else {
      logo.textContent = initials(shop.shopName) || 'S';
    }
  }

  const count = dash.content.querySelector('#description-count');
  if (count) count.textContent = String(String(values.description || '').length);

  applyBanner(String(values.bannerUrl || '').trim());
}

function bindPreview() {
  const form = dash.content.querySelector('#shop-form');
  form.addEventListener('input', updatePreview);
  applyBanner(shop.bannerUrl || '');
}

function showError(message, details = []) {
  const host = dash.content.querySelector('#shop-alert');
  host.innerHTML = `<div class="alert danger" style="margin-bottom:16px">
    ${icon('alert-circle', { size: 18 })}
    <div><strong>${escapeHtml(message)}</strong>
      ${
        details?.length
          ? `<ul style="margin:6px 0 0;padding-left:16px">${details
              .map((item) => `<li>${escapeHtml(item.message)}</li>`)
              .join('')}</ul>`
          : ''
      }
    </div>
  </div>`;
  details?.forEach((item) => {
    formField(item.field)?.classList.add('invalid');
  });
  host.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function formField(name) {
  return dash.content.querySelector(`#shop-form [name="${name}"]`);
}

function bindSave() {
  const form = dash.content.querySelector('#shop-form');
  form.addEventListener('input', (event) => {
    event.target.classList.remove('invalid');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = dash.content.querySelector('#save-shop');
    const values = Object.fromEntries(new FormData(form));

    setButtonLoading(submit, true, 'Saving…');
    try {
      const result = await api.patch('/seller/shop', {
        description: String(values.description || '').trim(),
        logoUrl: String(values.logoUrl || '').trim(),
        bannerUrl: String(values.bannerUrl || '').trim(),
        county: String(values.county || '').trim(),
        town: String(values.town || '').trim(),
        phone: String(values.phone || '').trim()
      });
      shop = result.shop;
      toast(result.message);
      render();
    } catch (error) {
      showError(errorMessage(error), error.details);
      setButtonLoading(submit, false);
    }
  });
}

async function init() {
  dash = await initDashboard({
    role: 'seller',
    active: '/seller/shop',
    title: 'Shop profile',
    subtitle: 'Control how buyers see your shop across STOKANA.',
    actions: '<a class="btn btn-secondary btn-sm" href="/seller/products">Back to products</a>'
  });
  if (!dash) return;

  dash.content.innerHTML = pageLoader();
  try {
    const [data, pickupData] = await Promise.all([
      api.get('/seller/shop'),
      api.get('/seller/pickup-locations')
    ]);
    shop = data.shop;
    pickupLocations = pickupData.locations;
    render();
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
