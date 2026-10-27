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

export function setDocumentTitle(title) {
  document.title = title ? `${title} · STOKANA` : 'STOKANA — Kenya’s multi-vendor marketplace';
}
