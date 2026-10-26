import { api } from './api.js';

let cachedUser;
let pending = null;

export async function getUser({ refresh = false } = {}) {
  if (cachedUser !== undefined && !refresh) return cachedUser;
  if (!pending || refresh) {
    pending = api
      .get('/auth/me')
      .then((data) => {
        cachedUser = data?.user || null;
        return cachedUser;
      })
      .catch(() => {
        cachedUser = null;
        return null;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function setUser(user) {
  cachedUser = user || null;
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: cachedUser }));
}

export async function requireUser({ roles = null, redirect = true } = {}) {
  const user = await getUser({ refresh: true });
  if (!user) {
    if (redirect) goToLogin();
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    window.location.replace(user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/account');
    return null;
  }
  return user;
}

export function goToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  window.location.href = `/login?next=${encodeURIComponent(safeNext)}`;
}

export function nextPath(fallback = '/') {
  const value = new URLSearchParams(window.location.search).get('next');
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return fallback;
}

export function dashboardFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/account';
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    setUser(null);
    window.location.href = '/';
  }
}

export function isApprovedSeller(user) {
  return user?.role === 'seller' && user?.sellerProfile?.status === 'approved';
}
