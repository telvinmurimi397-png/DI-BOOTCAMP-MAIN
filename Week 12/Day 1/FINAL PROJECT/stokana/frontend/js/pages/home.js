import { mountSite } from '../layout.js';
import { api, queryString } from '../api.js';
import {
  productCard,
  categoryTile,
  shopCard,
  skeletonCards,
  emptyState
} from '../ui.js';
import { plainNumber } from '../format.js';
import { getRecentlyViewedSlugs } from '../recently-viewed.js';

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

  const [stats, categories, popular, newest, shops, recommendations] = await Promise.all([
    api.get('/stats').catch(() => null),
    api.get('/categories').then((data) => data.categories).catch(() => []),
    api.get('/products?sort=popular&limit=8').then((data) => data.products).catch(() => []),
    api.get('/products?sort=newest&limit=4').then((data) => data.products).catch(() => []),
    api.get('/shops?limit=3').then((data) => data.shops).catch(() => []),
    api.get('/products/recommendations').then((data) => data.products).catch(() => [])
  ]);

  renderStats(stats);

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

  const recommendationsHost = document.getElementById('home-recommendations');
  if (recommendationsHost && recommendations.length) {
    recommendationsHost.innerHTML = recommendations.map((product) => productCard(product)).join('');
    document.getElementById('recommendations-section').style.display = '';
  }

  const shopsHost = document.getElementById('home-shops');
  shopsHost.innerHTML = shops.length
    ? shops.map(shopCard).join('')
    : emptyState({ iconName: 'store', title: 'Shops are opening soon', text: 'Meet our first verified sellers shortly.' });

  const recentSlugs = getRecentlyViewedSlugs();
  if (recentSlugs.length) {
    const recent = await api.get(`/products/recently-viewed${queryString({ slugs: recentSlugs.join(',') })}`)
      .then((data) => data.products)
      .catch(() => []);
    if (recent.length) {
      document.getElementById('home-recently-viewed').innerHTML = recent
        .map((product) => productCard(product))
        .join('');
      document.getElementById('recently-viewed-section').style.display = '';
    }
  }
}

init();
