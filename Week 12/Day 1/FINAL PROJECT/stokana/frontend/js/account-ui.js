import { mountSite } from './layout.js';
import { api } from './api.js';
import { requireUser, logout } from './auth.js';
import { avatar } from './ui.js';
import { icon } from './icons.js';
import { escapeHtml } from './format.js';

const ACCOUNT_NAV = [
  { href: '/account', label: 'Overview', icon: 'dashboard' },
  { href: '/account/orders', label: 'My orders', icon: 'package' },
  { href: '/account/messages', label: 'Messages', icon: 'message', badge: true },
  { href: '/account/reviews', label: 'My reviews', icon: 'star' }
];

function navHtml(active) {
  return ACCOUNT_NAV.map(
    (item) => `<a href="${item.href}" class="${item.href === active ? 'active' : ''}">
      ${icon(item.icon, { size: 17 })}
      <span>${escapeHtml(item.label)}</span>
      ${item.badge ? '<span class="nav-count hidden" data-account-unread>0</span>' : ''}
    </a>`
  ).join('');
}

export async function initAccount({ active, title, subtitle = '', actions = '' }) {
  await mountSite();
  const user = await requireUser({ roles: ['buyer'] });
  if (!user) return null;

  document.title = `${title} · STOKANA`;
  const root = document.getElementById('account-root');
  if (!root) throw new Error('Account root is missing.');

  root.innerHTML = `
    <div class="container">
      <div class="account-layout">
        <aside class="account-nav">
          <div class="account-nav-profile">
            ${avatar(user.fullName)}
            <div class="grow">
              <strong>${escapeHtml(user.fullName)}</strong>
              <span>${escapeHtml(user.email)}</span>
            </div>
          </div>
          <nav aria-label="Account navigation">
            ${navHtml(active)}
          </nav>
          <div class="account-nav-foot">
            <a href="/explore">${icon('search', { size: 17 })}<span>Continue shopping</span></a>
            <button class="nav-signout" type="button" data-account-logout>
              ${icon('logout', { size: 17 })}<span>Sign out</span>
            </button>
          </div>
        </aside>
        <div>
          <div class="account-head">
            <div>
              <h1>${escapeHtml(title)}</h1>
              ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
            </div>
            ${actions ? `<div class="row wrap">${actions}</div>` : ''}
          </div>
          <div id="account-content"></div>
        </div>
      </div>
    </div>`;

  root.querySelector('[data-account-logout]')?.addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    await logout();
  });

  api
    .get('/messages/unread-count')
    .then(({ count }) => {
      const value = Number(count) || 0;
      const badge = root.querySelector('[data-account-unread]');
      if (badge) {
        badge.textContent = String(value);
        badge.classList.toggle('hidden', value === 0);
      }
    })
    .catch(() => {});

  return {
    user,
    content: root.querySelector('#account-content'),
    actionsHost: root.querySelector('.account-head .row')
  };
}
