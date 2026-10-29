import { icon } from './icons.js';
import { api } from './api.js';
import { getUser, goToLogin, logout, dashboardFor } from './auth.js';
import { avatar, toast, errorMessage } from './ui.js';
import { escapeHtml } from './format.js';
import { installImageFallback, installFocusShortcut, installRevealAnimations } from './global.js';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/categories', label: 'Categories' },
  { href: '/shops', label: 'Shops' }
];

function currentActive() {
  const path = window.location.pathname;
  if (path.startsWith('/explore') || path.startsWith('/product')) return '/explore';
  if (path.startsWith('/categories') || path.startsWith('/category')) return '/categories';
  if (path.startsWith('/shops') || path.startsWith('/shop')) return '/shops';
  if (path === '/') return '/';
  return '';
}

function headerHtml(user, active) {
  const q = new URLSearchParams(window.location.search).get('q') || '';
  const nav = NAV_LINKS.map(
    (link) => `<a class="nav-link${active === link.href ? ' active' : ''}" href="${link.href}">${link.label}</a>`
  ).join('');

  return `
    <div class="container">
      <div class="header-main">
        <a class="brand" href="/" aria-label="STOKANA home">
          <span class="brand-mark">${icon('bag', { size: 19 })}</span>
          STOKANA<span class="brand-dot">.</span>
        </a>
        <nav class="header-nav" aria-label="Primary navigation">
          ${nav}
          ${user?.role === 'seller' ? '<a class="nav-link" href="/seller">Seller hub</a>' : ''}
        </nav>
        <form class="header-search" action="/explore" method="get" role="search" data-header-search>
          <span class="search-icon">${icon('search', { size: 18 })}</span>
          <input class="input search-input" type="search" name="q" value="${escapeHtml(q)}" placeholder="Search products, shops, categories…" aria-label="Search products" autocomplete="off">
          <span class="search-kbd">/</span>
        </form>
        <div class="header-actions">
          ${headerActions(user)}
          <button class="icon-btn mobile-toggle" type="button" data-open-drawer aria-label="Open menu">
            ${icon('menu', { size: 21 })}
          </button>
        </div>
      </div>
      ${
        active !== '/'
          ? `<form class="mobile-search header-search-mobile" action="/explore" method="get" role="search">
              <input class="input" type="search" name="q" value="${escapeHtml(q)}" placeholder="Search STOKANA" aria-label="Search products">
            </form>`
          : ''
      }
    </div>`;
}

function headerActions(user) {
  if (!user) {
    return `
      <a class="btn btn-ghost btn-sm" href="/login">Sign in</a>
      <a class="btn btn-sm" href="/register">Create account</a>`;
  }

  const firstName = user.fullName.split(/\s+/)[0];
  const messageHref = user.role === 'buyer' ? '/account/messages' : '/seller/messages';
  const dashHref = dashboardFor(user.role);

  const messages =
    user.role !== 'admin'
      ? `<a class="icon-btn" href="${messageHref}" aria-label="Messages" title="Messages">
           ${icon('message', { size: 20 })}
           <span class="badge-count hidden" data-unread-count>0</span>
         </a>`
      : '';

  const cart =
    user.role === 'buyer'
      ? `<a class="icon-btn" href="/cart" aria-label="Shopping cart" title="Cart">
           ${icon('cart', { size: 20 })}
           <span class="badge-count hidden" data-cart-count>0</span>
         </a>`
      : '';

  const quickLink =
    user.role === 'seller'
      ? `<a class="icon-btn" href="/seller" aria-label="Seller dashboard" title="Seller dashboard">${icon('store', { size: 20 })}</a>`
      : user.role === 'admin'
      ? `<a class="icon-btn" href="/admin" aria-label="Admin dashboard" title="Admin">${icon('shield-check', { size: 20 })}</a>`
      : '';

  const accountLinks = [];
  if (user.role === 'buyer') {
    accountLinks.push(
      `<a class="dropdown-link" href="/account">${icon('user', { size: 16 })} Account overview</a>`,
      `<a class="dropdown-link" href="/account/orders">${icon('package', { size: 16 })} My orders</a>`,
      `<a class="dropdown-link" href="/account/messages">${icon('message', { size: 16 })} Messages</a>`,
      `<a class="dropdown-link" href="/account/reviews">${icon('star', { size: 16 })} My reviews</a>`
    );
  } else if (user.role === 'seller') {
    accountLinks.push(
      `<a class="dropdown-link" href="/seller">${icon('dashboard', { size: 16 })} Seller dashboard</a>`,
      `<a class="dropdown-link" href="/seller/products">${icon('package', { size: 16 })} My products</a>`,
      `<a class="dropdown-link" href="/seller/orders">${icon('truck', { size: 16 })} Seller orders</a>`,
      `<a class="dropdown-link" href="/seller/messages">${icon('message', { size: 16 })} Messages</a>`
    );
    if (user.sellerProfile?.status === 'approved') {
      accountLinks.push(
        `<a class="dropdown-link" href="/shop/${encodeURIComponent(user.sellerProfile.shopSlug)}">${icon('store', { size: 16 })} View my shop</a>`
      );
    }
  } else {
    accountLinks.push(
      `<a class="dropdown-link" href="/admin">${icon('dashboard', { size: 16 })} Admin dashboard</a>`,
      `<a class="dropdown-link" href="/admin/reports">${icon('chart', { size: 16 })} Reports</a>`,
      `<a class="dropdown-link" href="/admin/orders">${icon('list', { size: 16 })} Orders</a>`
    );
  }

  return `
    ${quickLink}
    ${messages}
    ${cart}
    <div class="account-menu" data-account-menu>
      <button class="account-trigger" type="button" data-account-toggle aria-haspopup="menu" aria-expanded="false">
        ${avatar(user.fullName)}
        <span class="account-name">${escapeHtml(firstName)}</span>
        <span class="account-caret">${icon('chevron-down', { size: 14 })}</span>
      </button>
      <div class="account-dropdown" role="menu">
        <div class="account-dropdown-head">
          <strong>${escapeHtml(user.fullName)}</strong>
          <span>${escapeHtml(user.email)}</span>
        </div>
        ${accountLinks.join('')}
        <div class="dropdown-sep"></div>
        <a class="dropdown-link" href="${dashHref}">${icon('settings', { size: 16 })} Account settings</a>
        <button class="dropdown-link danger" type="button" data-logout>${icon('logout', { size: 16 })} Sign out</button>
      </div>
    </div>`;
}

function footerHtml() {
  return `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/">
            <span class="brand-mark">${icon('bag', { size: 19 })}</span>
            STOKANA<span class="brand-dot">.</span>
          </a>
          <p>A trusted multi-vendor marketplace connecting Kenyan buyers with independent shops, from Nairobi to the coast.</p>
          <div class="footer-payments">
            <span class="pay-chip">M-PESA</span>
            <span class="pay-chip">VISA</span>
            <span class="pay-chip">Mastercard</span>
            <span class="pay-chip">Airtel Money</span>
          </div>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="/explore">Explore products</a></li>
            <li><a href="/categories">Browse categories</a></li>
            <li><a href="/shops">Kenyan shops</a></li>
            <li><a href="/cart">Your cart</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Sell</h4>
          <ul>
            <li><a href="/register?role=seller">Open a shop</a></li>
            <li><a href="/seller">Seller hub</a></li>
            <li><a href="/help#selling">Seller guide</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="/help">Help centre</a></li>
            <li><a href="/refunds">Returns &amp; refunds</a></li>
            <li><a href="/terms">Terms of service</a></li>
            <li><a href="/privacy">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} STOKANA. All rights reserved. Made in Kenya.</span>
        <div class="row">
          <a href="mailto:teff397@gmail.com">teff397@gmail.com</a>
          <a href="tel:+254753694364">+254 753 694 364</a>
          <span>Nairobi, Kenya</span>
        </div>
      </div>
    </div>`;
}

function drawerHtml(user) {
  const extra = [];
  if (!user) {
    extra.push('<a href="/login">Sign in</a>', '<a href="/register">Create an account</a>');
  } else if (user.role === 'buyer') {
    extra.push(
      '<a href="/account">My account</a>',
      '<a href="/account/orders">My orders</a>',
      '<a href="/account/messages">Messages</a>',
      '<a href="/account/reviews">My reviews</a>'
    );
  } else if (user.role === 'seller') {
    extra.push(
      '<a href="/seller">Seller dashboard</a>',
      '<a href="/seller/products">My products</a>',
      '<a href="/seller/orders">Seller orders</a>',
      '<a href="/seller/messages">Messages</a>'
    );
  } else {
    extra.push('<a href="/admin">Admin dashboard</a>', '<a href="/admin/reports">Reports</a>');
  }

  return `
    <div class="drawer-backdrop" data-close-drawer></div>
    <aside class="drawer-panel" aria-label="Mobile menu">
      <div class="drawer-head">
        <a class="brand" href="/"><span class="brand-mark">${icon('bag', { size: 18 })}</span>STOKANA<span class="brand-dot">.</span></a>
        <button class="icon-btn" type="button" data-close-drawer aria-label="Close menu">${icon('x', { size: 20 })}</button>
      </div>
      <form class="header-search" action="/explore" method="get" role="search" style="max-width:none">
        <span class="search-icon">${icon('search', { size: 18 })}</span>
        <input class="input search-input" type="search" name="q" placeholder="Search STOKANA…" aria-label="Search products">
      </form>
      <nav class="drawer-nav" aria-label="Mobile navigation">
        <a href="/"><span>Home</span>${icon('chevron-right', { size: 15 })}</a>
        <a href="/explore"><span>Explore</span>${icon('chevron-right', { size: 15 })}</a>
        <a href="/categories"><span>Categories</span>${icon('chevron-right', { size: 15 })}</a>
        <a href="/shops"><span>Shops</span>${icon('chevron-right', { size: 15 })}</a>
        ${extra.map((link) => link.replace('</a>', `</a>`)).join('')}
      </nav>
      <div class="drawer-footer">
        ${
          user
            ? `<button class="btn btn-secondary btn-block" type="button" data-logout>${icon('logout', { size: 16 })} Sign out</button>`
            : `<a class="btn btn-block" href="/register">Create an account</a>
               <a class="btn btn-secondary btn-block" href="/login">Sign in</a>`
        }
        <a class="btn btn-secondary btn-block" href="/cart">${icon('cart', { size: 16 })} View cart</a>
      </div>
    </aside>`;
}

async function refreshBadges(user) {
  if (!user) return;

  if (user.role === 'buyer') {
    api
      .get('/cart')
      .then((cart) => {
        const count = Number(cart?.summary?.itemCount) || 0;
        const el = document.querySelector('[data-cart-count]');
        if (el) {
          el.textContent = String(count);
          el.classList.toggle('hidden', count === 0);
        }
      })
      .catch(() => {});
  }

  if (user.role === 'buyer' || user.role === 'seller') {
    api
      .get('/messages/unread-count')
      .then((data) => {
        const count = Number(data?.count) || 0;
        const el = document.querySelector('[data-unread-count]');
        if (el) {
          el.textContent = String(count);
          el.classList.toggle('hidden', count === 0);
        }
      })
      .catch(() => {});
  }
}

export async function refreshCartBadge() {
  const user = await getUser();
  if (!user || user.role !== 'buyer') return;
  try {
    const cart = await api.get('/cart');
    const count = Number(cart?.summary?.itemCount) || 0;
    const el = document.querySelector('[data-cart-count]');
    if (el) {
      el.textContent = String(count);
      el.classList.toggle('hidden', count === 0);
    }
  } catch {
    /* badge is non-critical */
  }
}

function bindHeader(user) {
  const header = document.querySelector('[data-site-header] .site-header');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const accountMenu = header.querySelector('[data-account-menu]');
  if (accountMenu) {
    const toggle = accountMenu.querySelector('[data-account-toggle]');
    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = accountMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
      if (!accountMenu.contains(event.target)) {
        accountMenu.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      await logout();
    });
  });
}

function bindDrawer(user) {
  let drawer = document.querySelector('.mobile-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'mobile-drawer';
    document.body.appendChild(drawer);
  }
  drawer.innerHTML = drawerHtml(user);

  const open = () => {
    drawer.classList.add('open');
    document.body.classList.add('no-scroll');
  };
  const close = () => {
    drawer.classList.remove('open');
    document.body.classList.remove('no-scroll');
  };

  document.querySelectorAll('[data-open-drawer]').forEach((button) => button.addEventListener('click', open));
  drawer.querySelectorAll('[data-close-drawer]').forEach((button) => button.addEventListener('click', close));
  drawer.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      await logout();
    });
  });
}

function wireQuickAdd() {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-add-to-cart]');
    if (!button || button.disabled) return;
    event.preventDefault();

    const user = await getUser();
    if (!user) {
      toast('Sign in to start a cart with this item.', 'info');
      window.setTimeout(goToLogin, 600);
      return;
    }
    if (user.role !== 'buyer') {
      toast('Buyer accounts can place orders. Switch to a buyer account to shop.', 'error');
      return;
    }

    const productId = Number(button.dataset.addToCart);
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner dark"></span>';

    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      toast('Added to your cart.', 'success');
      await refreshCartBadge();
      button.innerHTML = icon('check', { size: 18 });
      window.setTimeout(() => {
        button.innerHTML = original;
        button.disabled = false;
      }, 1300);
    } catch (error) {
      toast(errorMessage(error), 'error');
      button.innerHTML = original;
      button.disabled = false;
    }
  });
}

export async function mountSite() {
  installImageFallback();
  installFocusShortcut();
  installRevealAnimations();
  wireQuickAdd();

  const headerHost = document.querySelector('[data-site-header]');
  const footerHost = document.querySelector('[data-site-footer]');
  if (!headerHost && !footerHost) return null;

  document.body.classList.add('site-body');
  const user = await getUser();
  const active = currentActive();

  if (headerHost) {
    headerHost.innerHTML = `<header class="site-header">${headerHtml(user, active)}</header>`;
    bindHeader(user);
  }
  if (footerHost) footerHost.innerHTML = `<footer class="site-footer">${footerHtml()}</footer>`;

  bindDrawer(user);
  refreshBadges(user);

  return user;
}

export { bindHeader };
