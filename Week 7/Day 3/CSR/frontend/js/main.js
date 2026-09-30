const state = { token: localStorage.getItem('mtaaclean-token') || '', user: null, reports: [], cleanups: [], projects: [], selectedReportId: '' };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function api(path, options = {}) {
  const headers = { ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) {
      localStorage.removeItem('mtaaclean-token');
      state.token = '';
      window.location.href = '/login.html';
    }
    throw new Error(payload.error || 'Request could not be completed.');
  }
  return payload;
}

function toast(message, isError = false) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.toggle('toast-error', isError);
  element.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('visible'), 3400);
}

function money(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount || 0);
}

function shortDate(value, options = { day: 'numeric', month: 'short' }) {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  return new Intl.DateTimeFormat('en-KE', options).format(new Date(dateValue));
}

function fullDate(value) {
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function setView(view) {
  const knownViews = ['overview', 'reports', 'report-create', 'report-detail', 'cleanup', 'csr', 'impact', 'profile'];
  const activeView = knownViews.includes(view) ? view : 'overview';
  document.querySelectorAll('[data-view-panel]').forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== activeView; });
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === activeView || (activeView === 'report-create' && link.dataset.view === 'reports')));
  document.querySelector('#breadcrumb-view').textContent = activeView.replace('-', ' ').toUpperCase();
  window.dispatchEvent(new CustomEvent('mtaaclean:view', { detail: activeView }));
}

async function loadCurrentUser() {
  if (!state.token) return window.location.replace('/login.html');
  try {
    const response = await api('/auth/me');
    state.user = response.user;
  } catch (error) {
    toast(error.message, true);
    return;
  }
  document.querySelector('#app-shell').hidden = false;
  document.querySelector('#sidebar-name').textContent = state.user.name;
  document.querySelector('#sidebar-role').textContent = state.user.role.toUpperCase();
  document.querySelector('#sidebar-avatar').textContent = state.user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  document.querySelectorAll('.admin-only').forEach((element) => { element.hidden = state.user.role !== 'admin'; });
  document.querySelectorAll('.resident-only').forEach((element) => { element.hidden = !['resident'].includes(state.user.role); });
  document.querySelectorAll('.collector-only').forEach((element) => { element.hidden = state.user.role !== 'collector'; });
  document.querySelectorAll('.sponsor-only').forEach((element) => { element.hidden = state.user.role !== 'sponsor'; });
  document.querySelectorAll('.staff-only').forEach((element) => { element.hidden = !['admin', 'collector'].includes(state.user.role); });
  const view = window.location.hash.slice(1) || 'overview';
  setView(view);
}

document.querySelector('#primary-nav').addEventListener('click', (event) => {
  if (event.target.closest('a')) document.querySelector('.sidebar').classList.remove('mobile-open');
});

window.addEventListener('hashchange', () => setView(window.location.hash.slice(1) || 'overview'));
document.querySelector('#logout-button').addEventListener('click', () => {
  localStorage.removeItem('mtaaclean-token');
  window.location.href = '/login.html';
});
document.querySelector('#mobile-nav-toggle').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('mobile-open'));
document.querySelector('#top-report-button').addEventListener('click', () => { window.location.hash = 'report-create'; });
document.querySelector('#modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector('.modal-close-wrap').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#modal').close();
});

window.MtaaClean = { state, api, escapeHtml, toast, money, shortDate, fullDate, setView };
loadCurrentUser();