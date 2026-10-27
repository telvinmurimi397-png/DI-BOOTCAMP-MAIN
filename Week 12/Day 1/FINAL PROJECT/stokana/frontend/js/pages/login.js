import { api } from '../api.js';
import { getUser, setUser, nextPath, dashboardFor } from '../auth.js';
import { bindPasswordToggles, showAlert, clearAlert } from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('login-form');
const alertHost = document.getElementById('login-alert');
const submitButton = document.getElementById('login-submit');
const searchParams = new URLSearchParams(window.location.search);
let selectedRole = searchParams.get('role') || (searchParams.get('next')?.startsWith('/admin') ? 'admin' : 'buyer');
if (!['buyer', 'seller', 'admin'].includes(selectedRole)) selectedRole = 'buyer';

function setSelectedRole(role) {
  selectedRole = role;
  document.querySelectorAll('[data-role]').forEach((button) => {
    const active = button.dataset.role === role;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

async function init() {
  bindPasswordToggles();
  setSelectedRole(selectedRole);
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => setSelectedRole(button.dataset.role));
  });

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
      const data = await api.post('/auth/login', { email, password, role: selectedRole });
      setUser(data.user);
      window.location.replace(nextPath(dashboardFor(data.user.role)));
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(submitButton, false);
    }
  });
}

init();
