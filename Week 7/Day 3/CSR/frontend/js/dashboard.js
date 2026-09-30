const roleGreetings = { resident: 'Neighbourhood pulse.', admin: 'Community operations.', collector: 'Field team overview.', sponsor: 'Your support in action.' };

function metricCard(value, label, note, className = '') {
  return `<article class="metric-card ${className}"><span class="metric-value">${value}</span><strong>${label}</strong><small>${note}</small></article>`;
}

function recentReportMarkup(report, escapeHtml, shortDate) {
  const status = report.status;
  const title = escapeHtml(report.title);
  const location = escapeHtml(report.location);
  return `<button type="button" class="recent-report" data-report-id="${escapeHtml(report.id)}"><span class="recent-report-mark ${report.problemType === 'blocked-drainage' ? 'drain-mark' : 'dump-mark'}">${report.problemType === 'blocked-drainage' ? '⌁' : '▤'}</span><span class="recent-report-copy"><strong>${title}</strong><small>${location}</small></span><span class="status-pill status-${status}">${status.replace('-', ' ')}</span><time>${shortDate(report.createdAt, { day: 'numeric', month: 'short' })}</time><span class="row-arrow">↗</span></button>`;
}

async function renderOverview() {
  const { state, api, money, escapeHtml, shortDate, toast } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="overview"]');
  try {
    const requests = [api('/dashboard'), loadReports(), loadCleanups(), loadProjects()];
    const [metrics, reports, cleanups, projects] = await Promise.all(requests);
    const nextCleanup = cleanups.find((cleanup) => cleanup.date >= new Date().toISOString().slice(0, 10));
    const recentReports = reports.slice(0, 4);
    const role = state.user.role;
    const heading = roleGreetings[role] || 'Community overview.';
    let cards = '';
    if (role === 'admin') cards = [metricCard(metrics.pendingReports, 'Needs review', 'PENDING REPORTS', 'metric-warm'), metricCard(metrics.verifiedReports, 'Verified', 'READY FOR ASSIGNMENT'), metricCard(metrics.upcomingCleanups, 'On the calendar', 'UPCOMING CLEANUPS', 'metric-green'), metricCard(metrics.sponsors, 'Backing the work', 'CSR PARTNERS')].join('');
    else if (role === 'sponsor') cards = [metricCard(metrics.projectsSponsored, 'Projects sponsored', 'YOUR PORTFOLIO', 'metric-green'), metricCard(money(metrics.totalSponsored), 'Directed to action', 'TOTAL CONTRIBUTIONS'), metricCard(metrics.wasteCollectedKg.toLocaleString('en-KE') + ' kg', 'Waste collected', 'VERIFIED COMMUNITY IMPACT', 'metric-warm'), metricCard(metrics.drainageSections, 'Drain sections', 'CLEARED & RESTORED')].join('');
    else cards = [metricCard(metrics.reports, 'Reports submitted', 'YOUR COMMUNITY VOICE', 'metric-green'), metricCard(metrics.openReports, 'Still in progress', 'OPEN ISSUES', 'metric-warm'), metricCard(metrics.resolvedReports, 'Resolved', 'ISSUES ADDRESSED'), metricCard(metrics.cleanupsJoined, 'Cleanups joined', 'HANDS ON THE GROUND')].join('');

    panel.innerHTML = `<div class="welcome-banner"><div><p class="eyebrow">${new Intl.DateTimeFormat('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()} / GITHOGORO</p><h1>${heading}</h1><p>Hi ${escapeHtml(state.user.name.split(' ')[0])}. Here’s what’s happening with waste and drainage in your community.</p></div><div class="banner-coordinate"><span>ZONE</span><strong>01</strong><span>GITHOGORO</span></div></div>
      <div class="metric-grid">${cards}</div>
      <div class="overview-grid"><section class="overview-section"><div class="section-heading"><div><p class="eyebrow">COMMUNITY SIGNALS</p><h2>${role === 'resident' ? 'Your latest reports.' : 'Latest reports.'}</h2></div><a href="#reports" class="text-link">View all <span>↗</span></a></div><div class="recent-list">${recentReports.map((report) => recentReportMarkup(report, escapeHtml, shortDate)).join('') || '<div class="empty-state compact-empty"><h3>No reports yet.</h3><p>Reports from this community will show here.</p></div>'}</div></section>
      <aside class="overview-section action-section"><div class="section-heading"><div><p class="eyebrow">NEXT ON THE GROUND</p><h2>Community cleanup.</h2></div><a href="#cleanup" class="text-link">Calendar <span>↗</span></a></div>${nextCleanup ? `<article class="next-event"><div class="event-date"><strong>${shortDate(nextCleanup.date, { day: '2-digit' })}</strong><small>${shortDate(nextCleanup.date, { month: 'short' }).toUpperCase()}</small></div><div><strong>${escapeHtml(nextCleanup.title)}</strong><p>${escapeHtml(nextCleanup.location)}</p><span>${escapeHtml(nextCleanup.time)} · ${nextCleanup.volunteers.length} volunteers</span></div></article>` : '<div class="empty-state compact-empty"><p>No upcoming events scheduled.</p></div>'}<div class="action-note"><span class="note-icon">✳</span><p>Waste left near drains can move downstream. A clear channel protects the whole lane.</p></div>${role === 'sponsor' && projects.length ? `<a class="featured-project-link" href="#csr"><span>CSR PROJECT</span><strong>${escapeHtml(projects[0].name)}</strong><small>${money(projects[0].amountRaised)} of ${money(projects[0].fundingRequired)} raised ↗</small></a>` : ''}</aside></div>`;
    panel.querySelectorAll('[data-report-id]').forEach((button) => button.addEventListener('click', () => { state.selectedReportId = button.dataset.reportId; window.location.hash = 'report-detail'; }));
  } catch (error) { toast(error.message, true); }
}

function renderProfile() {
  const { state, escapeHtml, api, toast } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="profile"]');
  const user = state.user;
  panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">ACCOUNT / YOUR DETAILS</p><h1>Your profile.</h1><p class="heading-copy">Keep your contact details current so the community team can follow up.</p></div></div><form id="profile-form" class="content-form profile-form"><div class="profile-identity"><span class="profile-avatar">${user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><strong>${escapeHtml(user.name)}</strong><span class="role-label">${escapeHtml(user.role.toUpperCase())}</span></div></div><label for="profile-name">Full name</label><input id="profile-name" name="name" value="${escapeHtml(user.name)}" minlength="2" maxlength="80" required><label for="profile-email">Email</label><input id="profile-email" type="email" value="${escapeHtml(user.email)}" disabled><label for="profile-phone">Phone</label><input id="profile-phone" name="phone" type="tel" value="${escapeHtml(user.phone || '')}" placeholder="+254 7xx xxx xxx"><label for="profile-location">Location</label><input id="profile-location" name="location" value="${escapeHtml(user.location)}" minlength="2" required><p id="profile-message" class="form-message" role="status"></p><button class="button button-primary" type="submit">Save profile <span>↗</span></button></form>`;
  panel.querySelector('#profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(values) });
      state.user = result.user;
      document.querySelector('#sidebar-name').textContent = result.user.name;
      toast('Profile updated.');
    } catch (error) { document.querySelector('#profile-message').textContent = error.message; }
  });
}

window.addEventListener('mtaaclean:view', (event) => {
  if (event.detail === 'overview') renderOverview();
  if (event.detail === 'profile') renderProfile();
});