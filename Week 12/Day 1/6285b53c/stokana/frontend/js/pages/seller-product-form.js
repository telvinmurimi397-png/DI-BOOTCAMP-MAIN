import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { panel } from '../dashboard-ui.js';
import { toast, setButtonLoading, confirmDialog, errorState, pageLoader, errorMessage } from '../ui.js';
import { escapeHtml, statusBadge } from '../format.js';

const params = new URLSearchParams(window.location.search);
const editId = Number(params.get('id')) || null;
const isEdit = Boolean(editId);

let dash = null;
let categories = [];
let product = null;
let creatingImages = [''];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' }
];

function categoryOptions(selected) {
  return categories
    .map(
      (category) =>
        `<option value="${category.id}" ${Number(category.id) === Number(selected) ? 'selected' : ''}>${escapeHtml(
          category.name
        )}</option>`
    )
    .join('');
}

function statusCallout() {
  if (!isEdit) return '';
  if (product.status === 'pending') {
    return `<div class="alert warning" style="margin-bottom:16px">
      ${icon('clock', { size: 18 })}
      <div><strong>This product is awaiting review.</strong> Updates keep it in the review queue until an administrator approves it.</div>
    </div>`;
  }
  if (product.status === 'rejected') {
    return `<div class="alert danger" style="margin-bottom:16px">
      ${icon('alert-circle', { size: 18 })}
      <div><strong>Changes were requested.</strong> ${escapeHtml(
        product.rejectionReason || 'Update the listing, then save to resubmit it for review.'
      )}</div>
    </div>`;
  }
  if (product.status === 'approved') {
    return `<div class="alert success" style="margin-bottom:16px">
      ${icon('check-circle', { size: 18 })}
      <div><strong>This product is live.</strong> Saving your changes updates the public listing immediately.</div>
    </div>`;
  }
  return '';
}

function createImageRows() {
  return creatingImages
    .map(
      (url, index) => `<div class="image-url-row" data-create-image-row="${index}">
        <input class="input" type="text" inputmode="url" value="${escapeHtml(url)}" placeholder="https://example.com/photo.jpg"
          aria-label="Image URL ${index + 1}" data-create-image="${index}">
        <button class="btn btn-ghost btn-sm btn-icon" type="button" data-remove-create-image="${index}"
          title="Remove image" ${creatingImages.length === 1 && !url ? 'disabled' : ''}>
          ${icon('x', { size: 15 })}
        </button>
      </div>`
    )
    .join('');
}

function bindCreateImageRows() {
  const list = dash.content.querySelector('#create-image-list');
  if (!list) return;
  list.querySelectorAll('[data-create-image]').forEach((input) => {
    input.addEventListener('input', () => {
      creatingImages[Number(input.dataset.createImage)] = input.value.trim();
      const button = list.querySelector(`[data-remove-create-image="${input.dataset.createImage}"]`);
      if (button) {
        button.disabled = creatingImages.length === 1 && !input.value.trim();
      }
    });
  });
  list.querySelectorAll('[data-remove-create-image]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.removeCreateImage);
      creatingImages.splice(index, 1);
      if (!creatingImages.length) creatingImages.push('');
      document.getElementById('create-image-list').innerHTML = createImageRows();
      bindCreateImageRows();
    });
  });
}

function createImagesPanel() {
  return panel({
    title: 'Product images',
    subtitle: 'Up to 5 photos. The first image becomes the primary photo.',
    body: `<div class="card-body">
      <div class="image-url-list" id="create-image-list">${createImageRows()}</div>
      <div class="row wrap" style="gap:8px;margin-top:10px">
        <button class="btn btn-secondary btn-sm" type="button" id="add-create-image">${icon('plus', { size: 15 })} Add another URL</button>
        <button class="btn btn-secondary btn-sm" type="button" id="create-upload-image">${icon('upload', { size: 15 })} Upload photo</button>
        <input type="file" id="create-image-file" accept="image/*" hidden>
      </div>
      <p class="form-hint">Use a direct image link ending in .jpg, .png or .webp, or upload a file from this device. Uploads are stored by the configured image provider.</p>
    </div>`
  });
}

function imageTile(image) {
  return `<div class="image-tile">
    <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.altText || product.name)}" loading="lazy">
    ${image.isPrimary ? '<span class="badge blue primary-tag">Primary</span>' : ''}
    <div class="image-actions">
      ${
        image.isPrimary
          ? ''
          : `<button type="button" data-primary-image="${image.id}" title="Make primary">${icon('star', {
              size: 13
            })}</button>`
      }
      ${
        product.images.length > 1
          ? `<button type="button" data-delete-image="${image.id}" title="Remove image">${icon('trash', { size: 13 })}</button>`
          : ''
      }
    </div>
  </div>`;
}

function editImagesPanel() {
  const full = product.images.length >= 5;
  return panel({
    title: 'Product images',
    subtitle: `${product.images.length} of 5 images used. Changes here save immediately.`,
    body: `<div class="card-body">
      <div class="image-upload-grid wide" id="image-grid">
        ${product.images.map(imageTile).join('')}
        ${
          full
            ? ''
            : `<button class="image-add" type="button" id="edit-upload-trigger">
                ${icon('upload', { size: 18 })}
                <span>Upload photo</span>
              </button>`
        }
      </div>
      ${
        full
          ? '<p class="form-hint">Remove an image to upload a different one.</p>'
          : ''
      }
      ${
        full
          ? ''
          : `<div class="image-url-row" style="margin-top:10px">
              <input class="input" type="text" inputmode="url" id="new-image-url" placeholder="https://example.com/photo.jpg" aria-label="New image URL">
              <button class="btn btn-secondary btn-sm" type="button" id="add-image-url">Add URL</button>
            </div>`
      }
      <input type="file" id="edit-image-file" accept="image/*" hidden>
    </div>`
  });
}

function formPanel() {
  return `
    <form id="product-form" novalidate>
      <div id="product-alert"></div>
      ${statusCallout()}
      <div class="dash-grid-2" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)">
        <div>
          ${panel({
            title: 'Product details',
            subtitle: 'Clear names and accurate pricing help buyers find your listing.',
            body: `<div class="card-body">
              <div class="form-grid">
                <label class="form-group span-2">
                  <span class="form-label">Product name</span>
                  <input class="input" name="name" type="text" required minlength="3" maxlength="180"
                    value="${escapeHtml(product?.name || '')}" placeholder="e.g. Anker 20,000mAh power bank">
                </label>
                <label class="form-group">
                  <span class="form-label">Category</span>
                  <select class="select" name="categoryId" required>
                    <option value="">Choose a category</option>
                    ${categoryOptions(product?.categoryId)}
                  </select>
                </label>
                <label class="form-group">
                  <span class="form-label">Condition</span>
                  <select class="select" name="condition">
                    ${CONDITIONS.map(
                      (item) =>
                        `<option value="${item.value}" ${
                          (product?.condition || 'new') === item.value ? 'selected' : ''
                        }>${item.label}</option>`
                    ).join('')}
                  </select>
                </label>
                <label class="form-group">
                  <span class="form-label">Selling price (KES)</span>
                  <input class="input" name="price" type="number" inputmode="decimal" min="0.01" max="10000000"
                    step="0.01" required value="${product ? Number(product.price) : ''}" placeholder="0.00">
                </label>
                <label class="form-group">
                  <span class="form-label">Compare-at price (optional)</span>
                  <input class="input" name="compareAtPrice" type="number" inputmode="decimal" min="0.01"
                    max="10000000" step="0.01" value="${product?.compareAtPrice ? Number(product.compareAtPrice) : ''}"
                    placeholder="Original price">
                  <span class="form-hint">Shown crossed out when higher than the selling price.</span>
                </label>
                <label class="form-group">
                  <span class="form-label">Stock available</span>
                  <input class="input" name="stock" type="number" inputmode="numeric" min="0" max="100000"
                    step="1" required value="${product ? Number(product.stock) : 0}">
                </label>
                <label class="form-group">
                  <span class="form-label">Location (optional)</span>
                  <input class="input" name="location" type="text" maxlength="120"
                    value="${escapeHtml(product?.location || '')}" placeholder="e.g. Nairobi CBD">
                </label>
                <label class="form-group span-2">
                  <span class="form-label">Description</span>
                  <textarea class="textarea" name="description" rows="8" required minlength="20" maxlength="5000"
                    placeholder="Describe the product, what is included, condition details and delivery notes.">${escapeHtml(
                      product?.description || ''
                    )}</textarea>
                  <span class="form-hint">At least 20 characters. Avoid phone numbers or links — buyers contact you through STOKANA messages.</span>
                </label>
              </div>
            </div>`
          })}
        </div>
        <div>
          ${isEdit ? editImagesPanel() : createImagesPanel()}
          ${panel({
            title: isEdit ? 'Listing status' : 'Review & publish',
            body: `<div class="card-body">
              ${
                isEdit
                  ? `<div class="row" style="justify-content:space-between;margin-bottom:12px">
                      <span class="tiny muted">Current status</span>${statusBadge(product.status)}
                    </div>`
                  : `<p class="tiny muted" style="line-height:1.65;margin-bottom:14px">
                      New products are submitted for administrator review. They appear in the marketplace once approved.
                    </p>`
              }
              <div class="settings-note">
                ${icon('info', { size: 16 })}
                <span>Keep stock accurate. Setting stock to zero hides the product from checkout automatically.</span>
              </div>
              <div class="form-actions" style="margin-top:16px;justify-content:stretch">
                <a class="btn btn-secondary btn-block" href="/seller/products">Cancel</a>
                <button class="btn btn-primary btn-block" type="submit" id="submit-product">
                  ${isEdit ? 'Save changes' : 'Submit for review'}
                </button>
              </div>
            </div>`
          })}
        </div>
      </div>
    </form>`;
}

function renderForm() {
  dash.content.innerHTML = formPanel();
  bindEvents();
}

function readFields() {
  const form = dash.content.querySelector('#product-form');
  const data = Object.fromEntries(new FormData(form));
  return {
    name: String(data.name || '').trim(),
    categoryId: Number(data.categoryId),
    description: String(data.description || '').trim(),
    price: Number(data.price),
    compareAtPrice: data.compareAtPrice === '' ? null : Number(data.compareAtPrice),
    stock: Number(data.stock),
    condition: data.condition,
    location: String(data.location || '').trim()
  };
}

function showFormError(message, details = []) {
  const host = dash.content.querySelector('#product-alert');
  const list = Array.isArray(details) ? details : [];
  host.innerHTML = `<div class="alert danger" style="margin-bottom:16px">
    ${icon('alert-circle', { size: 18 })}
    <div><strong>${escapeHtml(message)}</strong>
      ${list.length ? `<ul style="margin:6px 0 0;padding-left:16px">${list
        .map((item) => `<li>${escapeHtml(item.message)}</li>`)
        .join('')}</ul>` : ''}
    </div>
  </div>`;
  list.forEach((item) => {
    const input = dash.content.querySelector(`[name="${item.field}"]`);
    input?.classList.add('invalid');
  });
  host.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormErrors() {
  const host = dash.content.querySelector('#product-alert');
  if (host) host.innerHTML = '';
  dash.content.querySelectorAll('.invalid').forEach((input) => input.classList.remove('invalid'));
}

function addCreateImageRow() {
  if (creatingImages.length >= 5) {
    toast('You can add up to 5 images.', 'info');
    return;
  }
  creatingImages.push('');
  dash.content.querySelector('#create-image-list').innerHTML = createImageRows();
  bindCreateImageRows();
  dash.content.querySelector(`[data-create-image="${creatingImages.length - 1}"]`)?.focus();
}

async function uploadCreateImage() {
  const input = dash.content.querySelector('#create-image-file');
  const file = input?.files?.[0];
  if (!file) return;
  if (creatingImages.filter(Boolean).length >= 5) {
    toast('You can add up to 5 images.', 'info');
    return;
  }

  const button = dash.content.querySelector('#create-upload-image');
  setButtonLoading(button, true, 'Uploading…');
  try {
    const formData = new FormData();
    formData.append('image', file);
    const result = await api.post('/seller/uploads', formData);
    const emptyIndex = creatingImages.indexOf('');
    if (emptyIndex >= 0) creatingImages[emptyIndex] = result.url;
    else creatingImages.push(result.url);
    dash.content.querySelector('#create-image-list').innerHTML = createImageRows();
    bindCreateImageRows();
    toast('Image uploaded.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    input.value = '';
    setButtonLoading(button, false);
  }
}

async function refreshImages() {
  try {
    const data = await api.get(`/seller/products/${editId}`);
    product = data.product;
    const panelHost = dash.content.querySelector('#image-grid')?.closest('.card');
    if (panelHost) panelHost.outerHTML = editImagesPanel();
    bindEditImageEvents();
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

function bindEditImageEvents() {
  const panelCard = dash.content.querySelector('#image-grid')?.closest('.card');
  if (!panelCard) return;

  panelCard.querySelectorAll('[data-primary-image]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await api.patch(`/seller/products/${editId}/images/${button.dataset.primaryImage}/primary`);
        toast('Primary image updated.');
        await refreshImages();
      } catch (error) {
        toast(errorMessage(error), 'error');
        button.disabled = false;
      }
    });
  });

  panelCard.querySelectorAll('[data-delete-image]').forEach((button) => {
    button.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Remove this image?',
        message: 'The image will be removed from the listing. A product must keep at least one image.',
        confirmLabel: 'Remove image',
        danger: true
      });
      if (!ok) return;
      button.disabled = true;
      try {
        await api.delete(`/seller/products/${editId}/images/${button.dataset.deleteImage}`);
        toast('Image removed.');
        await refreshImages();
      } catch (error) {
        toast(errorMessage(error), 'error');
        button.disabled = false;
      }
    });
  });

  panelCard.querySelector('#edit-upload-trigger')?.addEventListener('click', () => {
    panelCard.querySelector('#edit-image-file')?.click();
  });

  panelCard.querySelector('#edit-image-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const trigger = panelCard.querySelector('#edit-upload-trigger');
    setButtonLoading(trigger, true, 'Uploading…');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await api.post(`/seller/products/${editId}/images/upload`, formData);
      toast(result.message || 'Image uploaded.');
      await refreshImages();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setButtonLoading(trigger, false);
    } finally {
      event.target.value = '';
    }
  });

  panelCard.querySelector('#add-image-url')?.addEventListener('click', async () => {
    const input = panelCard.querySelector('#new-image-url');
    const url = input.value.trim();
    if (!url) {
      input.focus();
      return;
    }
    const button = panelCard.querySelector('#add-image-url');
    setButtonLoading(button, true, 'Adding…');
    try {
      const result = await api.post(`/seller/products/${editId}/images`, { url });
      toast(result.message || 'Image added.');
      await refreshImages();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setButtonLoading(button, false);
    }
  });
}

function bindEvents() {
  if (!isEdit) {
    bindCreateImageRows();
    dash.content.querySelector('#add-create-image')?.addEventListener('click', addCreateImageRow);
    dash.content.querySelector('#create-upload-image')?.addEventListener('click', () => {
      dash.content.querySelector('#create-image-file')?.click();
    });
    dash.content.querySelector('#create-image-file')?.addEventListener('change', uploadCreateImage);
  } else {
    bindEditImageEvents();
  }

  const form = dash.content.querySelector('#product-form');
  form.addEventListener('input', (event) => {
    event.target.classList.remove('invalid');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormErrors();
    const fields = readFields();

    if (isEdit) {
      const submit = dash.content.querySelector('#submit-product');
      setButtonLoading(submit, true, 'Saving…');
      try {
        const result = await api.patch(`/seller/products/${editId}`, fields);
        toast(result.message);
        const next = result.product.status === 'pending' ? '/seller/products?status=pending' : '/seller/products';
        window.setTimeout(() => {
          window.location.href = next;
        }, 800);
      } catch (error) {
        showFormError(errorMessage(error), error.details);
        setButtonLoading(submit, false);
      }
      return;
    }

    const imageUrls = creatingImages.map((url) => url.trim()).filter(Boolean);
    if (!imageUrls.length) {
      showFormError('Add at least one product image.', [
        { field: 'imageUrls', message: 'Paste an image URL or upload a photo.' }
      ]);
      return;
    }

    const submit = dash.content.querySelector('#submit-product');
    setButtonLoading(submit, true, 'Submitting…');
    try {
      const result = await api.post('/seller/products', { ...fields, imageUrls });
      toast(result.message);
      window.setTimeout(() => {
        window.location.href = '/seller/products?status=pending';
      }, 900);
    } catch (error) {
      showFormError(errorMessage(error), error.details);
      setButtonLoading(submit, false);
    }
  });
}

function blockedNotice(profile) {
  const messages = {
    pending: [
      'Your shop is waiting for approval',
      'You can browse this form, but products cannot be created until an administrator approves your shop.'
    ],
    rejected: [
      'Your seller application was not approved',
      profile?.rejectionReason || 'Contact STOKANA support to resolve your application.'
    ],
    suspended: [
      'Your shop is suspended',
      profile?.rejectionReason || 'Contact STOKANA support to restore your shop.'
    ]
  };
  const [title, text] = messages[profile?.status] || messages.pending;
  return `<div class="card"><div class="card-body" style="text-align:center;padding:46px 24px">
    <div class="empty-icon" style="margin:0 auto 12px;background:var(--warning-bg);color:var(--warning)">${icon(
      'clock',
      { size: 26 }
    )}</div>
    <h3 style="font-size:18px;margin-bottom:6px">${escapeHtml(title)}</h3>
    <p class="tiny muted" style="max-width:430px;margin:0 auto 18px;line-height:1.7">${escapeHtml(text)}</p>
    <a class="btn btn-secondary" href="/seller">Back to overview</a>
  </div></div>`;
}

async function init() {
  dash = await initDashboard({
    role: 'seller',
    active: isEdit ? '/seller/products' : '/seller/products/new',
    title: isEdit ? 'Edit product' : 'Add a product',
    subtitle: isEdit
      ? 'Update details, pricing and photos for this listing.'
      : 'Create a listing and submit it for marketplace review.',
    actions: '<a class="btn btn-secondary btn-sm" href="/seller/products">Back to products</a>'
  });
  if (!dash) return;

  if (dash.user.sellerProfile?.status !== 'approved') {
    dash.content.innerHTML = blockedNotice(dash.user.sellerProfile);
    return;
  }

  dash.content.innerHTML = pageLoader();
  try {
    const [categoryResult, productResult] = await Promise.all([
      api.get('/categories'),
      isEdit ? api.get(`/seller/products/${editId}`) : Promise.resolve(null)
    ]);
    categories = categoryResult.categories || [];
    product = productResult?.product || null;

    if (isEdit && product.status === 'archived') {
      dash.content.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:46px 24px">
        <h3 style="font-size:18px;margin-bottom:6px">${escapeHtml(product.name)} is archived</h3>
        <p class="tiny muted" style="margin:0 auto 18px">Archived products cannot be edited. Create a new listing if you want to sell it again.</p>
        <a class="btn btn-primary" href="/seller/products/new">Create a new listing</a>
      </div></div>`;
      return;
    }

    renderForm();
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

init();
