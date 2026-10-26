import { api } from '../api.js';
import { getUser, setUser, nextPath, dashboardFor } from '../auth.js';
import {
  bindPasswordToggles,
  showAlert,
  clearAlert,
  COUNTIES
} from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('register-form');
const alertHost = document.getElementById('register-alert');
const submitButton = document.getElementById('register-submit');
const sellerFields = document.getElementById('seller-fields');
const countySelect = document.getElementById('register-county');
const shopNameInput = document.getElementById('register-shop-name');

let role = new URLSearchParams(window.location.search).get('role') === 'seller' ? 'seller' : 'buyer';

function setRole(nextRole) {
  role = nextRole;
  document.querySelectorAll('[data-role]').forEach((button) => {
    const active = button.dataset.role === role;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  sellerFields.classList.toggle('hidden', role !== 'seller');
  shopNameInput.required = role === 'seller';
}

function populateCounties() {
  countySelect.insertAdjacentHTML(
    'beforeend',
    COUNTIES.map((county) => `<option value="${county}">${county}</option>`).join('')
  );
}

async function init() {
  populateCounties();
  bindPasswordToggles();

  const existing = await getUser();
  if (existing) {
    window.location.replace(nextPath(dashboardFor(existing.role)));
    return;
  }

  setRole(role);

  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => setRole(button.dataset.role));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertHost);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      showAlert(alertHost, 'Your passwords do not match. Please confirm your password again.', 'danger');
      form.confirmPassword.focus();
      return;
    }

    const payload = {
      fullName,
      email,
      password,
      role,
      ...(phone ? { phone } : {})
    };

    if (role === 'seller') {
      payload.shopName = form.shopName.value.trim();
      payload.shopCounty = form.shopCounty.value || undefined;
      payload.shopTown = form.shopTown.value.trim() || undefined;
      payload.shopDescription = form.shopDescription.value.trim() || undefined;
    }

    if (!form.terms.checked) {
      showAlert(alertHost, 'Please agree to the Terms of Service and Privacy Policy to continue.', 'danger');
      return;
    }

    setButtonLoading(submitButton, true, 'Creating account…');
    try {
      const data = await api.post('/auth/register', payload);
      setUser(data.user);
      const fallback = data.user.role === 'seller' ? '/seller' : '/account';
      window.location.replace(nextPath(fallback));
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(submitButton, false);
    }
  });
}

init();
