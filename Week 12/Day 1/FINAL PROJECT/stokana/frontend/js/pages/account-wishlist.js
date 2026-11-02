import { api } from '../api.js';
import { initAccount } from '../account-ui.js';
import { productCard, emptyState, errorState, pageLoader, errorMessage } from '../ui.js';

let account = null;
let loading = false;

async function loadWishlist() {
  if (loading) return;
  loading = true;
  account.content.innerHTML = pageLoader();

  try {
    const data = await api.get('/wishlist');
    account.content.innerHTML = data.products.length
      ? `<div class="results-grid">${data.products.map((product) => productCard(product)).join('')}</div>`
      : `<div class="content-card">${emptyState({
          iconName: 'heart',
          title: 'Your wishlist is empty',
          text: 'Save products you like and keep them together here.',
          action: '<a class="btn btn-primary" href="/explore">Explore products</a>'
        })}</div>`;
  } catch (error) {
    account.content.innerHTML = errorState(errorMessage(error));
    account.content.querySelector('[data-retry]')?.addEventListener('click', loadWishlist);
  } finally {
    loading = false;
  }
}

async function init() {
  account = await initAccount({
    active: '/account/wishlist',
    title: 'Wishlist',
    subtitle: 'Products you have saved to come back to.'
  });
  if (!account) return;

  window.addEventListener('wishlist:updated', (event) => {
    if (!event.detail.saved) loadWishlist();
  });
  await loadWishlist();
}

init();
