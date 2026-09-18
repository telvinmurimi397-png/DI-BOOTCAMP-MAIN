// Shared domain constants — kept in sync with the frontend.

const CATEGORIES = [
  { id: 'roads',    label: 'Roads & Potholes',  icon: '🛣️' },
  { id: 'water',    label: 'Water',             icon: '💧' },
  { id: 'power',    label: 'Electricity',       icon: '⚡' },
  { id: 'garbage',  label: 'Garbage',           icon: '🗑️' },
  { id: 'lights',   label: 'Streetlights',      icon: '💡' },
  { id: 'drainage', label: 'Drainage & Floods', icon: '🌊' },
  { id: 'security', label: 'Security',          icon: '🚨' },
  { id: 'other',    label: 'Other',             icon: '📌' }
];

const CATEGORY_IDS = CATEGORIES.map(c => c.id);

// status index -> human label (mirrors the frontend timeline)
const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

module.exports = { CATEGORIES, CATEGORY_IDS, STATUSES };