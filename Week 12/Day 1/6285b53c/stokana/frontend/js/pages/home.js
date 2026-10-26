import { mountSite } from '../layout.js';
import { api } from '../api.js';
import {
  productCard,
  categoryTile,
  shopCard,
  skeletonCards,
  emptyState,
  img
} from '../ui.js';
import { money, escapeHtml, plainNumber } from '../format.js';

function renderHero(products) {
  const host = document.getElementById('hero-collage');
  if (!host) return;
  if (!products.length) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = products
    .slice(0, 4)
    .map(
      (product, index) => `
      <div class="hero-product${index % 2 === 1 ? ' lift' : ''}">
        <a href="/product/${encodeURIComponent(product.slug)}" aria-label="${escapeHtml(product.name)}">${img(
          product.imageUrl,
          product.name
        )}</a>
        <div class="hero-product-info">
          <span>${escapeHtml(product.categoryName)}</span>
          <strong><a href="/product/${encodeURIComponent(product.slug)}" style="color:inherit">${escapeHtml(
            product.name
          )}</a></strong>
          <span class="price">${money(product.price)}</span>
        </div>
      </div>`
    )
    .join('');
}

function renderStats(stats) {
  const map = {
    'stat-products': stats?.productCount,
    'stat-shops': stats?.shopCount,
    'stat-categories': stats?.categoryCount
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value > 0 ? `${plainNumber(value)}+` : '0';
  });
}

async function init() {
  await mountSite();

  document.getElementById('home-popular').innerHTML = skeletonCards(8);
  document.getElementById('home-new').innerHTML = skeletonCards(4);

  const [stats, categories, popular, newest, shops] = await Promise.all([
    api.get('/stats').catch(() => null),
    api.get('/categories').then((data) => data.categories).catch(() => []),
    api.get('/products?sort=popular&limit=8').then((data) => data.products).catch(() => []),
    api.get('/products?sort=newest&limit=4').then((data) => data.products).catch(() => []),
    api.get('/shops?limit=3').then((data) => data.shops).catch(() => [])
  ]);

  renderStats(stats);
  renderHero(popular);

  const categoriesHost = document.getElementById('home-categories');
  categoriesHost.innerHTML = categories.length
    ? categories.map(categoryTile).join('')
    : emptyState({ iconName: 'tags', title: 'Categories are on the way', text: 'Please check back shortly.' });

  const popularHost = document.getElementById('home-popular');
  popularHost.innerHTML = popular.length
    ? popular.map((product) => productCard(product)).join('')
    : emptyState({
        iconName: 'package',
        title: 'No products yet',
        text: 'New products will appear here as soon as sellers publish them.',
        action: '<a class="btn" href="/explore">Explore the marketplace</a>'
      });

  const newHost = document.getElementById('home-new');
  newHost.innerHTML = newest.length
    ? newest.map((product) => productCard(product)).join('')
    : emptyState({ iconName: 'sparkles', title: 'Fresh stock coming soon', text: 'Check back for the latest arrivals.' });

  const shopsHost = document.getElementById('home-shops');
  shopsHost.innerHTML = shops.length
    ? shops.map(shopCard).join('')
    : emptyState({ iconName: 'store', title: 'Shops are opening soon', text: 'Meet our first verified sellers shortly.' });
}

init();
