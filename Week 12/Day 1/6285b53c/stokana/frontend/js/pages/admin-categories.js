import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { bindTabs, tabsHtml, updateTabCounts } from '../dashboard-ui.js';
import {
  pageLoader,
  errorState,
  emptyState,
  toast,
  setButtonLoading,
  openModal,
  closeModal,
  confirmDialog,
  errorMessage
} from '../ui.js';
import { escapeHtml, pluralize, statusBadge, debounce } from '../format.js';

const TABS = [
  { value: 'all', label: 'All', count: 0 },
  { value: 'active', label: 'Active', count: 0 },
  { value: 'inactive', label: 'Inactive', count: 0 }
];

let categories = [];
let filter = 'all';
let search = '';
let dash = null;
let loading = false;

function renderShell() {
  dash.content.innerHTML = `
    <div class="table-toolbar">
      <div id="category-tabs">${tabsHtml(TABS, filter, { ariaLabel: 'Filter categories' })}</div>
      <div class="toolbar-actions">
        <div class="input-group">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="category-search" value="${escapeHtml(search)}"
            placeholder="Search categories" aria-label="Search categories">
        </div>
        <button class="btn btn-primary btn-sm" type="button" id="new-category">
          ${icon('plus', { size: 15 })} New category
        </button>
      </div>
    </div>
    <div class="account-orders-toolbar">
      <span class="tiny muted" id="categories-total">Loading categories…</span>
      <span class="tiny muted">Deactivating a category hides its products until it is reactivated.</span>
    </div>
    <div id="categories-host">${pageLoader()}</div>`;

  bindTabs(dash.content.querySelector('#category-tabs'), (value) => {
    filter = value;
    render();
  });

  const input = dash.content.querySelector('#category-search');
  input.addEventListener(
    'input',
    debounce(() => {
      search = input.value.trim();
      render();
    }, 200)
  );

  dash.content.querySelector('#new-category').addEventListener('click', () => openCategoryForm());
}

function categoryIcon(category) {
  if (category.imageUrl) {
    return `<span class="category-icon"><img src="${escapeHtml(category.imageUrl)}"
      alt="${escapeHtml(category.name)}" loading="lazy"
      style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></span>`;
  }
  return `<span class="category-icon">${icon(category.icon || 'tags', { size: 21 })}</span>`;
}

function categoryCard(category) {
  const viewLink = category.isActive
    ? `<a class="btn btn-ghost btn-sm" href="/explore?category=${encodeURIComponent(category.slug)}"
         target="_blank" rel="noopener">${icon('globe', { size: 15 })} View catalogue</a>`
    : '';

  return `<article class="card">
    <div class="card-body">
      <div class="seller-card-head">
        ${categoryIcon(category)}
        <div class="grow">
          <h3>${escapeHtml(category.name)}</h3>
          <div class="seller-contact">
            <span>${icon('tags', { size: 12 })} /${escapeHtml(category.slug)}</span>
            <span>${icon('list', { size: 12 })} Position ${category.sortOrder}</span>
          </div>
        </div>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          ${statusBadge(category.isActive ? 'active' : 'inactive')}
          <span class="tiny muted">${pluralize(category.productCount, 'live product')}</span>
        </div>
      </div>

      <p class="seller-description">${escapeHtml(
        category.description || 'No description provided for this category.'
      )}</p>

      <div class="seller-actions">
        ${viewLink}
        <button class="btn btn-secondary btn-sm" type="button" data-edit="${category.id}">
          ${icon('edit', { size: 15 })} Edit
        </button>
        <button class="btn ${category.isActive ? 'btn-secondary' : 'btn-success'} btn-sm"
          type="button" data-toggle="${category.id}" data-active="${category.isActive}"
          data-name="${escapeHtml(category.name)}">
          ${category.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  </article>`;
}

function render() {
  const host = dash.content.querySelector('#categories-host');
  const totalHost = dash.content.querySelector('#categories-total');
  const tabsHost = dash.content.querySelector('#category-tabs');

  const activeCount = categories.filter((category) => category.isActive).length;
  updateTabCounts(tabsHost, {
    all: categories.length,
    active: activeCount,
    inactive: categories.length - activeCount
  });

  const needle = search.toLowerCase();
  const visible = categories.filter((category) => {
    if (filter === 'active' && !category.isActive) return false;
    if (filter === 'inactive' && category.isActive) return false;
    if (!needle) return true;
    return [category.name, category.slug, category.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  totalHost.textContent = pluralize(visible.length, 'category', 'categories');

  if (!visible.length) {
    host.innerHTML = `<div class="card">${emptyState({
      iconName: 'tags',
      title: categories.length ? 'No matching categories' : 'No categories yet',
      text: categories.length
        ? `No categories match “${search}”.`
        : 'Create categories so sellers can list their products.',
      action: categories.length
        ? '<button class="btn btn-secondary" type="button" data-clear-filters>Clear filters</button>'
        : '<button class="btn btn-primary" type="button" data-new-category>Create category</button>'
    })}</div>`;
    host.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
      search = '';
      filter = 'all';
      const input = dash.content.querySelector('#category-search');
      if (input) input.value = '';
      const tabsHostEl = dash.content.querySelector('#category-tabs');
      tabsHostEl.querySelectorAll('[data-tab]').forEach((tab) => {
        const active = tab.dataset.tab === 'all';
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      render();
    });
    host.querySelector('[data-new-category]')?.addEventListener('click', () => openCategoryForm());
    return;
  }

  host.innerHTML = `<div class="list-stack">${visible.map(categoryCard).join('')}</div>`;

  host.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const category = categories.find((entry) => entry.id === Number(button.dataset.edit));
      if (category) openCategoryForm(category);
    });
  });

  host.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleCategory(button));
  });
}

function openCategoryForm(category = null) {
  const editing = Boolean(category);
  const backdrop = openModal({
    title: editing ? `Edit ${category.name}` : 'New category',
    subtitle: editing
      ? 'Update how this category appears across the marketplace.'
      : 'Categories group products for buyers and sellers.',
    size: 'narrow',
    body: `
      <div id="category-form-alert"></div>
      <form id="category-form" style="display:grid;gap:15px">
        <div class="form-group">
          <label class="form-label" for="category-name">Category name</label>
          <input class="input" id="category-name" name="name" maxlength="100" required
            value="${escapeHtml(category?.name || '')}" placeholder="e.g. Home & Living">
        </div>
        <div class="form-group">
          <label class="form-label" for="category-description">Description <span class="optional">(optional)</span></label>
          <textarea class="textarea" id="category-description" name="description" rows="3" maxlength="500"
            placeholder="Short description shown on the categories page.">${escapeHtml(
              category?.description || ''
            )}</textarea>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="category-icon">Icon key <span class="optional">(optional)</span></label>
            <input class="input" id="category-icon" name="icon" maxlength="40"
              value="${escapeHtml(category?.icon || '')}" placeholder="devices, sofa, shirt">
            <span class="form-hint">Storefront icon key such as devices, sofa, shirt or basket.</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="category-sort">Sort position</label>
            <input class="input" id="category-sort" name="sortOrder" type="number" min="0" max="999"
              step="1" value="${Number(category?.sortOrder ?? 0)}">
            <span class="form-hint">Lower numbers appear first.</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="category-image">Image URL <span class="optional">(optional)</span></label>
          <input class="input" id="category-image" name="imageUrl" maxlength="500"
            value="${escapeHtml(category?.imageUrl || '')}" placeholder="https://…">
        </div>
        <label class="checkbox">
          <input type="checkbox" id="category-active" ${category?.isActive === false ? '' : 'checked'}>
          <span>Active — buyers can browse this category</span>
        </label>
      </form>`,
    footer: `<button class="btn btn-secondary" type="button" data-close-modal>Cancel</button>
             <button class="btn btn-primary" type="button" id="category-save">
               ${editing ? 'Save changes' : 'Create category'}
             </button>`,
    onMount(modal) {
      const form = modal.querySelector('#category-form');
      const alertHost = modal.querySelector('#category-form-alert');
      const save = modal.querySelector('#category-save');

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        save.click();
      });

      save.addEventListener('click', async () => {
        const name = modal.querySelector('#category-name').value.trim();
        if (name.length < 2) {
          alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
            ${icon('alert-circle', { size: 15 })}<div>Enter a category name with at least 2 characters.</div>
          </div>`;
          modal.querySelector('#category-name').focus();
          return;
        }

        const sortValue = modal.querySelector('#category-sort').value;
        const payload = {
          name,
          description: modal.querySelector('#category-description').value.trim(),
          icon: modal.querySelector('#category-icon').value.trim(),
          imageUrl: modal.querySelector('#category-image').value.trim(),
          isActive: modal.querySelector('#category-active').checked
        };
        if (sortValue !== '') payload.sortOrder = Number(sortValue);

        setButtonLoading(save, true, '');
        try {
          const result = editing
            ? await api.patch(`/admin/categories/${category.id}`, payload)
            : await api.post('/admin/categories', payload);
          closeModal();
          toast(result.message || (editing ? 'Category updated.' : 'Category created.'));
          await load();
        } catch (error) {
          setButtonLoading(save, false);
          alertHost.innerHTML = `<div class="alert danger" style="margin-bottom:14px">
            ${icon('alert-circle', { size: 15 })}<div>${escapeHtml(errorMessage(error))}</div>
          </div>`;
        }
      });
    }
  });

  backdrop.querySelector('input')?.focus();
}

async function toggleCategory(button) {
  const active = button.dataset.active === 'true';

  if (active) {
    const ok = await confirmDialog({
      title: `Deactivate ${button.dataset.name}?`,
      message:
        'Products in this category are hidden from the marketplace until you reactivate it. Sellers keep their listings.',
      confirmLabel: 'Deactivate category',
      danger: true
    });
    if (!ok) return;
  }

  setButtonLoading(button, true, '');
  try {
    const result = await api.patch(`/admin/categories/${button.dataset.toggle}`, {
      isActive: !active
    });
    toast(result.message);
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function load() {
  if (loading || !dash) return;
  loading = true;
  const host = dash.content.querySelector('#categories-host');
  if (host) host.innerHTML = pageLoader();

  try {
    const data = await api.get('/admin/categories');
    categories = data.categories || [];
    render();
  } catch (error) {
    if (host) {
      host.innerHTML = errorState(errorMessage(error));
      host.querySelector('[data-retry]')?.addEventListener('click', load);
    }
  } finally {
    loading = false;
  }
}

async function init() {
  dash = await initDashboard({
    role: 'admin',
    active: '/admin/categories',
    title: 'Categories',
    subtitle: 'Curate the departments buyers browse on STOKANA.',
    actions: '<a class="btn btn-secondary btn-sm" href="/explore" target="_blank" rel="noopener">View catalogue</a>'
  });
  if (!dash) return;

  renderShell();
  await load();
}

init();
