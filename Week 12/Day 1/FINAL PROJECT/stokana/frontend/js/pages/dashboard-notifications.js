import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { errorState, toast, errorMessage } from '../ui.js';
import { escapeHtml, formatDate } from '../format.js';

const isAdmin = window.location.pathname.startsWith('/admin/');
const role = isAdmin ? 'admin' : 'seller';
const active = isAdmin ? '/admin/notifications' : '/seller/notifications';
let dash = null;
let notifications = [];

function render() {
  const rows = notifications.length
    ? notifications.map((item) => `<article class="content-card" style="padding:14px">
        <div class="row-between" style="gap:12px">
          <strong>${escapeHtml(item.title)}</strong>
          ${item.readAt ? '' : `<button class="btn btn-secondary btn-sm" type="button" data-mark-read="${item.id}">Mark read</button>`}
        </div>
        <p class="muted" style="white-space:pre-line">${escapeHtml(item.message)}</p>
        <span class="tiny muted">${formatDate(item.createdAt)}</span>
      </article>`).join('')
    : '<p class="tiny muted">No notifications yet.</p>';
  const hasUnread = notifications.some((item) => !item.readAt);

  dash.content.innerHTML = `
    <div class="content-card">
      <div class="section-head">
        <div><h2>Notifications</h2><p>Marketplace announcements and campaign updates.</p></div>
        ${hasUnread ? '<button class="btn btn-secondary btn-sm" id="mark-all-read" type="button">Mark all read</button>' : ''}
      </div>
      <div class="list-stack">${rows}</div>
    </div>`;
  dash.content.querySelector('#mark-all-read')?.addEventListener('click', markAllRead);
  dash.content.querySelectorAll('[data-mark-read]').forEach((button) => {
    button.addEventListener('click', () => markRead(button));
  });
}

async function load() {
  try {
    const data = await api.get('/notifications');
    notifications = data.notifications;
    render();
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', load);
  }
}

async function markRead(button) {
  try {
    await api.patch(`/notifications/${button.dataset.markRead}/read`);
    const item = notifications.find((notification) => String(notification.id) === button.dataset.markRead);
    if (item) item.readAt = new Date().toISOString();
    render();
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function markAllRead() {
  try {
    await api.patch('/notifications/read-all');
    notifications.forEach((item) => { item.readAt = item.readAt || new Date().toISOString(); });
    render();
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function init() {
  dash = await initDashboard({
    role,
    active,
    title: 'Notifications',
    subtitle: 'Read platform announcements and campaign updates.'
  });
  if (dash) await load();
}

init();
