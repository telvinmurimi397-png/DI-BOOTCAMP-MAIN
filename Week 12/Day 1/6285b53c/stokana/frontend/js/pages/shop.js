import { mountSite } from '../layout.js';
import { api, queryString } from '../api.js';
import { getUser, goToLogin } from '../auth.js';
import { icon } from '../icons.js';
import {
  productCard,
  stars,
  paginationHtml,
  emptyState,
  errorState,
  toast,
  setButtonLoading,
  errorMessage
} from '../ui.js';
import { escapeHtml, formatDate, initials, pluralize, debounce } from '../format.js';

const pageHost = document.getElementById('shop-page');
const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');

let shop = null;
let user = null;
let loading = false;
let searchTerm = '';
let sort = 'newest';
let page = 1;

function params() {
  const url = new URL(window.location.href);
  return {
    q: url.searchParams.get('q') || '',
    sort: url.searchParams.get('sort') || 'newest',
    page: Number(url.searchParams.get('page')) || 1
  };
}

function syncHistory() {
  const url = new URL(window.location.href);
  if (searchTerm) url.searchParams.set('q', searchTerm);
  else url.searchParams.delete('q');
  if (sort !== 'newest') url.searchParams.set('sort', sort);
  else url.searchParams.delete('sort');
  if (page > 1) url.searchParams.set('page', String(page));
  else url.searchParams.delete('page');
  window.history.pushState({}, '', url);
}

function heroHtml() {
  const logo = shop.logoUrl
    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.shopName)}">`
    : initials(shop.shopName);
  const isOwner = user?.role === 'seller' && user.id === shop.sellerId;

  return `
    <div class="shop-hero">
      <div class="container shop-hero-inner">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          ${icon('chevron-right', { size: 12 })}
          <a href="/shops">Shops</a>
          ${icon('chevron-right', { size: 12 })}
          <span>${escapeHtml(shop.shopName)}</span>
        </nav>
        <div class="shop-header">
          <span class="shop-logo">${logo}</span>
          <div class="grow">
            <h1>${escapeHtml(shop.shopName)}</h1>
            <div class="row">
              <span>${icon('map-pin', { size: 13 })} ${escapeHtml(shop.town || shop.county || 'Kenya')}${
    shop.county && shop.town ? `, ${escapeHtml(shop.county)}` : ''
  }</span>
              <span>${icon('package', { size: 13 })} ${pluralize(shop.productCount, 'product')}</span>
              <span>${icon('star-filled', { size: 13 })} ${Number(shop.ratingAverage || 0).toFixed(1)} · ${pluralize(
    shop.reviewCount,
    'review'
  )}</span>
              <span>${icon('calendar', { size: 13 })} Joined ${formatDate(shop.createdAt, { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div style="flex-shrink:0">
            ${
              isOwner
                ? `<a class="btn btn-secondary" href="/seller">${icon('dashboard', { size: 16 })} Seller dashboard</a>`
                : `<button class="btn btn-secondary" type="button" id="shop-chat">${icon('message', { size: 16 })} Message shop</button>`
            }
          </div>
        </div>
      </div>
    </div>`;
}

function toolbarHtml() {
  return `
    <div class="shop-toolbar">
      <div>
        <h2 style="font-size:19px">Shop products</h2>
        <span class="muted" id="shop-product-count" style="font-size:12px">Loading products…</span>
      </div>
      <div class="row" style="gap:9px;flex-wrap:wrap">
        <div class="input-group" style="width:210px">
          <span class="input-icon">${icon('search', { size: 16 })}</span>
          <input class="input" type="search" id="shop-product-search" value="${escapeHtml(
            searchTerm
          )}" placeholder="Search this shop" aria-label="Search products in this shop" style="height:40px">
        </div>
        <select class="select" id="shop-sort" aria-label="Sort products" style="width:auto;height:40px">
          <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest first</option>
          <option value="popular" ${sort === 'popular' ? 'selected' : ''}>Most popular</option>
          <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Top rated</option>
          <option value="price_asc" ${sort === 'price_asc' ? 'selected' : ''}>Price: low to high</option>
          <option value="price_desc" ${sort === 'price_desc' ? 'selected' : ''}>Price: high to low</option>
        </select>
      </div>
    </div>`;
}

function layoutHtml() {
  return `
    ${heroHtml()}
    <div class="container shop-main">
      <div id="shop-toolbar-host">${toolbarHtml()}</div>
      <div class="results-grid" id="shop-products"></div>
      <div id="shop-pagination"></div>
      <div class="shop-about" style="margin-top:30px">
        <div class="content-card">
          <h2 style="font-size:19px;margin-bottom:10px">About this shop</h2>
          <p class="prose">${escapeHtml(
            shop.description || 'This verified STOKANA shop has not added a description yet.'
          )}</p>
          <div class="spec-grid" style="margin-top:18px">
            <div class="summary-line"><span>Location</span><span>${escapeHtml(shop.town || 'Kenya')}${
    shop.county ? ` · ${escapeHtml(shop.county)}` : ''
  }</span></div>
            <div class="summary-line"><span>Products</span><span>${pluralize(shop.productCount, 'product')}</span></div>
            <div class="summary-line"><span>Rating</span><span>${stars(shop.ratingAverage, {
    count: shop.reviewCount,
    size: 11
  })}</span></div>
            <div class="summary-line"><span>Joined</span><span>${formatDate(shop.createdAt)}</span></div>
          </div>
        </div>
        <div class="content-card">
          <h2 style="font-size:17px;margin-bottom:10px">Shop with confidence</h2>
          <div class="delivery-note" style="border-top:0;padding-top:0;gap:12px">
            <div>${icon('shield-check', { size: 16 })} <span>Reviewed and approved by STOKANA</span></div>
            <div>${icon('message', { size: 16 })} <span>Message the seller before you order</span></div>
            <div>${icon('truck', { size: 16 })} <span>Delivery arranged directly with the shop</span></div>
          </div>
          <a class="btn btn-secondary btn-block" style="margin-top:16px" href="/explore?shop=${encodeURIComponent(
            shop.shopSlug
          )}">View all products</a>
        </div>
      </div>
    </div>`;
}

function bindToolbar() {
  document.getElementById('shop-sort')?.addEventListener('change', (event) => {
    sort = event.target.value;
    page = 1;
    syncHistory();
    loadProducts();
  });

  document.getElementById('shop-product-search')?.addEventListener(
    'input',
    debounce((event) => {
      searchTerm = event.target.value.trim();
      page = 1;
      syncHistory();
      loadProducts();
    }, 320)
  );

  document.getElementById('shop-chat')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    user = await getUser();
    if (!user) {
      goToLogin();
      return;
    }
    if (user.role !== 'buyer') {
      toast('Sign in with a buyer account to message shops.', 'error');
      return;
    }
    setButtonLoading(button, true, 'Opening chat…');
    try {
      const data = await api.post('/messages/conversations', { sellerId: shop.sellerId });
      window.location.href = `/account/messages?conversation=${data.conversation.id}`;
    } catch (error) {
      toast(errorMessage(error), 'error');
      setButtonLoading(button, false);
    }
  });
}

function skeletons() {
  return Array.from({ length: 4 }, () => '<div class="skeleton skeleton-card"></div>').join('');
}

async function loadProducts() {
  if (loading) return;
  loading = true;
  const grid = document.getElementById('shop-products');
  const paginationHost = document.getElementById('shop-pagination');
  const countEl = document.getElementById('shop-product-count');
  grid.innerHTML = skeletons();
  paginationHost.innerHTML = '';
  if (countEl) countEl.textContent = 'Loading products…';

  try {
    const data = await api.get(
      `/products${queryString({
        shop: slug,
        q: searchTerm,
        sort,
        page,
        limit: 12
      })}`
    );

    if (countEl) {
      countEl.textContent = `${pluralize(data.pagination.total, 'product')}${
        searchTerm ? ` matching “${searchTerm}”` : ' available'
      }`;
    }

    if (!data.products.length) {
      grid.innerHTML = emptyState({
        iconName: 'package',
        title: searchTerm ? 'No products matched' : 'No products yet',
        text: searchTerm
          ? 'Try a different search term to find something in this shop.'
          : 'This shop has not published any products yet. Check back soon.',
        action: searchTerm
          ? '<button class="btn btn-secondary" type="button" data-clear-shop-search>Clear search</button>'
          : '<a class="btn btn-secondary" href="/explore">Explore other products</a>'
      });
      grid.querySelector('[data-clear-shop-search]')?.addEventListener('click', () => {
        searchTerm = '';
        page = 1;
        syncHistory();
        const input = document.getElementById('shop-product-search');
        if (input) input.value = '';
        loadProducts();
      });
      return;
    }

    grid.innerHTML = data.products.map((product) => productCard(product)).join('');
    paginationHost.innerHTML = paginationHtml(data.pagination);
    paginationHost.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextPage = Number(button.dataset.page);
        if (!nextPage || button.disabled) return;
        page = nextPage;
        syncHistory();
        document.getElementById('shop-toolbar-host')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        loadProducts();
      });
    });
  } catch (error) {
    grid.innerHTML = errorState(errorMessage(error));
    grid.querySelector('[data-retry]')?.addEventListener('click', loadProducts);
    toast(errorMessage(error), 'error');
    if (countEl) countEl.textContent = 'Could not load products';
  } finally {
    loading = false;
  }
}

async function init() {
  await mountSite();
  user = await getUser();

  const initial = params();
  searchTerm = initial.q;
  sort = initial.sort;
  page = initial.page;

  try {
    const data = await api.get(`/shops/${encodeURIComponent(slug)}`);
    shop = data.shop;
    document.title = `${shop.shopName} · STOKANA`;
    pageHost.innerHTML = layoutHtml();
    bindToolbar();
    loadProducts();
  } catch (error) {
    pageHost.innerHTML = `<div class="container" style="padding:60px 0">${
      error?.status === 404
        ? emptyState({
            iconName: 'store',
            title: 'Shop not found',
            text: 'This shop may no longer be available on STOKANA.',
            action: '<a class="btn btn-primary" href="/shops">Browse all shops</a>'
          })
        : errorState(errorMessage(error))
    }</div>`;
    if (error?.status !== 404) {
      pageHost.querySelector('[data-retry]')?.addEventListener('click', init);
    }
  }
}

init();
