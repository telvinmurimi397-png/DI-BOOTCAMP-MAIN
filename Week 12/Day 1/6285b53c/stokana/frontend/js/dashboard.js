import { icon } from './icons.js';
import { api } from './api.js';
import { requireUser, logout } from './auth.js';
import { avatar } from './ui.js';
import { escapeHtml } from './format.js';
import { installImageFallback } from './global.js';

const SELLER_NAV = [
  { href: '/seller', label: 'Overview', icon: 'dashboard', active: '/seller' },
  { group: 'Catalogue' },
  { href: '/seller/products', label: 'Products', icon: 'package', active: '/seller/products' },
  { href: '/seller/products/new', label: 'Add a product', icon: 'plus', active: '/seller/products/new' },
  { href: '/seller/shop', label: 'Shop profile', icon: 'store', active: '/seller/shop' },
  { group: 'Sales' },
  { href: '/seller/orders', label: 'Orders', icon: 'truck', active: '/seller/orders' },
  { href: '/seller/sales', label: 'Sales & payouts', icon: 'wallet', active: '/seller/sales' },
  { group: 'Communication' },
  { href: '/seller/messages', label: 'Messages', icon: 'message', active: '/seller/messages', badge: 'messages' }
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: 'dashboard', active: '/admin' },
  { group: 'Marketplace' },
  { href: '/admin/sellers', label: 'Seller approvals', icon: 'shield-check', active: '/admin/sellers' },
  { href: '/admin/products', label: 'Product approvals', icon: 'package', active: '/admin/products' },
  { href: '/admin/categories', label: 'Categories', icon: 'tags', active: '/admin/categories' },
  { group: 'Operations' },
  { href: '/admin/orders', label: 'Orders', icon: 'list', active: '/admin/orders' },
  { href: '/admin/users', label: 'Users', icon: 'users', active: '/admin/users' },
  { group: 'Insights' },
  { href: '/admin/reports', label: 'Reports', icon: 'chart', active: '/admin/reports' },
  { href: '/admin/commissions', label: 'Commissions', icon: 'wallet', active: '/admin/commissions' },
  { href: '/admin/settings', label: 'Platform settings', icon: 'settings', active: '/admin/settings' }
];

function navHtml(items, active) {
  return items
    .map((item) => {
      if (item.group) return `<div class="dash-nav-group">${escapeHtml(item.group)}</div>`;
      return `<a href="${item.href}" class="${item.active === active ? 'active' : ''}">
        ${icon(item.icon, { size: 17 })}
        <span>${escapeHtml(item.label)}</span>
        ${item.badge ? `<span class="nav-count hidden" data-nav-badge="${item.badge}">0</span>` : ''}
      </a>`;
    })
    .join('');
}

function sellerAlert(user) {
  if (user.role !== 'seller') return '';
  const profile = user.sellerProfile;
  if (!profile) return '';
  if (profile.status === 'pending') {
    return `<div class="alert warning" style="margin-bottom:18px">
      ${icon('clock', { size: 18 })}
      <div><strong>Your shop is awaiting approval.</strong> You can prepare your dashboard, but products can only be published after an administrator approves <strong>${escapeHtml(
        profile.shopName
      )}</strong>.</div>
    </div>`;
  }
  if (profile.status === 'rejected') {
    return `<div class="alert danger" style="margin-bottom:18px">
      ${icon('alert-circle', { size: 18 })}
      <div><strong>Your seller application was not approved.</strong> ${escapeHtml(
        profile.rejectionReason || 'Contact support for more information.'
      )}</div>
    </div>`;
  }
  if (profile.status === 'suspended') {
    return `<div class="alert danger" style="margin-bottom:18px">
      ${icon('alert-circle', { size: 18 })}
      <div><strong>Your shop is suspended.</strong> ${escapeHtml(
        profile.rejectionReason || 'Contact support to resolve this.'
      )}</div>
    </div>`;
  }
  return '';
}

export async function initDashboard({ role, active, title, subtitle = '', actions = '' }) {
  const user = await requireUser({ roles: [role] });
  if (!user) return null;

  installImageFallback();
  document.body.classList.add('dash-body');
  document.title = `${title} · STOKANA ${role === 'admin' ? 'Admin' : 'Seller'}`;

  const root = document.getElementById('dashboard-root');
  if (!root) throw new Error('Dashboard root is missing.');

  const nav = role === 'seller' ? SELLER_NAV : ADMIN_NAV;
  const roleLabel = role === 'seller' ? 'Seller hub' : 'Admin console';
  const profileLine =
    role === 'seller'
      ? user.sellerProfile?.shopName || 'Seller account'
      : 'Marketplace administrator';

  root.innerHTML = `
    <div class="dash-shell">
      <aside class="dash-sidebar">
        <div class="dash-sidebar-head">
          <a class="brand" href="/">
            <span class="brand-mark">${icon('bag', { size: 18 })}</span>
            STOKANA<span class="brand-dot">.</span>
          </a>
          <div class="tiny muted" style="margin-top:8px;padding-left:2px">${escapeHtml(roleLabel)}</div>
        </div>
        <nav class="dash-nav" aria-label="${escapeHtml(roleLabel)} navigation">
          ${navHtml(nav, active)}
        </nav>
        <div class="dash-sidebar-foot">
          <div class="dash-user">
            ${avatar(user.fullName)}
            <div class="dash-user-info">
              <strong>${escapeHtml(user.fullName)}</strong>
              <span>${escapeHtml(profileLine)}</span>
            </div>
            <button class="icon-btn" type="button" data-logout title="Sign out" aria-label="Sign out">${icon('logout', { size: 17 })}</button>
          </div>
        </div>
      </aside>
      <button class="dash-sidebar-overlay" type="button" data-dash-overlay aria-label="Close menu"></button>
      <div class="dash-main">
        <header class="dash-topbar">
          <button class="icon-btn dash-mobile-toggle" type="button" data-dash-toggle aria-label="Open menu">${icon('menu', { size: 20 })}</button>
          <h1>${escapeHtml(roleLabel)}</h1>
          <div class="topbar-actions">
            <a class="icon-btn topbar-hide-mobile" href="/" aria-label="View storefront" title="View storefront">${icon('globe', { size: 19 })}</a>
            <a class="icon-btn" href="${role === 'seller' ? '/seller/messages' : '/admin/orders'}" aria-label="${role === 'seller' ? 'Messages' : 'Orders'}">
              ${icon(role === 'seller' ? 'message' : 'list', { size: 19 })}
              ${role === 'seller' ? '<span class="badge-count hidden" data-nav-badge-top>0</span>' : ''}
            </a>
            <span class="avatar" title="${escapeHtml(user.fullName)}">${escapeHtml(
              user.fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
            )}</span>
          </div>
        </header>
        <div class="dash-content">
          ${sellerAlert(user)}
          <div class="dash-page-head">
            <div>
              <h2>${escapeHtml(title)}</h2>
              ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
            </div>
            ${actions ? `<div class="row wrap">${actions}</div>` : ''}
          </div>
          <div id="dash-page-content"></div>
        </div>
      </div>
    </div>`;

  const shell = root.querySelector('.dash-shell');
  root.querySelector('[data-dash-toggle]')?.addEventListener('click', () => shell.classList.add('sidebar-open'));
  root.querySelector('[data-dash-overlay]')?.addEventListener('click', () => shell.classList.remove('sidebar-open'));
  root.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      await logout();
    });
  });

  if (role === 'seller') {
    api
      .get('/messages/unread-count')
      .then(({ count }) => {
        const value = Number(count) || 0;
        document.querySelectorAll('[data-nav-badge="messages"], [data-nav-badge-top]').forEach((badge) => {
          badge.textContent = String(value);
          badge.classList.toggle('hidden', value === 0);
        });
      })
      .catch(() => {});
  }

  return {
    user,
    content: root.querySelector('#dash-page-content'),
    actionsHost: root.querySelector('.dash-page-head .row')
  };
}
