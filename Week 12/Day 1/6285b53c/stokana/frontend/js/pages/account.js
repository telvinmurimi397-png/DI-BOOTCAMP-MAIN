import { api } from '../api.js';
import { initAccount } from '../account-ui.js';
import { setUser } from '../auth.js';
import { icon } from '../icons.js';
import { buyerOrderCard } from '../order-ui.js';
import {
  toast,
  emptyState,
  errorState,
  setButtonLoading,
  errorMessage
} from '../ui.js';
import { bindPasswordToggles, passwordToggle, setFieldError } from '../auth-ui.js';
import {
  money,
  escapeHtml,
  formatDate,
  pluralize,
  plainNumber,
  initials
} from '../format.js';

let account = null;
let stats = null;

function statCard({ label, value, iconName, tone = '', foot }) {
  return `<div class="stat-card">
    <div class="stat-top">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-icon ${tone}">${icon(iconName, { size: 17 })}</span>
    </div>
    <strong class="stat-value">${value}</strong>
    <div class="stat-foot">${foot}</div>
  </div>`;
}

function profileForm(user) {
  return `<form id="profile-form" class="form-grid">
    <div class="form-group">
      <label class="form-label" for="profile-name">Full name</label>
      <input class="input" id="profile-name" name="fullName" value="${escapeHtml(
        user.fullName
      )}" required minlength="2" maxlength="120" autocomplete="name">
    </div>
    <div class="form-group">
      <label class="form-label" for="profile-phone">Phone number <span class="optional">(optional)</span></label>
      <input class="input" id="profile-phone" name="phone" type="tel" value="${escapeHtml(
        user.phone || ''
      )}" maxlength="30" placeholder="+254 7XX XXX XXX" autocomplete="tel">
    </div>
    <div class="form-group span-2">
      <label class="form-label" for="profile-email">Email address</label>
      <input class="input" id="profile-email" type="email" value="${escapeHtml(user.email)}" disabled>
      <span class="form-hint">Your sign-in email cannot be changed from this page.</span>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Save profile</button>
    </div>
  </form>`;
}

function passwordForm() {
  return `<form id="password-form" class="form-grid">
    <div class="form-group span-2">
      <label class="form-label" for="current-password">Current password</label>
      <div class="input-group">
        <input class="input has-action" id="current-password" name="currentPassword" type="password" required autocomplete="current-password">
        ${passwordToggle('Show current password')}
      </div>
    </div>
    <div class="form-group span-2">
      <label class="form-label" for="new-password">New password</label>
      <div class="input-group">
        <input class="input has-action" id="new-password" name="newPassword" type="password" required minlength="8" maxlength="72" autocomplete="new-password">
        ${passwordToggle('Show new password')}
      </div>
      <span class="form-hint">At least 8 characters with uppercase, lowercase and a number.</span>
    </div>
    <div class="form-group span-2">
      <label class="form-label" for="confirm-password">Confirm new password</label>
      <div class="input-group">
        <input class="input has-action" id="confirm-password" name="confirmPassword" type="password" required minlength="8" maxlength="72" autocomplete="new-password">
        ${passwordToggle('Show confirmation password')}
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" type="submit">Update password</button>
    </div>
  </form>`;
}

function render(recent) {
  const user = account.user;
  const totalSpent = money(stats.totalSpent);

  account.content.innerHTML = `
    <div class="stat-grid">
      ${statCard({
        label: 'Orders placed',
        value: plainNumber(stats.ordersCount),
        iconName: 'package',
        foot: `${pluralize(stats.cartItems, 'item')} waiting in your cart`
      })}
      ${statCard({
        label: 'Active orders',
        value: plainNumber(stats.activeOrders),
        iconName: 'truck',
        tone: 'amber',
        foot: 'Awaiting payment, processing or in transit'
      })}
      ${statCard({
        label: 'Delivered',
        value: plainNumber(stats.deliveredOrders),
        iconName: 'check-circle',
        tone: 'green',
        foot: 'Completed orders ready to review'
      })}
      ${statCard({
        label: 'Total spent',
        value: totalSpent,
        iconName: 'wallet',
        tone: 'purple',
        foot: 'Across paid, non-cancelled orders'
      })}
    </div>

    <div class="content-card" style="margin-top:18px">
      <div class="section-head">
        <div>
          <h2>Recent orders</h2>
          <p>Track payments, deliveries and leave reviews.</p>
        </div>
        <a class="link-quiet" href="/account/orders">View all orders</a>
      </div>
      ${
        recent.orders.length
          ? `<div class="orders-list">${recent.orders.map((order) => buyerOrderCard(order)).join('')}</div>`
          : emptyState({
              iconName: 'package',
              title: 'No orders yet',
              text: 'When you place your first order it will show up here with live delivery updates.',
              action: '<a class="btn btn-primary" href="/explore">Start shopping</a>'
            })
      }
    </div>

    <div class="account-grid-2">
      <div class="content-card">
        <div class="section-head">
          <div>
            <h2>Profile details</h2>
            <p>Member since ${formatDate(user.createdAt)}</p>
          </div>
        </div>
        ${profileForm(user)}
      </div>
      <div class="content-card">
        <div class="section-head">
          <div>
            <h2>Password & security</h2>
            <p>Changing your password signs out other devices.</p>
          </div>
        </div>
        ${passwordForm()}
      </div>
    </div>`;

  bindPasswordToggles(account.content);
  account.content.querySelector('#profile-form').addEventListener('submit', saveProfile);
  account.content.querySelector('#password-form').addEventListener('submit', savePassword);
}

async function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submit = form.querySelector('button[type="submit"]');
  setButtonLoading(submit, true, 'Saving…');

  try {
    const data = await api.patch('/auth/profile', {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim()
    });
    setUser(data.user);
    account.user = data.user;
    refreshIdentity(data.user);
    toast('Profile updated.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
  }
}

function refreshIdentity(user) {
  const firstName = user.fullName.trim().split(/\s+/)[0];
  document.querySelectorAll('.account-name').forEach((element) => {
    element.textContent = firstName;
  });
  document.querySelectorAll('.account-dropdown-head strong, .account-nav-profile strong').forEach((element) => {
    element.textContent = user.fullName;
  });
  document.querySelectorAll('.account-menu .avatar, .account-nav-profile .avatar').forEach((element) => {
    element.textContent = initials(user.fullName);
  });
}

async function savePassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  if (form.newPassword.value !== form.confirmPassword.value) {
    setFieldError(form.confirmPassword, 'The new passwords do not match.');
    return;
  }

  const submit = form.querySelector('button[type="submit"]');
  setButtonLoading(submit, true, 'Updating…');
  try {
    const data = await api.patch('/auth/password', {
      currentPassword: form.currentPassword.value,
      newPassword: form.newPassword.value
    });
    form.reset();
    toast(data.message || 'Password updated.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
  }
}

async function load() {
  try {
    const [statsData, recent] = await Promise.all([
      api.get('/orders/stats'),
      api.get('/orders?limit=3')
    ]);
    stats = statsData;
    render(recent);
  } catch (error) {
    account.content.innerHTML = errorState(errorMessage(error));
    account.content.querySelector('[data-retry]')?.addEventListener('click', () => load());
  }
}

async function init() {
  account = await initAccount({
    active: '/account',
    title: 'My account',
    subtitle: 'Orders, deliveries and account settings in one place.',
    actions: '<a class="btn btn-secondary btn-sm" href="/explore">Continue shopping</a>'
  });
  if (!account) return;

  await load();
}

init();
