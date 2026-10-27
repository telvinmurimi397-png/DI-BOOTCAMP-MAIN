import { api } from '../api.js';
import { bindPasswordToggles, showAlert, clearAlert } from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('reset-form');
const alertHost = document.getElementById('reset-alert');
const successHost = document.getElementById('reset-success');
const submitButton = document.getElementById('reset-submit');
const token = new URLSearchParams(window.location.search).get('token') || '';

async function init() {
  bindPasswordToggles();

  if (!/^[a-f0-9]{64}$/.test(token)) {
    form.classList.add('hidden');
    showAlert(
      alertHost,
      'This reset link is missing or invalid. Request a new link to reset your password.',
      'danger',
      'Invalid reset link'
    );
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertHost);

    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    if (!password || password !== confirmPassword) {
      showAlert(alertHost, 'Your passwords do not match. Please confirm your new password.', 'danger');
      form.confirmPassword.focus();
      return;
    }

    setButtonLoading(submitButton, true, 'Resetting…');
    try {
      await api.post('/auth/reset-password', { token, password });
      form.classList.add('hidden');
      successHost.classList.remove('hidden');
      successHost.innerHTML = `
        <div class="alert success" style="margin-bottom:18px">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <div><strong>Password updated</strong><span>Your password has been reset. Sign in with your new password to continue.</span></div>
        </div>
        <a class="btn btn-primary btn-lg btn-block" href="/login">Sign in</a>`;
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 4000);
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(submitButton, false);
    }
  });
}

init();
