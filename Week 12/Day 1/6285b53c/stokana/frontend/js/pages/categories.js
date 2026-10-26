import { mountSite } from '../layout.js';
import { api } from '../api.js';
import { icon } from '../icons.js';
import { emptyState, errorState, toast, errorMessage } from '../ui.js';
import { escapeHtml, plainNumber } from '../format.js';

const grid = document.getElementById('category-grid');

function categoryCard(category) {
  const iconName =
    category.icon === 'phone'
      ? 'smartphone'
      : category.icon === 'activity'
      ? 'dumbbell'
      : category.icon === 'sofa'
      ? 'home'
      : category.icon || 'tags';

  return `
    <a class="category-card" href="/explore?category=${encodeURIComponent(category.slug)}">
      <span class="category-icon">${icon(iconName, { size: 22 })}</span>
      <span class="category-card-body">
        <strong>${escapeHtml(category.name)}</strong>
        <p>${escapeHtml(category.description || 'Explore this category from verified Kenyan shops.')}</p>
        <span>${plainNumber(category.productCount || 0)} ${Number(category.productCount) === 1 ? 'product' : 'products'}</span>
      </span>
      ${icon('chevron-right', { size: 18 })}
    </a>`;
}

function renderLoading() {
  grid.classList.add('large');
  grid.innerHTML = Array.from(
    { length: 6 },
    () => '<div class="skeleton" style="height:116px;border-radius:14px"></div>'
  ).join('');
}

async function load() {
  renderLoading();
  try {
    const data = await api.get('/categories');
    const categories = data.categories || [];
    if (!categories.length) {
      grid.innerHTML = emptyState({
        iconName: 'tags',
        title: 'No categories yet',
        text: 'Categories will appear here once the marketplace is set up.',
        action: '<a class="btn btn-primary" href="/explore">Browse all products</a>'
      });
      return;
    }
    grid.innerHTML = categories.map(categoryCard).join('');
  } catch (error) {
    grid.innerHTML = errorState(errorMessage(error));
    grid.querySelector('[data-retry]')?.addEventListener('click', load);
    toast(errorMessage(error), 'error');
  }
}

async function init() {
  await mountSite();
  load();
}

init();
