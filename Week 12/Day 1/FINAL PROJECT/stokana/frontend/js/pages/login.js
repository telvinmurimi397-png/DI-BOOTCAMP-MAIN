import { api } from '../api.js';
import { getUser, setUser, nextPath, dashboardFor } from '../auth.js';
import { bindPasswordToggles, showAlert, clearAlert } from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('login-form');
const alertHost = document.getElementById('login-alert');
const submitButton = document.getElementById('login-submit');
const searchParams = new URLSearchParams(window.location.search);

async function init() {
  bindPasswordToggles();

  const existing = await getUser();
  if (existing) {
    window.location.replace(nextPath(dashboardFor(existing.role)));
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertHost);

    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) {
      showAlert(alertHost, 'Enter your email address and password.', 'danger');
      return;
    }

    setButtonLoading(submitButton, true, 'Signing in…');
    try {
      const data = await api.post('/auth/login', { email, password });
      setUser(data.user);
      window.location.replace(nextPath(dashboardFor(data.user.role)));
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(submitButton, false);
    }
  });
}

init();
