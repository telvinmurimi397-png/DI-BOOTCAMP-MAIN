function renderProjectCard(project, user, escapeHtml, money) {
  const progress = Math.min(100, Math.round((project.amountRaised / project.fundingRequired) * 100));
  const sponsor = user.role === 'sponsor';
  const admin = user.role === 'admin';
  const activities = project.activities.map((activity) => `<span class="activity-tag">${escapeHtml(activity)}</span>`).join('');
  const impacts = [['CLEANUPS', project.impact.cleanups], ['VOLUNTEERS', project.impact.volunteers], ['WASTE KG', project.impact.wasteCollectedKg], ['DRAINS', project.impact.drainageSections]].map(([label, value]) => `<span><strong>${Number(value).toLocaleString('en-KE')}</strong><small>${label}</small></span>`).join('');
  return `<article class="project-card"><div class="project-topline"><span class="eyebrow">GITHOGORO / ${escapeHtml(project.location).toUpperCase()}</span><span class="project-status ${project.status === 'complete' ? 'project-complete' : ''}"><i></i>${escapeHtml(project.status.replace('-', ' ')).toUpperCase()}</span></div><h2>${escapeHtml(project.name)}</h2><p class="project-description">${escapeHtml(project.description)}</p><div class="project-activities">${activities}</div><div class="funding-row"><div><span>RAISED</span><strong>${money(project.amountRaised)}</strong></div><div class="funding-goal"><span>GOAL</span><strong>${money(project.fundingRequired)}</strong></div></div><div class="funding-track"><span style="width:${progress}%"></span></div><div class="funding-caption"><span>${progress}% funded</span><span>${money(Math.max(0, project.fundingRequired - project.amountRaised))} to go</span></div><div class="project-impact">${impacts}</div>
    ${sponsor && project.status !== 'complete' ? `<form class="sponsor-form" data-project-id="${escapeHtml(project.id)}"><label>COMPANY<input name="companyName" value="${escapeHtml(user.name)}" required minlength="2"></label><label>CONTRIBUTION (KSH)<input name="amount" type="number" min="1" max="10000000" placeholder="5000" required></label><button class="button button-primary" type="submit">Sponsor this project <span>↗</span></button></form>` : ''}
    ${admin ? `<form class="project-impact-form" data-impact-project="${escapeHtml(project.id)}"><span class="eyebrow">UPDATE VERIFIED IMPACT</span><label>Cleanups<input name="cleanups" type="number" min="0" value="${project.impact.cleanups}" required></label><label>Volunteers<input name="volunteers" type="number" min="0" value="${project.impact.volunteers}" required></label><label>Waste kg<input name="wasteCollectedKg" type="number" min="0" value="${project.impact.wasteCollectedKg}" required></label><label>Drain sections<input name="drainageSections" type="number" min="0" value="${project.impact.drainageSections}" required></label><label>Bins<input name="wasteBinsProvided" type="number" min="0" value="${project.impact.wasteBinsProvided}" required></label><label class="complete-check"><input type="checkbox" name="complete" ${project.status === 'complete' ? 'checked' : ''}> Mark complete</label><button class="button button-outline" type="submit">Save impact</button></form>` : ''}</article>`;
}

async function loadProjects() {
  const response = await window.MtaaClean.api('/csr/projects');
  window.MtaaClean.state.projects = response.projects;
  return response.projects;
}

async function renderCsrProjects() {
  const { state, api, escapeHtml, money, toast } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="csr"]');
  try {
    const projects = await loadProjects();
    panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">CORPORATE SOCIAL RESPONSIBILITY / GITHOGORO</p><h1>Fund the work that matters.</h1><p class="heading-copy">Support practical waste and drainage action. Follow funding through to verified community impact.</p></div>${state.user.role === 'admin' ? '<button class="button button-primary" id="open-project-create" type="button"><span>＋</span> New project</button>' : ''}</div>
      ${state.user.role === 'admin' ? '<div id="project-create-slot"></div>' : ''}
      ${state.user.role === 'sponsor' ? `<div class="partner-note"><span>◇</span><p><strong>Make your contribution count.</strong> Every sponsorship is linked to a community project and reported impact.</p></div>` : ''}
      <div class="project-list">${projects.map((project) => renderProjectCard(project, state.user, escapeHtml, money)).join('') || '<div class="empty-state"><span class="empty-icon">◇</span><h3>No projects published.</h3><p>New community funding needs will appear here.</p></div>'}</div>`;

    const createButton = panel.querySelector('#open-project-create');
    if (createButton) createButton.addEventListener('click', () => {
      document.querySelector('#project-create-slot').innerHTML = `<form id="project-create-form" class="inline-create-form"><div class="form-section-title"><span>＋</span><div><strong>Publish a CSR project</strong><small>Make the work, location and funding target clear.</small></div></div><label>Project name<input name="name" minlength="4" placeholder="Githogoro Drainage Cleanup" required></label><label>Location<input name="location" minlength="3" placeholder="Githogoro, Zone A" required></label><label>Description<textarea name="description" minlength="15" rows="3" placeholder="What will this project accomplish?" required></textarea></label><label>Funding target (KSh)<input name="fundingRequired" type="number" min="1" required></label><label>Activities <span class="optional-label">COMMA SEPARATED</span><input name="activities" placeholder="Waste collection, Drainage cleaning"></label><button class="button button-primary" type="submit">Publish project <span>↗</span></button></form>`;
      document.querySelector('#project-create-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget).entries());
        values.fundingRequired = Number(values.fundingRequired);
        values.activities = values.activities.split(',').map((activity) => activity.trim()).filter(Boolean);
        try {
          await api('/csr/projects', { method: 'POST', body: JSON.stringify(values) });
          toast('CSR project published.');
          await renderCsrProjects();
        } catch (error) { toast(error.message, true); }
      });
    });

    panel.querySelectorAll('.sponsor-form').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const contribution = Object.fromEntries(new FormData(form).entries());
      contribution.amount = Number(contribution.amount);
      try {
        await api(`/csr/projects/${form.dataset.projectId}/sponsor`, { method: 'POST', body: JSON.stringify(contribution) });
        toast('Sponsorship recorded. Thank you for backing this work.');
        await renderCsrProjects();
      } catch (error) { toast(error.message, true); }
    }));

    panel.querySelectorAll('.project-impact-form').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      ['cleanups', 'volunteers', 'wasteCollectedKg', 'drainageSections', 'wasteBinsProvided'].forEach((key) => { values[key] = Number(values[key]); });
      if (values.complete) values.status = 'complete';
      delete values.complete;
      try {
        await api(`/csr/projects/${form.dataset.impactProject}/impact`, { method: 'PATCH', body: JSON.stringify(values) });
        toast('Verified project impact saved.');
        await renderCsrProjects();
      } catch (error) { toast(error.message, true); }
    }));
  } catch (error) { toast(error.message, true); }
}

async function renderSponsorImpact() {
  const { api, money, toast } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="impact"]');
  try {
    const impact = await api('/dashboard');
    const metrics = [
      ['Projects sponsored', impact.projectsSponsored, 'ACTIVE PARTNERSHIPS'],
      ['Total contributed', money(impact.totalSponsored), 'KSH DIRECTED TO WORK'],
      ['Volunteers mobilized', impact.volunteers, 'COMMUNITY MEMBERS'],
      ['Waste collected', `${Number(impact.wasteCollectedKg).toLocaleString('en-KE')} kg`, 'FROM LANES & CHANNELS'],
      ['Drain sections', impact.drainageSections, 'CLEARED & RESTORED'],
      ['Waste bins provided', impact.wasteBinsProvided, 'COMMUNITY COLLECTION']
    ];
    panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">PARTNER REPORT / ${new Date().getFullYear()}</p><h1>Contribution, accounted for.</h1><p class="heading-copy">A clear record of the community work your support has helped make possible.</p></div><button class="button button-outline" onclick="window.print()" type="button">Export report <span>↗</span></button></div><div class="impact-grid">${metrics.map(([label, value, detail], index) => `<article class="impact-card ${index === 0 ? 'impact-featured' : ''}"><span class="impact-number">${value}</span><strong>${label}</strong><small>${detail}</small></article>`).join('')}</div><section class="impact-project-section"><div class="section-heading"><div><p class="eyebrow">YOUR PORTFOLIO</p><h2>Projects you support.</h2></div><a href="#csr" class="text-link">View all projects ↗</a></div><div id="impact-project-list" class="project-list"></div></section>`;
    const projects = await loadProjects();
    const sponsored = projects.filter((project) => project.sponsorIds.includes(window.MtaaClean.state.user.id));
    document.querySelector('#impact-project-list').innerHTML = sponsored.map((project) => `<article class="impact-project-row"><div><strong>${window.MtaaClean.escapeHtml(project.name)}</strong><small>${window.MtaaClean.escapeHtml(project.location)}</small></div><span>${money(project.amountRaised)} raised</span><span class="status-pill status-resolved">${project.status}</span></article>`).join('') || '<p class="muted-copy">Your sponsored projects will appear here.</p>';
  } catch (error) { toast(error.message, true); }
}

window.loadProjects = loadProjects;
window.addEventListener('mtaaclean:view', (event) => {
  if (event.detail === 'csr') renderCsrProjects();
  if (event.detail === 'impact') renderSponsorImpact();
});