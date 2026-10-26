import { api } from '../api.js';
import { showAlert, clearAlert } from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('forgot-form');
const alertHost = document.getElementById('forgot-alert');
const devHost = document.getElementById('dev-reset');
const submitButton = document.getElementById('forgot-submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertHost);
  devHost.classList.add('hidden');
  devHost.innerHTML = '';

  const email = form.email.value.trim();
  if (!email) {
    showAlert(alertHost, 'Enter the email address linked to your account.', 'danger');
    return;
  }

  setButtonLoading(submitButton, true, 'Sending…');
  try {
    const data = await api.post('/auth/forgot-password', { email });
    showAlert(alertHost, data.message, 'success', 'Check your email');
    if (data.devResetToken) {
      devHost.innerHTML = `
        <div class="alert warning" style="margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div>
            <strong>Development mode</strong>
            <span>Email delivery is not configured. <a href="/reset-password?token=${encodeURIComponent(
              data.devResetToken
            )}" style="font-weight:700;text-decoration:underline">Open your reset link</a> to continue.</span>
          </div>
        </div>`;
      devHost.classList.remove('hidden');
    }
    form.reset();
  } catch (error) {
    showAlert(alertHost, errorMessage(error), 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
});
