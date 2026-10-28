import { PLACEHOLDER } from './ui.js';

export function installImageFallback() {
  document.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (target.dataset.fallbackApplied === 'true') return;
      target.dataset.fallbackApplied = 'true';
      target.src = PLACEHOLDER;
    },
    true
  );
}

export function installFocusShortcut() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const search = document.querySelector('[data-header-search] input');
    if (!search) return;
    event.preventDefault();
    search.focus();
  });
}

export function installRevealAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.hidden) {
    const startWhenVisible = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', startWhenVisible);
      installRevealAnimations();
    };
    document.addEventListener('visibilitychange', startWhenVisible);
    return;
  }

  const selector = '.hero-copy, .trust-item, main > section:not(.hero), .product-card, .shop-card, .category-card, .promo-banner';
  const pending = new Set();
  let delayIndex = 0;
  let checkScheduled = false;

  function observeElements(root) {
    if (root instanceof Element && root.matches(selector)) {
      root.classList.add('motion-reveal');
      root.style.setProperty('--reveal-delay', `${Math.min(delayIndex++, 6) * 55}ms`);
      pending.add(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(selector).forEach((element) => {
        element.classList.add('motion-reveal');
        element.style.setProperty('--reveal-delay', `${Math.min(delayIndex++, 6) * 55}ms`);
        pending.add(element);
      });
    }

    scheduleCheck();
  }

  function checkVisibility() {
    checkScheduled = false;
    pending.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight * 0.92) return;
      element.classList.add('is-visible');
      pending.delete(element);
    });
  }

  function scheduleCheck() {
    if (checkScheduled || document.hidden) return;
    checkScheduled = true;
    window.requestAnimationFrame(checkVisibility);
  }

  document.body.classList.add('motion-enabled');
  observeElements(document.body);
  window.addEventListener('scroll', scheduleCheck, { passive: true });
  window.addEventListener('resize', scheduleCheck);

  const mutations = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach(observeElements);
    });
  });
  mutations.observe(document.body, { childList: true, subtree: true });
}

export function setDocumentTitle(title) {
  document.title = title ? `${title} · STOKANA` : 'STOKANA — Kenya’s multi-vendor marketplace';
}
