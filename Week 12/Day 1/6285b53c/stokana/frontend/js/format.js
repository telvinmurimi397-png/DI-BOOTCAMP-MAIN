const numberFormat = new Intl.NumberFormat('en-KE');

export function money(value, { compact = false, decimals = null } = {}) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 'KSh 0';
  if (compact && amount >= 1_000_000) return `KSh ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  if (compact && amount >= 1_000) return `KSh ${(amount / 1_000).toFixed(amount >= 100_000 ? 0 : 1)}K`;
  const digits = decimals ?? (Number.isInteger(amount) ? 0 : 2);
  return `KSh ${numberFormat.format(Number(amount.toFixed(digits)))}`;
}

export function plainNumber(value) {
  return numberFormat.format(Number(value ?? 0));
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDate(value)} · ${date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 min ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

export function chatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  }
  const diff = (today - date) / 86_400_000;
  if (diff < 7) return date.toLocaleDateString('en-KE', { weekday: 'short' });
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS_MAP = {
  pending_payment: { label: 'Awaiting payment', tone: 'amber' },
  processing: { label: 'Processing', tone: 'blue' },
  shipped: { label: 'Shipped', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  paid: { label: 'Paid', tone: 'green' },
  unpaid: { label: 'Unpaid', tone: 'amber' },
  refunded: { label: 'Refunded', tone: 'grey' },
  pending: { label: 'Pending review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  archived: { label: 'Archived', tone: 'grey' },
  suspended: { label: 'Suspended', tone: 'red' },
  success: { label: 'Successful', tone: 'green' },
  failed: { label: 'Failed', tone: 'red' },
  packed: { label: 'Packed', tone: 'amber' },
  dispatched: { label: 'Dispatched', tone: 'blue' },
  in_transit: { label: 'In transit', tone: 'blue' },
  earned: { label: 'Earned', tone: 'blue' },
  paid_out: { label: 'Paid out', tone: 'green' },
  out_for_delivery: { label: 'Out for delivery', tone: 'blue' },
  ready_for_pickup: { label: 'Ready for pickup', tone: 'blue' },
  new: { label: 'New', tone: 'blue' },
  used: { label: 'Used', tone: 'grey' },
  refurbished: { label: 'Refurbished', tone: 'amber' },
  active: { label: 'Active', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'red' },
  buyer: { label: 'Buyer', tone: 'grey' },
  seller: { label: 'Seller', tone: 'blue' },
  admin: { label: 'Admin', tone: 'dark' }
};

export function statusMeta(status) {
  return STATUS_MAP[status] || { label: titleCase(String(status || '').replace(/_/g, ' ')), tone: 'grey' };
}

export function statusBadge(status, { dot = false } = {}) {
  const meta = statusMeta(status);
  return `<span class="badge ${meta.tone}${dot ? ' badge-dot' : ''}">${escapeHtml(meta.label)}</span>`;
}

export function shipmentStatusLabel(status) {
  const labels = {
    pending: 'Preparing',
    packed: 'Packed',
    shipped: 'In transit',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || statusMeta(status).label;
}

export function titleCase(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${plainNumber(count)} ${Number(count) === 1 ? singular : plural}`;
}

export function truncate(value = '', length = 120) {
  const text = String(value);
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}…`;
}

export function fileSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function monthShort(value) {
  const date = new Date(`${value}-01T00:00:00`);
  return date.toLocaleDateString('en-KE', { month: 'short' });
}

export function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
