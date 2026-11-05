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
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');

    sessionStorage.setItem('greenfutureToken', result.token);
    window.location.assign(dashboardUrl(result.user.role));
  } catch (error) {
    message.textContent = error.message || 'Could not reach the server. Check your connection and try again.';
    submitButton.disabled = false;
  }
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
      headers: { Authorization: `Bearer ${token}` }
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