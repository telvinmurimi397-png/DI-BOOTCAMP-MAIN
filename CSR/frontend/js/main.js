const rolePages = {
  company: 'company.html',
  organization: 'organization.html',
  volunteer: 'volunteer.html',
  admin: 'admin.html'
};

function dashboardUrl(role) {
  const page = rolePages[role];
  return page ? `/dashboards/${page}` : '/';
}

async function submitAuthForm(form) {
  const message = form.querySelector('[data-form-message]');
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  message.textContent = '';
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/auth/${form.dataset.authForm}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('The API returned a web page instead of JSON. Start the backend and open GreenFuture at http://localhost:5000.');
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');

    sessionStorage.setItem('greenfutureToken', result.token);
    window.location.assign(dashboardUrl(result.user.role));
  } catch (error) {
    message.textContent = error.message || 'Could not reach the server. Check your connection and try again.';
    submitButton.disabled = false;
  }
}

async function loadVolunteerSummary(token) {
  const message = document.querySelector('[data-volunteer-summary-message]');

  try {
    const response = await fetch('/api/volunteer/dashboard', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load volunteer activity totals.');

    Object.entries(result).forEach(([key, value]) => {
      const element = document.querySelector('[data-volunteer-stat="' + key + '"]');
      if (element) element.textContent = value === null ? 'Not tracked' : String(value);
    });
  } catch (error) {
    console.error('Volunteer dashboard summary failed:', error);
    message.textContent = 'Activity totals could not be loaded. Refresh the page to try again.';
  }
}

async function loadOrganizationSummary(token) {
  const message = document.querySelector('[data-organization-summary-message]');
  const verificationStatus = document.querySelector('[data-organization-verification-status]');

  try {
    const response = await fetch('/api/organization/dashboard', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load organization dashboard totals.');

    verificationStatus.textContent = result.isVerified ? 'Verified' : 'Verification pending';
    verificationStatus.classList.toggle('is-verified', result.isVerified);
    Object.entries(result).forEach(([key, value]) => {
      const element = document.querySelector('[data-organization-stat="' + key + '"]');
      if (element) element.textContent = value === null ? 'Not tracked' : String(value);
    });
  } catch (error) {
    console.error('Organization dashboard summary failed:', error);
    message.textContent = 'Organization totals could not be loaded. Refresh the page to try again.';
  }
}

async function loadCompanySummary(token) {
  const message = document.querySelector('[data-company-summary-message]');
  const verificationStatus = document.querySelector('[data-company-verification-status]');

  try {
    const response = await fetch('/api/company/dashboard', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load company dashboard totals.');

    verificationStatus.textContent = result.isVerified ? 'Verified' : 'Verification pending';
    verificationStatus.classList.toggle('is-verified', result.isVerified);
    Object.entries(result).forEach(([key, value]) => {
      const element = document.querySelector('[data-company-stat="' + key + '"]');
      if (element) element.textContent = value === null ? 'Not tracked' : String(value);
    });
  } catch (error) {
    console.error('Company dashboard summary failed:', error);
    message.textContent = 'Company totals could not be loaded. Refresh the page to try again.';
  }
}

async function adminRequest(path, token, options = {}) {
  const response = await fetch('/api/admin' + path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: 'Bearer ' + token,
      ...options.headers
    }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Admin request failed.');
  return result;
}

function appendAdminCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
  row.appendChild(cell);
  return cell;
}

function appendAdminEmptyRow(body, columnCount, message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = columnCount;
  cell.className = 'admin-empty-cell';
  cell.textContent = message;
  row.appendChild(cell);
  body.appendChild(row);
}

function makeAdminSelect(options, selectedValue) {
  const select = document.createElement('select');
  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = value === selectedValue;
    select.appendChild(option);
  });
  return select;
}

function renderAdminUsers(users) {
  const table = document.querySelector('[data-admin-users]');
  const filter = document.querySelector('[data-admin-user-filter]').value;
  const filtered = filter ? users.filter((user) => user.role === filter) : users;
  table.replaceChildren();
  if (!filtered.length) return appendAdminEmptyRow(table, 5, 'No users found.');

  filtered.forEach((user) => {
    const row = document.createElement('tr');
    appendAdminCell(row, user.name);
    appendAdminCell(row, user.email);
    appendAdminCell(row, user.role);
    appendAdminCell(row, ['company', 'organization'].includes(user.role)
      ? user.isVerified ? 'Verified' : 'Not verified'
      : 'Not applicable');
    appendAdminCell(row, new Date(user.createdAt).toLocaleDateString());
    table.appendChild(row);
  });
}

function renderAdminVerificationUsers(users, role, tableSelector) {
  const table = document.querySelector(tableSelector);
  const filtered = users.filter((user) => user.role === role);
  table.replaceChildren();
  if (!filtered.length) return appendAdminEmptyRow(table, 4, `No ${role} accounts found.`);

  filtered.forEach((user) => {
    const row = document.createElement('tr');
    appendAdminCell(row, user.name);
    appendAdminCell(row, user.email);
    appendAdminCell(row, user.isVerified ? 'Verified' : 'Not verified');
    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'button button-small';
    button.type = 'button';
    button.textContent = user.isVerified ? 'Revoke verification' : 'Verify';
    button.addEventListener('click', async () => {
      const token = sessionStorage.getItem('greenfutureToken');
      try {
        await adminRequest(`/users/${user.id}/verification`, token, {
          method: 'PATCH',
          body: JSON.stringify({ isVerified: !user.isVerified })
        });
        await loadAdminDashboard(token);
      } catch (error) {
        showAdminMessage(error.message);
      }
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

function renderAdminProjects(projects) {
  const table = document.querySelector('[data-admin-projects]');
  table.replaceChildren();
  if (!projects.length) appendAdminEmptyRow(table, 5, 'No projects found.');

  projects.forEach((project) => {
    const row = document.createElement('tr');
    appendAdminCell(row, project.title);
    appendAdminCell(row, project.ownerName ? `${project.ownerName} (${project.ownerRole})` : 'Unassigned');
    const statusCell = document.createElement('td');
    const status = makeAdminSelect(['Pending', 'Approved', 'Completed', 'Rejected'], project.status);
    statusCell.appendChild(status);
    row.appendChild(statusCell);
    appendAdminCell(row, project.volunteerCount);
    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-small';
    button.textContent = 'Save';
    button.addEventListener('click', async () => {
      const token = sessionStorage.getItem('greenfutureToken');
      try {
        await adminRequest(`/projects/${project.id}/status`, token, {
          method: 'PATCH',
          body: JSON.stringify({ status: status.value })
        });
        await loadAdminDashboard(token);
      } catch (error) {
        showAdminMessage(error.message);
      }
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    table.appendChild(row);
  });

  const proposals = document.querySelector('[data-admin-proposals]');
  const pending = projects.filter((project) => project.status === 'Pending');
  proposals.replaceChildren();
  if (!pending.length) appendAdminEmptyRow(proposals, 4, 'No proposals are awaiting a decision.');
  pending.forEach((project) => {
    const row = document.createElement('tr');
    appendAdminCell(row, project.title);
    appendAdminCell(row, project.ownerName ? `${project.ownerName} (${project.ownerRole})` : 'Unassigned');
    appendAdminCell(row, project.category);
    const actionCell = document.createElement('td');
    ['Approved', 'Rejected'].forEach((status) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-small admin-action-button';
      button.textContent = status === 'Approved' ? 'Approve' : 'Reject';
      button.addEventListener('click', async () => {
        const token = sessionStorage.getItem('greenfutureToken');
        try {
          await adminRequest(`/projects/${project.id}/status`, token, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          });
          await loadAdminDashboard(token);
        } catch (error) {
          showAdminMessage(error.message);
        }
      });
      actionCell.appendChild(button);
    });
    row.appendChild(actionCell);
    proposals.appendChild(row);
  });

  const impact = document.querySelector('[data-admin-impact-projects]');
  const completed = projects.filter((project) => project.status === 'Completed');
  impact.replaceChildren();
  if (!completed.length) appendAdminEmptyRow(impact, 4, 'No completed projects to report yet.');
  completed.forEach((project) => {
    const row = document.createElement('tr');
    appendAdminCell(row, project.title);
    appendAdminCell(row, project.ownerName || 'Unassigned');
    appendAdminCell(row, project.category);
    appendAdminCell(row, project.targetMetric ?? 'No target recorded');
    impact.appendChild(row);
  });
}

function renderAdminSponsorships(sponsorships) {
  const table = document.querySelector('[data-admin-sponsorships]');
  table.replaceChildren();
  if (!sponsorships.length) return appendAdminEmptyRow(table, 5, 'No sponsorship commitments recorded.');
  sponsorships.forEach((sponsorship) => {
    const row = document.createElement('tr');
    appendAdminCell(row, sponsorship.companyName);
    appendAdminCell(row, sponsorship.projectTitle);
    appendAdminCell(row, sponsorship.amount);
    const statusCell = document.createElement('td');
    const status = makeAdminSelect(['Pending', 'Approved', 'Rejected'], sponsorship.status);
    statusCell.appendChild(status);
    row.appendChild(statusCell);
    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-small';
    button.textContent = 'Save';
    button.addEventListener('click', async () => {
      const token = sessionStorage.getItem('greenfutureToken');
      try {
        await adminRequest(`/sponsorships/${sponsorship.id}/status`, token, {
          method: 'PATCH',
          body: JSON.stringify({ status: status.value })
        });
        await loadAdminDashboard(token);
      } catch (error) {
        showAdminMessage(error.message);
      }
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

function renderAdminSupport(tickets) {
  const table = document.querySelector('[data-admin-support]');
  table.replaceChildren();
  if (!tickets.length) return appendAdminEmptyRow(table, 5, 'No support tickets found.');
  tickets.forEach((ticket) => {
    const row = document.createElement('tr');
    const issueCell = document.createElement('td');
    const subject = document.createElement('strong');
    subject.textContent = ticket.subject;
    const details = document.createElement('p');
    details.className = 'admin-table-detail';
    details.textContent = ticket.message;
    issueCell.append(subject, details);
    row.appendChild(issueCell);
    appendAdminCell(row, `${ticket.submitterName} (${ticket.submitterRole})\n${ticket.submitterEmail}`);
    const statusCell = document.createElement('td');
    const status = makeAdminSelect(['Open', 'In Progress', 'Resolved'], ticket.status);
    statusCell.appendChild(status);
    row.appendChild(statusCell);
    const noteCell = document.createElement('td');
    const note = document.createElement('textarea');
    note.rows = 2;
    note.maxLength = 5000;
    note.value = ticket.resolutionNote || '';
    note.setAttribute('aria-label', `Resolution note for ${ticket.subject}`);
    noteCell.appendChild(note);
    row.appendChild(noteCell);
    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-small';
    button.textContent = 'Update';
    button.addEventListener('click', async () => {
      const token = sessionStorage.getItem('greenfutureToken');
      try {
        await adminRequest(`/support/${ticket.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ status: status.value, resolutionNote: note.value })
        });
        await loadAdminDashboard(token);
      } catch (error) {
        showAdminMessage(error.message);
      }
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

function showAdminMessage(message) {
  const element = document.querySelector('[data-admin-message]');
  if (element) element.textContent = message;
}

async function loadAdminDashboard(token) {
  const message = document.querySelector('[data-admin-message]');
  message.textContent = '';

  try {
    const [overview, usersResult, projectsResult, sponsorshipsResult, supportResult] = await Promise.all([
      adminRequest('/overview', token),
      adminRequest('/users', token),
      adminRequest('/projects', token),
      adminRequest('/sponsorships', token),
      adminRequest('/support', token)
    ]);

    Object.entries(overview).forEach(([key, value]) => {
      const element = document.querySelector('[data-admin-overview="' + key + '"]');
      if (element) element.textContent = String(value);
    });
    const users = usersResult.users;
    renderAdminUsers(users);
    renderAdminVerificationUsers(usersResult.users.filter((user) => user.role === 'company'), 'company', '[data-admin-companies]');
    renderAdminVerificationUsers(usersResult.users.filter((user) => user.role === 'organization'), 'organization', '[data-admin-organizations]');
    renderAdminProjects(projectsResult.projects);
    renderAdminSponsorships(sponsorshipsResult.sponsorships);
    renderAdminSupport(supportResult.tickets);

    const companySelect = document.querySelector('[data-sponsorship-company]');
    const projectSelect = document.querySelector('[data-sponsorship-project]');
    companySelect.replaceChildren(new Option('Select a company', ''));
    users.filter((user) => user.role === 'company').forEach((user) => {
      companySelect.add(new Option(user.name, user.id));
    });
    projectSelect.replaceChildren(new Option('Select a project', ''));
    projectsResult.projects.forEach((project) => {
      projectSelect.add(new Option(project.title, project.id));
    });
  } catch (error) {
    console.error('Admin dashboard load failed:', error);
    message.textContent = error.message || 'Admin data could not be loaded. Refresh the page to try again.';
  }
}

function initializeAdminDashboard(token) {
  const userFilter = document.querySelector('[data-admin-user-filter]');
  userFilter.addEventListener('change', () => loadAdminDashboard(token));

  document.querySelector('[data-admin-sponsorship-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await adminRequest('/sponsorships', token, {
        method: 'POST',
        body: JSON.stringify({ ...data, companyId: Number(data.companyId), projectId: Number(data.projectId), amount: Number(data.amount) })
      });
      form.reset();
      await loadAdminDashboard(token);
    } catch (error) {
      showAdminMessage(error.message);
    }
  });

  document.querySelector('[data-admin-support-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await adminRequest('/support', token, { method: 'POST', body: JSON.stringify(data) });
      form.reset();
      await loadAdminDashboard(token);
    } catch (error) {
      showAdminMessage(error.message);
    }
  });
}

async function loadDashboard() {
  const dashboard = document.querySelector('[data-dashboard-role]');
  if (!dashboard) return;

  const token = sessionStorage.getItem('greenfutureToken');
  if (!token) {
    window.location.replace('/login.html');
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error('Session expired');
    if (result.user.role !== dashboard.dataset.dashboardRole) {
      window.location.replace(dashboardUrl(result.user.role));
      return;
    }

    document.querySelectorAll('[data-user-name]').forEach((element) => {
      element.textContent = result.user.name;
    });
    document.querySelectorAll('[data-user-email]').forEach((element) => {
      element.textContent = result.user.email;
    });
    document.querySelectorAll('[data-user-initial]').forEach((element) => {
      element.textContent = result.user.name.trim().charAt(0).toUpperCase();
    });

    if (dashboard.dataset.dashboardRole === 'company') {
      const initials = result.user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
      const logo = document.querySelector('[data-company-logo]');
      logo.textContent = initials || 'C';
      logo.setAttribute('aria-label', `${result.user.name} logo`);
      await loadCompanySummary(token);
    }

    if (dashboard.dataset.dashboardRole === 'volunteer') {
      const profileFields = [result.user.name, result.user.email, result.user.role];
      const completion = Math.round(
        profileFields.filter((field) => typeof field === 'string' && field.trim()).length /
        profileFields.length * 100
      );
      document.querySelector('[data-profile-progress-label]').textContent = `${completion}%`;
      document.querySelector('[data-profile-progress-bar]').value = completion;
      document.querySelector('[data-profile-progress-note]').textContent =
        completion === 100 ? 'Your basic account details are complete.' : 'Complete your account details to finish your profile.';
      await loadVolunteerSummary(token);
    }

    if (dashboard.dataset.dashboardRole === 'organization') {
      await loadOrganizationSummary(token);
    }

    if (dashboard.dataset.dashboardRole === 'admin') {
      initializeAdminDashboard(token);
      await loadAdminDashboard(token);
    }
  } catch {
    sessionStorage.removeItem('greenfutureToken');
    window.location.replace('/login.html');
  }
}

document.querySelectorAll('[data-auth-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitAuthForm(form);
  });
});

document.querySelectorAll('[data-logout]').forEach((button) => {
  button.addEventListener('click', () => {
    sessionStorage.removeItem('greenfutureToken');
    window.location.assign('/');
  });
});

const siteHeader = document.querySelector('[data-site-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const siteNav = document.querySelector('[data-site-nav]');

if (siteHeader && menuToggle && siteNav) {
  function closeMenu() {
    siteHeader.classList.remove('is-menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    siteHeader.classList.toggle('is-menu-open', !isOpen);
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  });

  siteNav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!siteHeader.contains(event.target)) closeMenu();
  });
}

const scrollLinks = [...document.querySelectorAll('[data-scroll-link]')];
const pageSections = scrollLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && scrollLinks.length && pageSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const activeEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

    if (!activeEntry) return;

    scrollLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${activeEntry.target.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-82px 0px -68% 0px', threshold: [0, 0.1, 0.25, 0.5] });

  pageSections.forEach((section) => sectionObserver.observe(section));
}

const revealElements = document.querySelectorAll(
  '.mission-content, .role-list > div, .section-heading, .featured-card, .step-card, ' +
  '.impact-metric, .project-card, .about-story > *, .value-card, .news-feature, .news-card, ' +
  '.contact-intro, .contact-form, .auth-aside, .auth-panel, .dashboard-main > *'
);

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let revealedCount = 0;
  const revealFallback = window.setTimeout(() => {
    revealObserver.disconnect();
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }, 1200);
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealedCount += 1;
      observer.unobserve(entry.target);
    });
    if (revealedCount === revealElements.length) window.clearTimeout(revealFallback);
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach((element, index) => {
    element.classList.add('will-reveal');
    element.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`);
    revealObserver.observe(element);
  });
}

const projectSearch = document.querySelector('[data-project-search]');
const projectCategory = document.querySelector('[data-project-category]');
const projectLocation = document.querySelector('[data-project-location]');
const projectCards = [...document.querySelectorAll('[data-project-card]')];

if (projectCards.length) {
  const projectCount = document.querySelector('[data-project-count]');
  const emptyState = document.querySelector('[data-project-empty]');

  function filterProjects() {
    const query = projectSearch.value.trim().toLowerCase();
    const category = projectCategory.value;
    const location = projectLocation.value;
    let visibleCount = 0;

    projectCards.forEach((card) => {
      const matchesQuery = card.dataset.search.includes(query);
      const matchesCategory = !category || card.dataset.category === category;
      const matchesLocation = !location || card.dataset.location === location;
      const isVisible = matchesQuery && matchesCategory && matchesLocation;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    projectCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'sample project' : 'sample projects'} shown`;
    emptyState.hidden = visibleCount > 0;
  }

  [projectSearch, projectCategory, projectLocation].forEach((control) => {
    control.addEventListener('input', filterProjects);
    control.addEventListener('change', filterProjects);
  });
  filterProjects();
}

document.querySelectorAll('[data-contact-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-contact-message]');
    message.textContent = 'This preview form does not send or store messages. Connect it to an organization inbox or form service to receive enquiries.';
  });
});

loadDashboard();