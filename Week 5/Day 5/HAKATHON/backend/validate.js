const { CATEGORY_IDS, STATUSES } = require('./constants');

const MAX = { ward: 120, landmark: 160, desc: 2000, name: 120, phone: 120 };

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

// Validate + normalise a create-report payload.
// Returns { value } on success or { errors: [...] } on failure.
function validateReport(body) {
  const errors = [];
  const cat = str(body.cat);
  const ward = str(body.ward);
  const landmark = str(body.landmark);
  const desc = str(body.desc || body.description);
  const name = str(body.name);
  const phone = str(body.phone);

  if (!CATEGORY_IDS.includes(cat)) errors.push('cat must be one of: ' + CATEGORY_IDS.join(', '));
  if (!ward) errors.push('ward is required');
  if (!desc) errors.push('desc is required');
  if (!name) errors.push('name is required');
  if (!phone) errors.push('phone (or email) is required');

  if (ward.length > MAX.ward) errors.push('ward too long');
  if (landmark.length > MAX.landmark) errors.push('landmark too long');
  if (desc.length > MAX.desc) errors.push('desc too long');
  if (name.length > MAX.name) errors.push('name too long');
  if (phone.length > MAX.phone) errors.push('phone too long');

  if (errors.length) return { errors };
  return { value: { cat, ward, landmark, desc, name, phone } };
}

function validateStatus(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= STATUSES.length) {
    return { errors: [`status must be an integer 0..${STATUSES.length - 1}`] };
  }
  return { value: n };
}

module.exports = { validateReport, validateStatus };