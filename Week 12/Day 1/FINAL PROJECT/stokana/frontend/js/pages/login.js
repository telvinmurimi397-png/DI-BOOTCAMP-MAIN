import { api } from '../api.js';
import { getUser, setUser, nextPath, dashboardFor } from '../auth.js';
import { bindPasswordToggles, showAlert, clearAlert } from '../auth-ui.js';
import { setButtonLoading, errorMessage } from '../ui.js';

const form = document.getElementById('login-form');
const alertHost = document.getElementById('login-alert');
const submitButton = document.getElementById('login-submit');

function showTwoFactorForm(challengeToken) {
  form.hidden = true;
  const challenge = document.createElement('form');
  challenge.className = 'auth-form';
  challenge.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="login-2fa-code">Authenticator code</label>
      <input class="input" id="login-2fa-code" name="code" inputmode="numeric"
        pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required>
    </div>
    <button class="btn btn-primary btn-lg btn-block" type="submit">Verify and sign in</button>`;
  form.after(challenge);
  challenge.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = challenge.querySelector('button[type="submit"]');
    setButtonLoading(button, true, 'Verifying…');
    try {
      const data = await api.post('/auth/login/2fa', {
        challengeToken,
        code: challenge.code.value.trim()
      });
      setUser(data.user);
      window.location.replace(nextPath(dashboardFor(data.user.role)));
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(button, false);
    }
  });
  challenge.querySelector('input').focus();
}

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
      if (data.requiresTwoFactor) {
        showTwoFactorForm(data.challengeToken);
        return;
      }
      setUser(data.user);
      window.location.replace(nextPath(dashboardFor(data.user.role)));
    } catch (error) {
      showAlert(alertHost, errorMessage(error), 'danger');
      setButtonLoading(submitButton, false);
    }
  });
}

init();
