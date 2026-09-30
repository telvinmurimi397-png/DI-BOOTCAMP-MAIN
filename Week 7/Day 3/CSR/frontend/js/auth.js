const form = document.querySelector('#login-form, #register-form');
const authMessage = document.querySelector('#auth-message');
const submitButton = form.querySelector('[type="submit"]');

function syncSubmitState() {
  submitButton.disabled = !form.checkValidity();
}

form.addEventListener('input', syncSubmitState);
form.addEventListener('change', syncSubmitState);
syncSubmitState();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submitButton.disabled = true;
  authMessage.textContent = 'Connecting…';
  authMessage.className = 'form-message';
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const endpoint = form.id === 'register-form' ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not sign in.');
    localStorage.setItem('mtaaclean-token', result.token);
    window.location.href = '/';
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.classList.add('message-error');
    syncSubmitState();
  }
});