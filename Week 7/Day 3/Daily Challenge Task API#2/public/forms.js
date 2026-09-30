const forms = document.querySelectorAll('form[data-endpoint]');

forms.forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector('.form-message');

  function updateButton() {
    button.disabled = !form.checkValidity();
  }

  form.addEventListener('input', updateButton);
  form.addEventListener('change', updateButton);
  updateButton();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    button.disabled = true;
    message.textContent = 'Please wait...';
    message.classList.remove('message-error', 'message-success');
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed.');

      message.textContent = result.message;
      message.classList.add('message-success');
      if (form.id === 'register-form') {
        form.reset();
        updateButton();
      }
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('message-error');
      updateButton();
    }
  });
});