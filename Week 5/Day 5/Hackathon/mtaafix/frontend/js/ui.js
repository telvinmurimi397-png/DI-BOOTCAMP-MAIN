// Small shared UI helpers used across pages.
(function (global) {
  'use strict';
  function toast(msg, kind) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + (kind || '');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.className = 'toast ' + (kind || ''); }, 3200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }
  function fillSelect(sel, items, valueKey, labelKey, includeBlank) {
    if (!sel) return;
    var html = includeBlank ? '<option value="">' + includeBlank + '</option>' : '';
    items.forEach(function (it) {
      html += '<option value="' + esc(it[valueKey]) + '">' + esc(it[labelKey]) + '</option>';
    });
    sel.innerHTML = html;
  }
  global.UI = { toast: toast, esc: esc, fmtDate: fmtDate, fillSelect: fillSelect };
})(window);