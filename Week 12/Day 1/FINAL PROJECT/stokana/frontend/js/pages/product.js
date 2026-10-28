import { mountSite, refreshCartBadge } from '../layout.js';
import { api } from '../api.js';
import { getUser, goToLogin } from '../auth.js';
import { icon } from '../icons.js';
import {
  productCard,
  stars,
  img,
  toast,
  setButtonLoading,
  errorState,
  errorMessage,
  PLACEHOLDER
} from '../ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  statusMeta,
  initials,
  pluralize
} from '../format.js';

const root = document.getElementById('product-page');
const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');

let product = null;
let related = [];
let reviews = [];
let recentReviews = [];
let reviewPagination = null;
let quantity = 1;
let user = null;

function galleryHtml() {
  const images = product.images?.length
    ? product.images
    : [{ id: 0, url: PLACEHOLDER, altText: product.name }];
  const main = images[0];

  return `
    <div class="gallery">
      ${
        images.length > 1
          ? `<div class="gallery-thumbs">
              ${images
                .map(
                  (image, index) => `<button class="gallery-thumb ${index === 0 ? 'active' : ''}" type="button" data-gallery-thumb="${index}" aria-label="View image ${index + 1}">
                    ${img(image.url, image.altText || product.name)}
                  </button>`
                )
                .join('')}
            </div>`
          : ''
      }
      <div class="gallery-main">
        <img id="gallery-main-image" src="${escapeHtml(main.url || PLACEHOLDER)}" alt="${escapeHtml(main.altText || product.name)}">
        <div class="gallery-flags">
          ${Number(product.stock) <= 0 ? '<span class="badge red">Sold out</span>' : ''}
          ${product.isFeatured ? '<span class="badge blue">Featured</span>' : ''}
        </div>
      </div>
    </div>`;
}

function stockLine() {
  const stock = Number(product.stock);
  if (stock <= 0) {
    return `<span class="stock-out">${icon('alert-circle', { size: 14 })} Sold out</span><span class="muted">${product.shopName}</span>`;
  }
  const cls = stock <= 5 ? 'stock-low' : 'stock-in';
  return `<span class="${cls}">${icon(stock <= 5 ? 'alert-circle' : 'check-circle', { size: 14 })} ${
    stock <= 5 ? `Only ${stock} left` : 'In stock'
  }</span><span class="muted">${escapeHtml(pluralize(stock, 'item'))} available</span>`;
}

function buyBoxHtml() {
  const soldOut = Number(product.stock) <= 0;
  const isOwner = user?.role === 'seller' && user.id === product.sellerId;

  return `
    <div class="product-buy">
      <div class="stock-line">${stockLine()}</div>
      <div class="buy-row">
        <div class="qty" data-qty>
          <button type="button" data-qty-step="-1" aria-label="Decrease quantity" ${soldOut ? 'disabled' : ''}>${icon('minus', { size: 15 })}</button>
          <span data-qty-value>1</span>
          <button type="button" data-qty-step="1" aria-label="Increase quantity" ${soldOut ? 'disabled' : ''}>${icon('plus', { size: 15 })}</button>
        </div>
        <button class="btn btn-shopping" type="button" id="add-to-cart" ${soldOut ? 'disabled' : ''}>
          ${icon('cart', { size: 17 })} ${soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
      <button class="btn btn-shopping btn-block" type="button" id="buy-now" ${soldOut ? 'disabled' : ''}>
        Buy now
      </button>
      <div class="buy-secondary">
        ${
          isOwner
            ? `<a class="btn btn-ghost" href="/seller/products/edit?slug=${encodeURIComponent(product.slug)}">${icon('edit', { size: 15 })} Manage product</a>`
            : `<button class="btn btn-ghost" type="button" id="chat-seller">${icon('message', { size: 15 })} Chat with seller</button>`
        }
        <button class="btn btn-ghost" type="button" id="share-product">${icon('send', { size: 15 })} Share</button>
      </div>
      <div class="delivery-note">
        <div>${icon('truck', { size: 14 })} Delivery arranged directly with the seller</div>
        <div>${icon('shield-check', { size: 14 })} Pay on STOKANA for buyer protection</div>
        <div>${icon('headset', { size: 14 })} Chat before you buy to confirm details</div>
      </div>
    </div>`;
}

function sellerMiniHtml() {
  const logo = product.shopLogoUrl
    ? `<img src="${escapeHtml(product.shopLogoUrl)}" alt="${escapeHtml(product.shopName)}">`
    : initials(product.shopName);

  return `
    <a class="seller-mini" href="/shop/${encodeURIComponent(product.shopSlug)}">
      <span class="shop-logo">${logo}</span>
      <span class="grow">
        <strong>${escapeHtml(product.shopName)}</strong>
        <span>${escapeHtml(product.shopTown || product.shopCounty || 'Kenya')} · ${pluralize(product.shopProductCount, 'product')}</span>
      </span>
      ${icon('chevron-right', { size: 17, className: 'muted' })}
    </a>`;
}

function reviewItemHtml(review) {
  return `
    <div class="review-item">
      <div class="review-head">
        <span class="avatar sm soft">${escapeHtml(initials(review.buyerName))}</span>
        <div class="grow">
          <strong>${escapeHtml(review.buyerName)}</strong>
          <span>${formatDate(review.createdAt)} · Verified buyer</span>
        </div>
        ${stars(review.rating, { size: 12 })}
      </div>
      ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
      ${review.comment ? `<p class="review-body">${escapeHtml(review.comment)}</p>` : ''}
    </div>`;
}

function reviewsBodyHtml() {
  if (!reviews.length) {
    return `<div class="empty-state" style="padding:34px 18px">${icon('message', { size: 24 })}<h3 style="font-size:15px">No reviews yet</h3><p style="font-size:12.5px">Reviews appear here after buyers receive their orders.</p></div>`;
  }
  return reviews.map(reviewItemHtml).join('');
}

function reviewFooterHtml() {
  if (!reviewPagination || reviewPagination.totalPages <= 1) return '';
  const { page, totalPages } = reviewPagination;
  return `
    <div class="row-between" style="margin-top:16px;gap:10px">
      <button class="btn btn-ghost btn-sm" type="button" data-review-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
        ${icon('chevron-left', { size: 14 })} Newer
      </button>
      <span class="muted" style="font-size:11.5px">Page ${page} of ${totalPages}</span>
      <button class="btn btn-ghost btn-sm" type="button" data-review-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>
        Older ${icon('chevron-right', { size: 14 })}
      </button>
    </div>`;
}

function bindGallery() {
  const thumbs = root.querySelectorAll('[data-gallery-thumb]');
  const mainImage = document.getElementById('gallery-main-image');
  if (!mainImage || !product.images?.length) return;
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const image = product.images[Number(thumb.dataset.galleryThumb)];
      if (!image) return;
      mainImage.src = image.url || PLACEHOLDER;
      mainImage.alt = image.altText || product.name;
      thumbs.forEach((item) => item.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function bindQty() {
  const host = root.querySelector('[data-qty]');
  const valueEl = root.querySelector('[data-qty-value]');
  if (!host || !valueEl) return;
  host.querySelectorAll('[data-qty-step]').forEach((button) => {
    button.addEventListener('click', () => {
      quantity = Math.min(Math.max(1, quantity + Number(button.dataset.qtyStep)), Number(product.stock));
      valueEl.textContent = String(quantity);
      host.querySelector('[data-qty-step="-1"]').disabled = quantity <= 1;
      host.querySelector('[data-qty-step="1"]').disabled = quantity >= Number(product.stock);
    });
  });
}

async function ensureBuyer() {
  user = await getUser();
  if (!user) {
    goToLogin();
    return false;
  }
  if (user.role !== 'buyer') {
    toast('Sign in with a buyer account to shop and message sellers.', 'error');
    return false;
  }
  return true;
}

async function addToCart(button) {
  if (!(await ensureBuyer())) return false;
  setButtonLoading(button, true, 'Adding…');
  try {
    await api.post('/cart/items', { productId: product.id, quantity });
    toast(`${product.name} added to your cart.`);
    refreshCartBadge();
    return true;
  } catch (error) {
    toast(errorMessage(error), 'error');
    return false;
  } finally {
    setButtonLoading(button, false);
  }
}

function bindActions() {
  bindQty();

  const addButton = document.getElementById('add-to-cart');
  addButton?.addEventListener('click', () => addToCart(addButton));

  const buyButton = document.getElementById('buy-now');
  buyButton?.addEventListener('click', async () => {
    const added = await addToCart(buyButton);
    if (added) window.location.href = '/checkout';
  });

  const chatButton = document.getElementById('chat-seller');
  chatButton?.addEventListener('click', async () => {
    if (!(await ensureBuyer())) return;
    setButtonLoading(chatButton, true, 'Opening chat…');
    try {
      const data = await api.post('/messages/conversations', { sellerId: product.sellerId });
      window.location.href = `/account/messages?conversation=${data.conversation.id}`;
    } catch (error) {
      toast(errorMessage(error), 'error');
      setButtonLoading(chatButton, false);
    }
  });

  document.getElementById('share-product')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Product link copied to your clipboard.');
    } catch {
      toast('Your browser blocked clipboard access. Copy the address bar link instead.', 'error');
    }
  });

  document.getElementById('show-all-reviews')?.addEventListener('click', () => loadAllReviews(1));
  root.querySelectorAll('[data-review-page]').forEach((button) => {
    button.addEventListener('click', () => loadAllReviews(Number(button.dataset.reviewPage)));
  });
}

async function loadAllReviews(page) {
  try {
    const data = await api.get(
      `/products/${encodeURIComponent(slug)}/reviews?page=${page}&limit=5`
    );
    reviews = data.reviews || [];
    reviewPagination = data.pagination;
    const list = document.getElementById('reviews-list');
    const footer = document.getElementById('reviews-footer');
    if (list) list.innerHTML = reviewsBodyHtml();
    if (footer) footer.innerHTML = reviewFooterHtml();
    root.querySelectorAll('[data-review-page]').forEach((button) => {
      button.addEventListener('click', () => loadAllReviews(Number(button.dataset.reviewPage)));
    });
    document.getElementById('reviews-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

function render() {
  const soldOut = Number(product.stock) <= 0;
  const compare = Number(product.compareAtPrice) || 0;
  const price = Number(product.price);
  const discount = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
  const condition = statusMeta(product.condition);

  reviews = recentReviews;
  reviewPagination = null;

  root.innerHTML = `
    <div class="product-detail">
      <div>${galleryHtml()}</div>
      <div class="product-info">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          ${icon('chevron-right', { size: 12 })}
          <a href="/explore?category=${encodeURIComponent(product.categorySlug)}">${escapeHtml(product.categoryName)}</a>
          ${icon('chevron-right', { size: 12 })}
          <span>${escapeHtml(product.name)}</span>
        </nav>
        <div class="product-info-top">
          <span class="badge ${condition.tone}">${escapeHtml(condition.label)}</span>
          ${product.isFeatured ? '<span class="badge blue">Featured</span>' : ''}
          ${soldOut ? '<span class="badge red">Sold out</span>' : ''}
        </div>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="product-info-top">
          ${stars(product.ratingAverage, { count: product.ratingCount })}
          <span class="muted" style="font-size:12px">·</span>
          <a class="link-quiet" href="#reviews" style="font-size:12px">${pluralize(product.ratingCount, 'review')}</a>
          <span class="muted" style="font-size:12px">·</span>
          <span class="muted" style="font-size:12px">${escapeHtml(product.location || product.shopTown || 'Kenya')}</span>
        </div>
        <div class="product-info-top">
          <span class="price">${money(price)}</span>
          ${compare > price ? `<span class="price-was">${money(compare)}</span><span class="badge red">Save ${discount}%</span>` : ''}
        </div>
        <p class="muted" style="font-size:13px;line-height:1.65">${escapeHtml(
          product.description ? product.description.slice(0, 160) : 'Quality product from a verified STOKANA shop.'
        )}</p>
        ${buyBoxHtml()}
        ${sellerMiniHtml()}
      </div>
    </div>

    <div class="product-content">
      <div>
        <div class="content-card">
          <h2>About this product</h2>
          <p class="prose">${escapeHtml(
            product.description || 'The seller has not added a description for this product yet. Use chat to ask them for more details.'
          )}</p>
        </div>
        <div class="content-card">
          <h2>Product details</h2>
          <div class="spec-grid">
            <div class="summary-line"><span>Category</span><span><a class="link-quiet" href="/explore?category=${encodeURIComponent(
              product.categorySlug
            )}">${escapeHtml(product.categoryName)}</a></span></div>
            <div class="summary-line"><span>Condition</span><span>${escapeHtml(condition.label)}</span></div>
            <div class="summary-line"><span>Availability</span><span>${soldOut ? 'Sold out' : `${Number(product.stock)} in stock`}</span></div>
            <div class="summary-line"><span>Ships from</span><span>${escapeHtml(product.location || product.shopTown || 'Kenya')}</span></div>
            <div class="summary-line"><span>Listed</span><span>${formatDate(product.createdAt)}</span></div>
            <div class="summary-line"><span>Shop</span><span><a class="link-quiet" href="/shop/${encodeURIComponent(
              product.shopSlug
            )}">${escapeHtml(product.shopName)}</a></span></div>
          </div>
        </div>
        <div class="content-card" id="reviews-card">
          <div id="reviews">
            <h2>Buyer reviews</h2>
            <div class="review-summary">
              <div class="review-score">
                <strong>${Number(product.ratingAverage || 0).toFixed(1)}</strong>
                ${stars(product.ratingAverage, { size: 12 })}
                <span>${pluralize(product.ratingCount, 'review')}</span>
              </div>
              <div style="font-size:12.5px;color:var(--muted);line-height:1.6">
                Every review comes from a buyer who received this product.
                ${Number(product.ratingCount) > reviews.length ? '<div style="margin-top:6px"><button class="btn btn-ghost btn-sm" type="button" id="show-all-reviews">Show all reviews</button></div>' : ''}
              </div>
            </div>
            <div id="reviews-list">${reviewsBodyHtml()}</div>
            <div id="reviews-footer"></div>
          </div>
        </div>
      </div>

      <aside class="sticky-summary">
        <div class="content-card" style="padding:20px">
          <div class="row" style="gap:12px;margin-bottom:12px">
            <span class="shop-logo" style="width:48px;height:48px">${
              product.shopLogoUrl
                ? `<img src="${escapeHtml(product.shopLogoUrl)}" alt="${escapeHtml(product.shopName)}">`
                : initials(product.shopName)
            }</span>
            <div class="grow">
              <strong style="display:block;font-size:13.5px">${escapeHtml(product.shopName)}</strong>
              <span class="muted" style="font-size:11.5px">${escapeHtml(product.shopCounty || 'Kenya')} · ${pluralize(
    product.shopProductCount,
    'product'
  )}</span>
            </div>
          </div>
          <p class="muted" style="font-size:12.5px;line-height:1.65;margin-bottom:14px">${escapeHtml(
            product.shopDescription || 'A verified STOKANA shop serving customers across Kenya.'
          )}</p>
          <a class="btn btn-secondary btn-block" href="/shop/${encodeURIComponent(product.shopSlug)}">Visit shop</a>
        </div>
        <div class="content-card" style="padding:20px">
          <h2 style="font-size:16px;margin-bottom:12px">Buyer protection</h2>
          <div class="delivery-note" style="border-top:0;padding-top:0;gap:12px;font-size:11.5px">
            <div>${icon('shield-check', { size: 16 })} <span><strong style="color:var(--ink)">Pay inside STOKANA</strong><br>Recorded payments, refunds and dispute support.</span></div>
            <div>${icon('message', { size: 16 })} <span><strong style="color:var(--ink)">Talk to the seller</strong><br>Confirm stock, delivery and product details before paying.</span></div>
            <div>${icon('truck', { size: 16 })} <span><strong style="color:var(--ink)">Track your delivery</strong><br>Follow your order from processing to delivered.</span></div>
          </div>
        </div>
      </aside>
    </div>

    ${
      related.length
        ? `<section style="padding-bottom:70px">
            <div class="section-head" style="margin-bottom:18px">
              <div>
                <span class="eyebrow">You may also like</span>
                <h2 style="font-size:clamp(22px,3vw,28px);margin-top:8px">More in ${escapeHtml(product.categoryName)}</h2>
              </div>
              <a class="btn btn-ghost" href="/explore?category=${encodeURIComponent(product.categorySlug)}">View all ${icon(
                'arrow-right',
                { size: 15 }
              )}</a>
            </div>
            <div class="results-grid">${related.map((item) => productCard(item)).join('')}</div>
          </section>`
        : ''
    }`;

  bindActions();
  bindGallery();
}

function showLoadError(error) {
  const notFound = error?.status === 404;
  root.innerHTML = `
    <div style="padding:60px 0">
      ${
        notFound
          ? `<div class="empty-state">
              <div class="empty-icon">${icon('package', { size: 26 })}</div>
              <h3>Product not found</h3>
              <p>This product may have been removed or is no longer approved for sale.</p>
              <a class="btn btn-primary" href="/explore">Browse the marketplace</a>
            </div>`
          : errorState(errorMessage(error))
      }
    </div>`;
  if (!notFound) {
    root.querySelector('[data-retry]')?.addEventListener('click', init);
  }
}

async function init() {
  await mountSite();
  user = await getUser();
  try {
    const data = await api.get(`/products/${encodeURIComponent(slug)}`);
    product = data.product;
    related = data.related || [];
    recentReviews = data.recentReviews || [];
    document.title = `${product.name} · ${product.shopName} · STOKANA`;
    render();
  } catch (error) {
    showLoadError(error);
  }
}

init();
