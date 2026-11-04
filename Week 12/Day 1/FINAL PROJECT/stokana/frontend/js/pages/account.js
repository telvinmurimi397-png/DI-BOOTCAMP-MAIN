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
import { bindPasswordToggles, passwordToggle, setFieldError, COUNTIES } from '../auth-ui.js';
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
let addresses = [];
let rewards = null;
let notifications = [];
let recentOrders = null;
let twoFactorSecret = null;

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

function addressesHtml() {
  const rows = addresses.map((address) => `<div class="order-summary-item" data-address-row="${address.id}">
    <div class="grow">
      <strong>${escapeHtml(address.label)}${address.isDefault ? ' · Default' : ''}</strong>
      <span>${escapeHtml(address.fullName)} · ${escapeHtml(address.phone)}<br>
        ${escapeHtml(address.addressLine)}, ${escapeHtml(address.town)}, ${escapeHtml(address.county)}</span>
    </div>
    <div class="table-actions">
      ${address.isDefault ? '' : `<button class="btn btn-quiet btn-sm" type="button" data-edit-address="${address.id}">Edit</button>`}
      <button class="btn btn-quiet btn-sm" type="button" data-delete-address="${address.id}">Remove</button>
    </div>
  </div>`).join('');
  return `<div id="address-list">${rows || '<p class="muted">No saved delivery addresses yet.</p>'}</div>
    <form id="address-form" class="form-grid" style="margin-top:16px">
      <input type="hidden" name="addressId">
      <div class="form-group">
        <label class="form-label" for="address-label">Address label</label>
        <input class="input" id="address-label" name="label" placeholder="Home, Office…" required maxlength="60">
      </div>
      <div class="form-group">
        <label class="form-label" for="address-name">Recipient</label>
        <input class="input" id="address-name" name="fullName" required minlength="3" maxlength="120">
      </div>
      <div class="form-group">
        <label class="form-label" for="address-phone">Phone</label>
        <input class="input" id="address-phone" name="phone" type="tel" required maxlength="30">
      </div>
      <div class="form-group">
        <label class="form-label" for="address-county">County</label>
        <select class="select" id="address-county" name="county" required>
          <option value="">Choose county</option>
          ${COUNTIES.map((county) => `<option value="${escapeHtml(county)}">${escapeHtml(county)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="address-town">Town / estate</label>
        <input class="input" id="address-town" name="town" required minlength="2" maxlength="80">
      </div>
      <div class="form-group">
        <label class="form-label" for="address-line">Street and landmark</label>
        <input class="input" id="address-line" name="addressLine" required minlength="8" maxlength="500">
      </div>
      <label class="form-group" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" name="isDefault"> Set as default delivery address
      </label>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Save address</button>
        <button class="btn btn-secondary" type="button" id="cancel-address-edit">Clear</button>
      </div>
    </form>`;
}

function verificationHtml(user) {
  return `<div class="form-grid">
    ${[
      ['email', 'Email address', user.email, user.emailVerified],
      ['phone', 'Phone number', user.phone || 'Add a phone number in Profile details', user.phoneVerified]
    ].map(([channel, label, value, verified]) => `<div class="content-card" style="padding:16px">
      <strong>${escapeHtml(label)}</strong>
      <p class="muted">${escapeHtml(value || '')}</p>
      <p>${verified ? '<span class="badge success">Verified</span>' : '<span class="badge warning">Not verified</span>'}</p>
      ${verified ? '' : `<form data-verify-form="${channel}" class="form-grid">
        <div class="form-group"><label class="form-label" for="verify-${channel}">6-digit code</label>
          <input class="input" id="verify-${channel}" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-sm" type="submit">Verify</button>
          ${channel !== 'phone' || user.phone ? `<button class="btn btn-secondary btn-sm" type="button" data-send-verification="${channel}">Send code</button>` : ''}
        </div>
      </form>`}
    </div>`).join('')}
  </div>`;
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

  account.content.insertAdjacentHTML('beforeend', `
    <div class="content-card" style="margin-top:18px">
      <div class="section-head"><div><h2>Verified contacts</h2><p>Confirm your email and phone to protect your account.</p></div></div>
      ${verificationHtml(user)}
    </div>
    <div class="content-card" style="margin-top:18px">
      <div class="section-head"><div><h2>Delivery addresses</h2><p>Save addresses for faster checkout.</p></div></div>
      ${addressesHtml()}
    </div>
    <div class="content-card" style="margin-top:18px">
      <div class="section-head"><div><h2>Points & referrals</h2><p>Earn 1 point per KSh 100 spent. Redeem 100 points for KSh 10 at checkout.</p></div></div>
      <div class="stat-grid">
        ${statCard({ label: 'Loyalty points', value: plainNumber(rewards.points), iconName: 'star', foot: 'Redeem up to 50% of item subtotal' })}
        ${statCard({ label: 'Referral credit', value: money(rewards.referralCredit), iconName: 'wallet', tone: 'green', foot: 'Applied at checkout when selected' })}
        ${statCard({ label: 'Successful referrals', value: plainNumber(rewards.successfulReferrals), iconName: 'users', foot: 'Rewards require a first paid order' })}
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        <span class="badge blue">Your code: ${escapeHtml(rewards.referralCode)}</span>
        <a class="btn btn-secondary btn-sm" href="/register?ref=${encodeURIComponent(rewards.referralCode)}">Invite a friend</a>
      </div>
      <p class="tiny muted" style="margin-top:10px">You and your friend each receive KSh 200 platform credit after their first paid order, provided it is not fully refunded.</p>
    </div>
    <div class="content-card" style="margin-top:18px">
      <div class="section-head"><div><h2>Email preferences</h2><p>Promotional campaigns and abandoned-cart reminders are sent only with your permission.</p></div></div>
      <form id="marketing-preferences" class="row-between" style="gap:12px">
        <label class="checkbox"><input type="checkbox" name="marketingEmailConsent" ${account.user.marketingEmailConsent ? 'checked' : ''}>
          <span>Send me product news, offers and occasional cart reminders by email.</span>
        </label>
        <button class="btn btn-secondary btn-sm" type="submit">Save preference</button>
      </form>
    </div>
    <div class="content-card" style="margin-top:18px">
      <div class="section-head">
        <div><h2>Notifications</h2><p>Campaign updates and account announcements.</p></div>
        ${notifications.some((item) => !item.readAt) ? '<button class="btn btn-secondary btn-sm" id="notifications-read-all" type="button">Mark all read</button>' : ''}
      </div>
      <div class="list-stack">${notifications.length
        ? notifications.map((item) => `<article class="notification-row ${item.readAt ? '' : 'unread'}" style="padding:12px;border-bottom:1px solid var(--line)">
            <div class="row-between" style="gap:12px">
              <strong>${escapeHtml(item.title)}</strong>
              ${item.readAt ? '' : `<button class="btn btn-secondary btn-sm" type="button" data-notification-read="${item.id}">Mark read</button>`}
            </div>
            <p class="muted" style="white-space:pre-line">${escapeHtml(item.message)}</p>
            <span class="tiny muted">${formatDate(item.createdAt)}</span>
          </article>`).join('')
        : '<p class="tiny muted">No notifications yet.</p>'}
      </div>
    </div>
    <div class="content-card" style="margin-top:18px">
      <div class="section-head"><div><h2>Two-factor authentication</h2><p>${user.twoFactorEnabled ? 'Authenticator codes are required at sign-in.' : 'Optional: require an authenticator app code when signing in.'}</p></div></div>
      ${user.twoFactorEnabled
        ? `<form id="two-factor-disable" class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><input class="input" name="password" type="password" required autocomplete="current-password"></div>
            <div class="form-group"><label class="form-label">Authenticator code</label><input class="input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></div>
            <div class="form-actions"><button class="btn btn-secondary" type="submit">Disable 2FA</button></div>
          </form>`
        : !user.emailVerified
          ? '<p class="muted">Verify your email address before configuring two-factor authentication.</p>'
          : `<div id="two-factor-setup">${twoFactorSecret
          ? `<p>Enter this secret in your authenticator app: <code>${escapeHtml(twoFactorSecret)}</code></p>
             <form id="two-factor-enable" class="form-grid">
               <div class="form-group"><label class="form-label">Authenticator code</label><input class="input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></div>
               <div class="form-actions"><button class="btn btn-primary" type="submit">Confirm and enable</button></div>
             </form>`
          : '<button class="btn btn-secondary" id="two-factor-start" type="button">Set up authenticator</button>'}</div>`
      }
    </div>`);

  bindPasswordToggles(account.content);
  account.content.querySelector('#profile-form').addEventListener('submit', saveProfile);
  account.content.querySelector('#marketing-preferences').addEventListener('submit', saveMarketingPreferences);
  account.content.querySelector('#notifications-read-all')?.addEventListener('click', markAllNotificationsRead);
  account.content.querySelectorAll('[data-notification-read]').forEach((button) => {
    button.addEventListener('click', () => markNotificationRead(button));
  });
  account.content.querySelector('#password-form').addEventListener('submit', savePassword);
  account.content.querySelector('#address-form').addEventListener('submit', saveAddress);
  account.content.querySelector('#cancel-address-edit').addEventListener('click', () => {
    account.content.querySelector('#address-form').reset();
    account.content.querySelector('#address-form [name="addressId"]').value = '';
  });
  account.content.querySelectorAll('[data-delete-address]').forEach((button) => {
    button.addEventListener('click', () => deleteAddress(button.dataset.deleteAddress));
  });
  account.content.querySelectorAll('[data-edit-address]').forEach((button) => {
    button.addEventListener('click', () => editAddress(button.dataset.editAddress));
  });
  account.content.querySelectorAll('[data-send-verification]').forEach((button) => {
    button.addEventListener('click', () => sendVerification(button.dataset.sendVerification));
  });
  account.content.querySelectorAll('[data-verify-form]').forEach((form) => {
    form.addEventListener('submit', verifyContact);
  });
  account.content.querySelector('#two-factor-start')?.addEventListener('click', setupTwoFactor);
  account.content.querySelector('#two-factor-enable')?.addEventListener('submit', enableTwoFactor);
  account.content.querySelector('#two-factor-disable')?.addEventListener('submit', disableTwoFactor);
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
    await reloadAccount();
    toast(data.devVerificationCode
      ? `Profile updated. Phone verification code: ${data.devVerificationCode}`
      : 'Profile updated.');
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

async function reloadAccount() {
  const [statsData, recent, addressData, userData, rewardsData, notificationsData] = await Promise.all([
    api.get('/orders/stats'),
    api.get('/orders?limit=3'),
    api.get('/addresses'),
    api.get('/auth/me'),
    api.get('/rewards'),
    api.get('/notifications')
  ]);
  stats = statsData;
  account.user = userData.user;
  addresses = addressData.addresses;
  rewards = rewardsData;
  notifications = notificationsData.notifications;
  recentOrders = recent;
  setUser(userData.user);
  render(recent);
}

async function markNotificationRead(button) {
  try {
    await api.patch(`/notifications/${button.dataset.notificationRead}/read`);
    const notification = notifications.find((item) => String(item.id) === button.dataset.notificationRead);
    if (notification) notification.readAt = new Date().toISOString();
    render(recentOrders);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function markAllNotificationsRead() {
  try {
    await api.patch('/notifications/read-all');
    notifications.forEach((item) => { item.readAt = item.readAt || new Date().toISOString(); });
    render(recentOrders);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function saveMarketingPreferences(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  setButtonLoading(button, true, 'Saving…');
  try {
    const data = await api.patch('/auth/profile', {
      marketingEmailConsent: form.marketingEmailConsent.checked
    });
    account.user = data.user;
    setUser(data.user);
    toast('Email preference saved.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function sendVerification(channel) {
  try {
    const data = await api.post('/auth/verification/send', { channel });
    toast(data.devCode ? `Verification code: ${data.devCode}` : data.message);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function verifyContact(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api.post('/auth/verification/verify', {
      channel: form.dataset.verifyForm,
      code: form.code.value.trim()
    });
    setUser(data.user);
    await reloadAccount();
    toast(data.message);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function saveAddress(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const payload = {
    label: form.label.value.trim(),
    fullName: form.fullName.value.trim(),
    phone: form.phone.value.trim(),
    county: form.county.value,
    town: form.town.value.trim(),
    addressLine: form.addressLine.value.trim(),
    isDefault: form.isDefault.checked
  };
  try {
    const id = form.addressId.value;
    await (id ? api.patch(`/addresses/${id}`, payload) : api.post('/addresses', payload));
    form.reset();
    form.addressId.value = '';
    await reloadAccount();
    toast('Delivery address saved.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

function editAddress(id) {
  const address = addresses.find((item) => Number(item.id) === Number(id));
  if (!address) return;
  const form = account.content.querySelector('#address-form');
  form.addressId.value = address.id;
  form.label.value = address.label;
  form.fullName.value = address.fullName;
  form.phone.value = address.phone;
  form.county.value = address.county;
  form.town.value = address.town;
  form.addressLine.value = address.addressLine;
  form.isDefault.checked = address.isDefault;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteAddress(id) {
  try {
    await api.delete(`/addresses/${id}`);
    await reloadAccount();
    toast('Delivery address deleted.');
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function setupTwoFactor() {
  try {
    const data = await api.post('/auth/2fa/setup', {});
    twoFactorSecret = data.secret;
    const recent = await api.get('/orders?limit=3');
    render(recent);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function enableTwoFactor(event) {
  event.preventDefault();
  try {
    const data = await api.post('/auth/2fa/enable', { code: event.currentTarget.code.value.trim() });
    twoFactorSecret = null;
    await reloadAccount();
    toast(data.message);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function disableTwoFactor(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api.post('/auth/2fa/disable', {
      password: form.password.value,
      code: form.code.value.trim()
    });
    await reloadAccount();
    toast(data.message);
  } catch (error) {
    toast(errorMessage(error), 'error');
  }
}

async function load() {
  try {
    await reloadAccount();
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

  const devVerification = sessionStorage.getItem('stokana.devVerification');
  if (devVerification) {
    sessionStorage.removeItem('stokana.devVerification');
    const codes = JSON.parse(devVerification);
    toast(`Development verification codes — email: ${codes.devCode}${codes.phone ? `, phone: ${codes.phone}` : ''}`);
  }
  const accountSetupWarning = sessionStorage.getItem('stokana.accountSetupWarning');
  if (accountSetupWarning) {
    sessionStorage.removeItem('stokana.accountSetupWarning');
    toast(accountSetupWarning, 'error');
  }
  await load();
}

init();
