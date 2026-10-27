import { api, queryString } from '../api.js';
import { initAccount } from '../account-ui.js';
import {
  img,
  stars,
  emptyState,
  errorState,
  pageLoader,
  paginationHtml,
  errorMessage
} from '../ui.js';
import { escapeHtml, formatDate, pluralize } from '../format.js';

const params = new URLSearchParams(window.location.search);
let page = Math.max(1, Number(params.get('page')) || 1);
let account = null;
let loading = false;

function reviewItem(review) {
  const productHref = review.productSlug
    ? `/product/${encodeURIComponent(review.productSlug)}`
    : '';
  const nameHtml = productHref
    ? `<a class="review-history-product" href="${productHref}">${escapeHtml(review.productName || 'Product removed')}</a>`
    : `<span class="review-history-product">${escapeHtml(review.productName || 'Product removed')}</span>`;

  return `<div class="review-item">
    <div class="review-head">
      ${img(review.imageUrl, review.productName || 'Product', 'class="review-history-thumb" width="46" height="46"')}
      <div class="grow">
        ${nameHtml}
        <div class="review-history-meta">
          ${
            review.shopSlug
              ? `<a href="/shop/${encodeURIComponent(review.shopSlug)}">${escapeHtml(review.shopName || 'Shop')}</a>`
              : escapeHtml(review.shopName || 'Shop')
          } · ${formatDate(review.createdAt)}
        </div>
      </div>
      <div title="${review.rating} out of 5">${stars(review.rating, { size: 13 })}</div>
    </div>
    ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
    ${
      review.comment
        ? `<p class="review-body">${escapeHtml(review.comment)}</p>`
        : '<p class="review-body muted">No written comment.</p>'
    }
  </div>`;
}

function render({ reviews, summary, pagination }) {
  const average = Number(summary.averageRating) || 0;

  account.content.innerHTML = `
    ${
      summary.total
        ? `<div class="review-summary-card">
            <div class="review-score">
              <strong>${average.toFixed(1)}</strong>
              <div>${stars(average, { size: 15 })}<div class="review-history-meta">${
          summary.total === 1 ? 'Based on 1 review' : `Based on ${summary.total} reviews`
        }</div></div>
            </div>
            <div class="grow" style="min-width:220px">
              <p class="tiny muted">Your feedback helps buyers choose confidently and helps sellers improve.
              You can review any delivered order item from its order page.</p>
            </div>
            <a class="btn btn-secondary btn-sm" href="/account/orders">Review a purchase</a>
          </div>`
        : ''
    }
    <div class="content-card" style="padding-top:22px">
      <div class="section-head">
        <div>
          <h2>Your reviews</h2>
          <p>${summary.total ? pluralize(summary.total, 'published review') : 'Share feedback after a delivery.'}</p>
        </div>
      </div>
      ${
        reviews.length
          ? reviews.map((review) => reviewItem(review)).join('')
          : emptyState({
              iconName: 'star',
              title: 'No reviews yet',
              text: 'Once an order is delivered you can rate the product and tell other buyers what you thought.',
              action: '<a class="btn btn-primary" href="/account/orders">View your orders</a>'
            })
      }
    </div>
    <div id="reviews-pagination">${paginationHtml(pagination)}</div>`;

  account.content.querySelectorAll('#reviews-pagination [data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = Number(button.dataset.page);
      if (!next || next < 1 || next > pagination.totalPages || next === page) return;
      page = next;
      const url = new URL(window.location.href);
      if (page <= 1) url.searchParams.delete('page');
      else url.searchParams.set('page', String(page));
      window.history.replaceState({}, '', url);
      loadReviews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function loadReviews() {
  if (loading) return;
  loading = true;
  account.content.innerHTML = pageLoader();

  try {
    const data = await api.get(`/reviews/mine${queryString({ page, limit: 10 })}`);
    render(data);
  } catch (error) {
    account.content.innerHTML = errorState(errorMessage(error));
    account.content.querySelector('[data-retry]')?.addEventListener('click', () => loadReviews());
  } finally {
    loading = false;
  }
}

async function init() {
  account = await initAccount({
    active: '/account/reviews',
    title: 'My reviews',
    subtitle: 'Ratings and feedback you have shared.',
    actions: '<a class="btn btn-secondary btn-sm" href="/account/orders">Review a purchase</a>'
  });
  if (!account) return;

  await loadReviews();
}

init();
