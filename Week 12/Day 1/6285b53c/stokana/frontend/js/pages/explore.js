import { mountSite } from '../layout.js';
import { api, queryString } from '../api.js';
import {
  productCard,
  skeletonCards,
  emptyState,
  errorState,
  paginationHtml,
  toast,
  errorMessage
} from '../ui.js';
import { escapeHtml, plainNumber } from '../format.js';

const resultsGrid = document.getElementById('results-grid');
const paginationHost = document.getElementById('results-pagination');
const categoriesHost = document.getElementById('filter-categories');
const activeHost = document.getElementById('active-filters');
const titleEl = document.getElementById('explore-title');
const subtitleEl = document.getElementById('explore-subtitle');
const countEl = document.getElementById('results-count');
const sortSelect = document.getElementById('sort-select');
const priceMin = document.getElementById('price-min');
const priceMax = document.getElementById('price-max');
const inStock = document.getElementById('in-stock');
const featuredOnly = document.getElementById('featured-only');
const filterPanel = document.getElementById('filter-panel');

let categories = [];
let loading = false;

function params() {
  const search = new URLSearchParams(window.location.search);
  return {
    q: search.get('q') || '',
    category: search.get('category') || '',
    minPrice: search.get('minPrice') || '',
    maxPrice: search.get('maxPrice') || '',
    inStock: search.get('inStock') === 'true',
    featured: search.get('featured') === 'true',
    sort: search.get('sort') || 'newest',
    page: Number(search.get('page')) || 1
  };
}

function setParams(updates, { resetPage = true } = {}) {
  const next = new URLSearchParams(window.location.search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) next.delete(key);
    else next.set(key, value);
  });
  if (resetPage) next.delete('page');
  const query = next.toString();
  window.history.pushState({}, '', `/explore${query ? `?${query}` : ''}`);
  load();
}

function categoryFor(slug) {
  return categories.find((category) => category.slug === slug);
}

function renderCategories(current) {
  categoriesHost.innerHTML = `
    <a href="/explore" class="${!current.category ? 'active' : ''}" data-category="">
      <span>All products</span>
    </a>
    ${categories
      .map(
        (category) => `<a href="/explore?category=${encodeURIComponent(category.slug)}" class="${
          current.category === category.slug ? 'active' : ''
        }" data-category="${escapeHtml(category.slug)}">
          <span>${escapeHtml(category.name)}</span>
          <span class="count">${plainNumber(category.productCount)}</span>
        </a>`
      )
      .join('')}`;

  categoriesHost.querySelectorAll('[data-category]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      setParams({ category: link.dataset.category || null });
      filterPanel.classList.remove('open');
    });
  });
}

function filterChip(label, key) {
  return `<button class="filter-chip active" type="button" data-remove-filter="${key}">
    ${escapeHtml(label)}
    <span class="x"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></span>
  </button>`;
}

function renderActive(current) {
  const chips = [];
  if (current.q) chips.push(filterChip(`“${current.q}”`, 'q'));
  if (current.category) {
    chips.push(filterChip(categoryFor(current.category)?.name || current.category, 'category'));
  }
  if (current.minPrice || current.maxPrice) {
    const label =
      current.minPrice && current.maxPrice
        ? `KSh ${plainNumber(current.minPrice)} – ${plainNumber(current.maxPrice)}`
        : current.minPrice
        ? `From KSh ${plainNumber(current.minPrice)}`
        : `Up to KSh ${plainNumber(current.maxPrice)}`;
    chips.push(filterChip(label, 'price'));
  }
  if (current.inStock) chips.push(filterChip('In stock', 'inStock'));
  if (current.featured) chips.push(filterChip('Featured', 'featured'));

  activeHost.innerHTML = chips.join('');

  activeHost.querySelectorAll('[data-remove-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.removeFilter;
      if (key === 'price') setParams({ minPrice: null, maxPrice: null });
      else setParams({ [key]: null });
    });
  });
}

function syncControls(current) {
  sortSelect.value = current.sort;
  priceMin.value = current.minPrice;
  priceMax.value = current.maxPrice;
  inStock.checked = current.inStock;
  featuredOnly.checked = current.featured;
}

function renderHeading(current, total) {
  const category = current.category ? categoryFor(current.category) : null;
  if (current.q) {
    titleEl.textContent = `Results for “${current.q}”`;
    subtitleEl.textContent = `${plainNumber(total)} ${total === 1 ? 'product' : 'products'} matched your search.`;
  } else if (category) {
    titleEl.textContent = category.name;
    subtitleEl.textContent = category.description || 'Products from verified Kenyan sellers.';
  } else {
    titleEl.textContent = 'Explore the marketplace';
    subtitleEl.textContent = 'Quality products from shops verified by STOKANA.';
  }
  document.title = `${titleEl.textContent} · STOKANA`;
  countEl.textContent = `${plainNumber(total)} ${total === 1 ? 'product' : 'products'}`;
}

function renderEmpty() {
  resultsGrid.innerHTML = `<div class="results-empty">${emptyState({
    iconName: 'search',
    title: 'No products found',
    text: 'Try a different search term or clear some filters to see more of the marketplace.',
    action: '<button class="btn btn-secondary" type="button" data-reset-search>Clear filters</button>'
  })}</div>`;
  resultsGrid.querySelector('[data-reset-search]')?.addEventListener('click', () => {
    window.history.pushState({}, '', '/explore');
    load();
  });
  paginationHost.innerHTML = '';
}

async function load() {
  if (loading) return;
  loading = true;
  const current = params();

  syncControls(current);
  renderCategories(current);
  renderActive(current);
  resultsGrid.innerHTML = skeletonCards(6);
  paginationHost.innerHTML = '';
  countEl.textContent = 'Loading products…';

  try {
    const result = await api.get(
      `/products${queryString({
        q: current.q,
        category: current.category,
        minPrice: current.minPrice,
        maxPrice: current.maxPrice,
        inStock: current.inStock ? 'true' : '',
        featured: current.featured ? 'true' : '',
        sort: current.sort,
        page: current.page,
        limit: 12
      })}`
    );

    renderHeading(current, result.pagination.total);

    if (!result.products.length) {
      renderEmpty();
      return;
    }

    resultsGrid.innerHTML = result.products.map((product) => productCard(product)).join('');
    paginationHost.innerHTML = paginationHtml(result.pagination);
    paginationHost.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const page = Number(button.dataset.page);
        if (!page || button.disabled) return;
        const url = new URL(window.location.href);
        if (page === 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.pushState({}, '', url);
        document.querySelector('.explore-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        load();
      });
    });
  } catch (error) {
    resultsGrid.innerHTML = `<div class="results-empty">${errorState(errorMessage(error))}</div>`;
    resultsGrid.querySelector('[data-retry]')?.addEventListener('click', load);
    countEl.textContent = 'Could not load';
    toast(errorMessage(error), 'error');
  } finally {
    loading = false;
  }
}

async function init() {
  await mountSite();

  sortSelect.addEventListener('change', (event) => {
    setParams({ sort: event.target.value === 'newest' ? null : event.target.value });
  });
  inStock.addEventListener('change', (event) => {
    setParams({ inStock: event.target.checked ? 'true' : null });
  });
  featuredOnly.addEventListener('change', (event) => {
    setParams({ featured: event.target.checked ? 'true' : null });
  });
  document.getElementById('price-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const min = priceMin.value.trim();
    const max = priceMax.value.trim();
    if (min && max && Number(min) > Number(max)) {
      toast('Minimum price cannot be greater than maximum price.', 'error');
      return;
    }
    setParams({ minPrice: min, maxPrice: max });
  });
  document.getElementById('clear-filters').addEventListener('click', () => {
    window.history.pushState({}, '', '/explore');
    load();
  });
  document.getElementById('toggle-filters').addEventListener('click', () => {
    filterPanel.classList.toggle('open');
  });
  window.addEventListener('popstate', load);

  try {
    const data = await api.get('/categories');
    categories = data.categories || [];
  } catch {
    categories = [];
  }

  await load();
}

init();
