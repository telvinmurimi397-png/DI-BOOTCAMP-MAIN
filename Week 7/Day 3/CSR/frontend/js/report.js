const reportViewNames = { pending: 'Pending', verified: 'Verified', assigned: 'Assigned', 'in-progress': 'In progress', resolved: 'Resolved' };
const reportViewStatusClass = (status) => `status-${status}`;

function reportEmptyState(title, copy) {
  return `<div class="empty-state"><span class="empty-icon">⌁</span><h3>${title}</h3><p>${copy}</p></div>`;
}

function renderReportForm() {
  const { state, escapeHtml } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="report-create"]');
  if (state.user.role !== 'resident') {
    panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">COMMUNITY REPORTS</p><h1>Report an issue</h1></div></div>${reportEmptyState('Resident access required', 'Sign in with a resident account to submit a new issue.')}`;
    return;
  }
  panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">GITHOGORO / COMMUNITY REPORT</p><h1>Report a problem.</h1><p class="heading-copy">Help the team find the issue and plan a response.</p></div><a class="back-link" href="#reports">← My reports</a></div>
    <form id="report-form" class="content-form" enctype="multipart/form-data">
      <div class="form-section-title"><span>01</span><div><strong>What needs attention?</strong><small>Select the issue type and share what you noticed.</small></div></div>
      <label for="problem-type">Problem type</label><select id="problem-type" name="problemType" required><option value="">Choose a problem</option><option value="illegal-dumping">Illegal dumping</option><option value="blocked-drainage">Blocked drainage</option></select>
      <label for="report-location">Location in Githogoro</label><input id="report-location" name="location" minlength="3" maxlength="160" placeholder="Zone, street, landmark or nearby building" required>
      <label for="report-description">Description</label><textarea id="report-description" name="description" minlength="10" maxlength="1200" rows="5" placeholder="What is happening? Is water collecting, or is waste blocking a channel?" required></textarea>
      <label class="upload-label" for="report-photo">Photo <span>OPTIONAL · JPG, PNG OR WEBP · MAX 5 MB</span></label><input id="report-photo" name="photo" type="file" accept="image/*">
      <p class="form-message" id="report-message" role="status"></p><div class="form-actions"><button class="button button-primary" type="submit"><span>Submit report</span><span>↗</span></button><a class="back-link" href="#reports">Cancel</a></div>
    </form>`;
  const form = document.querySelector('#report-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const message = document.querySelector('#report-message');
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = 'Sending your report…';
    try {
      const payload = await window.MtaaClean.api('/reports', { method: 'POST', body: new FormData(form) });
      window.MtaaClean.toast('Your report is in. The community team will review it.');
      await loadReports();
      window.MtaaClean.state.selectedReportId = payload.report.id;
      window.location.hash = 'report-detail';
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('message-error');
      button.disabled = false;
    }
  });
}

function renderReports() {
  const { state, escapeHtml, shortDate } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="reports"]');
  const staff = ['admin', 'collector'].includes(state.user.role);
  const reports = state.reports;
  const rows = reports.map((report) => `<button class="report-row" data-report-id="${escapeHtml(report.id)}" type="button">
      <span class="report-type-mark ${report.problemType === 'blocked-drainage' ? 'drain-mark' : 'dump-mark'}">${report.problemType === 'blocked-drainage' ? '⌁' : '▤'}</span>
      <span class="report-main"><strong>${escapeHtml(report.title)}</strong><small>${escapeHtml(report.location)}</small></span>
      <span class="report-owner">${escapeHtml(report.reportedByName)}</span>
      <span class="status-pill ${reportViewStatusClass(report.status)}">${reportViewNames[report.status] || escapeHtml(report.status)}</span>
      <time>${shortDate(report.createdAt, { day: 'numeric', month: 'short' })}</time>
      ${staff ? `<span class="row-arrow">↗</span>` : ''}
    </button>`).join('');
  panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">GITHOGORO / ${staff ? 'FIELD QUEUE' : 'YOUR REPORTS'}</p><h1>${staff ? 'Field reports.' : 'Reports & updates.'}</h1><p class="heading-copy">${staff ? 'Review incoming issues and move each one toward a fix.' : 'Every issue has a status. Follow what happens next.'}</p></div>${state.user.role === 'resident' ? '<a class="button button-primary" href="#report-create"><span>＋</span> New report</a>' : ''}</div>
    <div class="filter-bar"><div class="filter-tabs"><button class="filter-tab active" data-status="all" type="button">All <span>${reports.length}</span></button>${['pending', 'verified', 'assigned', 'in-progress', 'resolved'].map((status) => `<button class="filter-tab" data-status="${status}" type="button">${reportViewNames[status]}</button>`).join('')}</div><span class="list-caption">${staff ? 'COMMUNITY-WIDE' : 'YOUR SUBMISSIONS'}</span></div>
    <div class="report-table"><div class="report-table-head"><span>PROBLEM / LOCATION</span><span>REPORTED BY</span><span>STATUS</span><span>DATE</span></div><div id="report-rows">${rows || reportEmptyState('No reports yet', 'New issues from your community will appear here.')}</div></div>`;
  panel.querySelectorAll('[data-report-id]').forEach((row) => row.addEventListener('click', () => {
    state.selectedReportId = row.dataset.reportId;
    window.location.hash = 'report-detail';
  }));
  panel.querySelectorAll('.filter-tab').forEach((button) => button.addEventListener('click', () => {
    panel.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    const filtered = button.dataset.status === 'all' ? reports : reports.filter((report) => report.status === button.dataset.status);
    document.querySelector('#report-rows').innerHTML = filtered.map((report) => `<button class="report-row" data-report-id="${escapeHtml(report.id)}" type="button"><span class="report-type-mark ${report.problemType === 'blocked-drainage' ? 'drain-mark' : 'dump-mark'}">${report.problemType === 'blocked-drainage' ? '⌁' : '▤'}</span><span class="report-main"><strong>${escapeHtml(report.title)}</strong><small>${escapeHtml(report.location)}</small></span><span class="report-owner">${escapeHtml(report.reportedByName)}</span><span class="status-pill ${reportViewStatusClass(report.status)}">${reportViewNames[report.status]}</span><time>${shortDate(report.createdAt, { day: 'numeric', month: 'short' })}</time><span class="row-arrow">↗</span></button>`).join('') || reportEmptyState('No reports in this stage', 'Try another status filter.');
    document.querySelectorAll('#report-rows [data-report-id]').forEach((row) => row.addEventListener('click', () => { state.selectedReportId = row.dataset.reportId; window.location.hash = 'report-detail'; }));
  }));
}

function renderReportDetail() {
  const { state, escapeHtml, fullDate, api } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="report-detail"]');
  const report = state.reports.find((item) => item.id === state.selectedReportId);
  if (!report) {
    panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">REPORT TRACKING</p><h1>Report not found.</h1></div><a class="back-link" href="#reports">← Reports</a></div>`;
    return;
  }
  const staff = ['admin', 'collector'].includes(state.user.role);
  const stages = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];
  panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">REPORT / ${escapeHtml(report.id.slice(0, 8).toUpperCase())}</p><h1>${escapeHtml(report.title)}</h1></div><a class="back-link" href="#reports">← Back to reports</a></div>
    <div class="detail-grid"><article class="detail-card"><div class="detail-card-head"><span class="status-pill ${reportViewStatusClass(report.status)}">${reportViewNames[report.status]}</span><time>Reported ${fullDate(report.createdAt)}</time></div><dl class="report-facts"><div><dt>LOCATION</dt><dd>${escapeHtml(report.location)}</dd></div><div><dt>REPORTED BY</dt><dd>${escapeHtml(report.reportedByName)}</dd></div><div><dt>ISSUE TYPE</dt><dd>${report.problemType === 'blocked-drainage' ? 'Blocked drainage' : 'Illegal dumping'}</dd></div></dl><h2>What’s happening</h2><p>${escapeHtml(report.description)}</p>${report.image ? `<img class="report-photo" src="${escapeHtml(report.image)}" alt="Resident-submitted report photo">` : ''}</article>
      <aside class="detail-card timeline-card"><p class="eyebrow">RESPONSE TRACKER</p><div class="timeline">${stages.map((stage) => { const stageIndex = stages.indexOf(stage); const currentIndex = stages.indexOf(report.status); return `<div class="timeline-step ${stageIndex <= currentIndex ? 'step-done' : ''} ${stage === report.status ? 'step-current' : ''}"><span class="timeline-dot"></span><div><strong>${reportViewNames[stage]}</strong><small>${escapeHtml(report.updates?.find((item) => item.status === stage)?.note || 'Waiting on this step.')}</small></div></div>`; }).join('')}</div></aside></div>
    ${staff && state.user.role === 'admin' ? `<form id="report-status-form" class="status-update-form"><label for="next-status">Update report status</label><select id="next-status" name="status">${stages.map((stage) => `<option value="${stage}" ${report.status === stage ? 'selected' : ''}>${reportViewNames[stage]}</option>`).join('')}</select><input name="assignedTo" placeholder="Cleanup team / assignee" value="${escapeHtml(report.assignedTo || '')}"><input name="note" placeholder="Add a progress note"><button class="button button-primary" type="submit">Save update <span>↗</span></button></form>` : ''}`;
  const form = panel.querySelector('#report-status-form');
  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      await api(`/reports/${report.id}/status`, { method: 'PATCH', body: JSON.stringify(body) });
      await loadReports();
      renderReportDetail();
      window.MtaaClean.toast('Report status updated.');
    } catch (error) { window.MtaaClean.toast(error.message, true); }
  });
}

async function loadReports() {
  const result = await window.MtaaClean.api('/reports');
  window.MtaaClean.state.reports = result.reports;
  document.querySelector('#nav-report-count').textContent = result.reports.filter((item) => item.status === 'pending').length || '';
  return result.reports;
}

async function renderReportView(view) {
  try {
    if (view === 'report-create') return renderReportForm();
    await loadReports();
    if (view === 'reports') renderReports();
    if (view === 'report-detail') renderReportDetail();
  } catch (error) { window.MtaaClean.toast(error.message, true); }
}

window.loadReports = loadReports;
window.addEventListener('mtaaclean:view', (event) => {
  if (['reports', 'report-create', 'report-detail'].includes(event.detail)) renderReportView(event.detail);
});