const STORAGE_KEY = 'stokana:recently-viewed';
const MAX_RECENT = 8;

export function getRecentlyViewedSlugs() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored)
      ? stored.filter((slug) => typeof slug === 'string').slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(slug) {
  try {
    const recent = getRecentlyViewedSlugs().filter((entry) => entry !== slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([slug, ...recent].slice(0, MAX_RECENT)));
  } catch {
    return;
  }
}
