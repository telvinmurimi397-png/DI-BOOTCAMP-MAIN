import { icon } from './icons.js';
import { escapeHtml } from './format.js';

export const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang’a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira',
  'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

export function bindPasswordToggles(root = document) {
  root.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.closest('.input-group')?.querySelector('input');
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.innerHTML = icon(showing ? 'eye' : 'eye-off', { size: 17 });
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });
}

export function showAlert(host, message, tone = 'danger', title = '') {
  if (!host) return;
  host.innerHTML = `
    <div class="alert ${tone}" role="alert" style="margin-bottom:16px">
      ${icon(tone === 'success' ? 'check-circle' : tone === 'warning' ? 'alert-circle' : 'alert-circle', { size: 17 })}
      <div>${title ? `<strong>${escapeHtml(title)}</strong>` : ''}<span>${escapeHtml(message)}</span></div>
    </div>`;
}

export function clearAlert(host) {
  if (host) host.innerHTML = '';
}

export function setFieldError(input, message) {
  if (!input) return;
  input.classList.add('invalid');
  input.focus();
  input.setCustomValidity(message);
  input.reportValidity();
  input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
}

export function passwordToggle(buttonLabel = 'Show password') {
  return `<button class="input-action" type="button" data-toggle-password aria-label="${buttonLabel}">${icon('eye', {
    size: 17
  })}</button>`;
}
