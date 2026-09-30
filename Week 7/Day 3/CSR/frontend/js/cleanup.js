function cleanupCard(cleanup, user, escapeHtml, shortDate) {
  const joined = cleanup.volunteers.includes(user.id);
  const staff = ['admin', 'collector'].includes(user.role);
  const impact = cleanup.impact;
  return `<article class="cleanup-card"><div class="cleanup-date"><strong>${shortDate(cleanup.date, { day: '2-digit' })}</strong><span>${shortDate(cleanup.date, { month: 'short' }).toUpperCase()}</span></div><div class="cleanup-info"><div class="cleanup-card-top"><span class="eyebrow">COMMUNITY CLEAN-UP</span><span class="event-tag">${new Date(`${cleanup.date}T12:00:00`) < new Date() ? 'COMPLETED' : 'UPCOMING'}</span></div><h3>${escapeHtml(cleanup.title)}</h3><p>${escapeHtml(cleanup.location)} <span>·</span> ${escapeHtml(cleanup.time)}</p><div class="cleanup-metrics"><span><strong>${cleanup.volunteers.length}</strong> signed up</span><span><strong>${cleanup.wasteTargetKg}</strong> kg target</span>${impact ? `<span><strong>${impact.drainageSections}</strong> drains cleared</span>` : ''}</div></div>${user.role === 'resident' || user.role === 'collector' ? `<button class="button ${joined ? 'button-outline' : 'button-primary'} join-cleanup-button" data-cleanup-id="${escapeHtml(cleanup.id)}" type="button">${joined ? 'Joined ✓' : 'Join cleanup'}</button>` : ''}</article>${staff ? `<form class="impact-entry" data-impact-id="${escapeHtml(cleanup.id)}"><label>VOLUNTEERS<input name="volunteers" type="number" min="0" value="${impact?.volunteers ?? cleanup.volunteers.length}" required></label><label>WASTE KG<input name="wasteCollectedKg" type="number" min="0" value="${impact?.wasteCollectedKg ?? ''}" required></label><label>DRAIN SECTIONS<input name="drainageSections" type="number" min="0" value="${impact?.drainageSections ?? ''}" required></label><label>BINS PROVIDED<input name="wasteBinsProvided" type="number" min="0" value="${impact?.wasteBinsProvided ?? ''}" required></label><button class="button button-outline" type="submit">Record impact</button></form>` : ''}`;
}

async function loadCleanups() {
  const response = await window.MtaaClean.api('/cleanups');
  window.MtaaClean.state.cleanups = response.cleanups;
  return response.cleanups;
}

async function renderCleanups() {
  const { state, api, escapeHtml, shortDate, toast } = window.MtaaClean;
  const panel = document.querySelector('[data-view-panel="cleanup"]');
  try {
    const cleanups = await loadCleanups();
    const staff = ['admin', 'collector'].includes(state.user.role);
    panel.innerHTML = `<div class="page-heading"><div><p class="eyebrow">GITHOGORO / COMMUNITY ACTION</p><h1>Clean up together.</h1><p class="heading-copy">Turn reports into a safer, cleaner neighbourhood.</p></div>${state.user.role === 'admin' ? '<button class="button button-primary" id="open-cleanup-create" type="button"><span>＋</span> Plan cleanup</button>' : ''}</div>
      ${state.user.role === 'admin' ? '<div id="cleanup-create-slot"></div>' : ''}<div class="cleanup-summary"><span class="summary-mark">✳</span><div><strong>One morning makes a difference.</strong><p>Bring neighbours together to clear drainage and collect waste before it reaches the waterways.</p></div></div>
      <div class="cleanup-list">${cleanups.map((item) => cleanupCard(item, state.user, escapeHtml, shortDate)).join('') || '<div class="empty-state"><span class="empty-icon">✳</span><h3>No cleanups scheduled.</h3><p>New community cleanup events will appear here.</p></div>'}</div>`;

    const createButton = panel.querySelector('#open-cleanup-create');
    if (createButton) createButton.addEventListener('click', () => {
      document.querySelector('#cleanup-create-slot').innerHTML = `<form id="cleanup-create-form" class="inline-create-form"><div class="form-section-title"><span>＋</span><div><strong>Plan a cleanup event</strong><small>Set a time, place, and waste target.</small></div></div><label>Event name<input name="title" placeholder="Githogoro channel cleanup" required minlength="4"></label><div class="form-grid"><label>Location<input name="location" placeholder="Zone A · Footbridge" required minlength="3"></label><label>Date<input name="date" type="date" min="${new Date().toISOString().slice(0, 10)}" required></label><label>Start time<input name="time" type="time" value="09:00" required></label><label>Waste target (kg)<input name="wasteTargetKg" type="number" min="0" value="500" required></label></div><button class="button button-primary" type="submit">Create event <span>↗</span></button></form>`;
      panel.querySelector('#cleanup-create-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const body = Object.fromEntries(new FormData(event.currentTarget).entries());
          body.wasteTargetKg = Number(body.wasteTargetKg);
          await api('/cleanups', { method: 'POST', body: JSON.stringify(body) });
          toast('Cleanup event created.');
          await renderCleanups();
        } catch (error) { toast(error.message, true); }
      });
    });

    panel.querySelectorAll('.join-cleanup-button').forEach((button) => button.addEventListener('click', async () => {
      try {
        const result = await api(`/cleanups/${button.dataset.cleanupId}/join`, { method: 'POST', body: '{}' });
        toast(result.joined ? 'You’re on the cleanup team.' : 'You left this cleanup event.');
        await renderCleanups();
      } catch (error) { toast(error.message, true); }
    }));

    if (staff) panel.querySelectorAll('.impact-entry').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(form).entries());
      Object.keys(body).forEach((key) => { body[key] = Number(body[key]); });
      try {
        await api(`/cleanups/${form.dataset.impactId}/impact`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('Cleanup impact saved.');
        await renderCleanups();
      } catch (error) { toast(error.message, true); }
    }));
  } catch (error) { toast(error.message, true); }
}

window.loadCleanups = loadCleanups;
window.addEventListener('mtaaclean:view', (event) => { if (event.detail === 'cleanup') renderCleanups(); });