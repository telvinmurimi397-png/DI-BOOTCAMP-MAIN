import { mountSite } from '../layout.js';
import { api, queryString } from '../api.js';
import { shopCard, emptyState, errorState, toast, errorMessage } from '../ui.js';
import { debounce, plainNumber } from '../format.js';

const grid = document.getElementById('shop-grid');
const countEl = document.getElementById('shop-count');
const searchForm = document.getElementById('shop-search');
const searchInput = document.getElementById('shop-search-input');

let currentQuery = new URLSearchParams(window.location.search).get('q') || '';
searchInput.value = currentQuery;

function skeletons() {
  return Array.from(
    { length: 6 },
    () => '<div class="skeleton" style="height:190px;border-radius:var(--radius)"></div>'
  ).join('');
}

async function load() {
  grid.innerHTML = skeletons();
  countEl.textContent = 'Loading shops…';

  try {
    const data = await api.get(`/shops${queryString({ q: currentQuery, limit: 24 })}`);
    const shops = data.shops || [];
    countEl.textContent = `${plainNumber(shops.length)} ${shops.length === 1 ? 'shop' : 'shops'}${
      currentQuery ? ` matching “${currentQuery}”` : ' on STOKANA'
    }`;

    if (!shops.length) {
      grid.innerHTML = emptyState({
        iconName: 'store',
        title: currentQuery ? 'No shops matched your search' : 'No shops yet',
        text: currentQuery
          ? 'Try a different shop name, or browse all shops instead.'
          : 'New shops are reviewed every day. Check back soon.',
        action: '<a class="btn btn-secondary" href="/shops">Browse all shops</a>'
      });
      return;
    }

    grid.innerHTML = shops.map((shop) => shopCard(shop)).join('');
  } catch (error) {
    grid.innerHTML = errorState(errorMessage(error));
    grid.querySelector('[data-retry]')?.addEventListener('click', load);
    toast(errorMessage(error), 'error');
    countEl.textContent = 'Could not load shops';
  }
}

function updateQuery(value) {
  currentQuery = value.trim();
  const url = new URL(window.location.href);
  if (currentQuery) url.searchParams.set('q', currentQuery);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url);
  load();
}

async function init() {
  await mountSite();

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateQuery(searchInput.value);
  });
  searchInput.addEventListener(
    'input',
    debounce(() => updateQuery(searchInput.value), 350)
  );

  load();
}

init();
