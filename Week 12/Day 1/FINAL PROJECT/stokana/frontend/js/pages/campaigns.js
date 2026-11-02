import { api } from '../api.js';
import { initDashboard } from '../dashboard.js';
import { errorState, toast, errorMessage, setButtonLoading } from '../ui.js';
import { escapeHtml, formatDate } from '../format.js';

let dash = null;
let campaigns = [];

function render() {
  const rows = campaigns.length
    ? campaigns.map((campaign) => `<article class="content-card" style="padding:14px">
        <div class="row-between" style="gap:12px">
          <div>
            <strong>${escapeHtml(campaign.title)}</strong>
            <div class="tiny muted">${escapeHtml(campaign.subject)} · ${escapeHtml(campaign.status)}
              · ${campaign.sentCount}/${campaign.recipientCount} emails sent
              ${campaign.failedCount ? ` · ${campaign.failedCount} failed` : ''}
              · Created ${formatDate(campaign.createdAt)}
            </div>
          </div>
          ${campaign.status === 'draft' || campaign.status === 'failed'
            ? `<button class="btn btn-secondary btn-sm" type="button" data-send-campaign="${campaign.id}">${campaign.status === 'failed' ? 'Retry failed' : 'Send campaign'}</button>`
            : ''}
        </div>
      </article>`).join('')
    : '<p class="tiny muted">No campaigns created yet.</p>';

  dash.content.innerHTML = `
    <div class="content-card">
      <div class="section-head"><div><h2>Create a campaign</h2>
        <p>In-app notifications go to all active accounts. Email is sent only to verified users who opted in.</p></div></div>
      <form id="campaign-form" class="form-grid">
        <div class="form-group span-2">
          <label class="form-label" for="campaign-title">Campaign name</label>
          <input class="input" id="campaign-title" name="title" maxlength="120" required>
        </div>
        <div class="form-group span-2">
          <label class="form-label" for="campaign-subject">Email subject</label>
          <input class="input" id="campaign-subject" name="subject" maxlength="180" required>
        </div>
        <div class="form-group span-2">
          <label class="form-label" for="campaign-body">Message</label>
          <textarea class="input" id="campaign-body" name="body" rows="6" maxlength="10000" required></textarea>
          <span class="form-hint">Plain text only. Email recipients receive a one-click unsubscribe link.</span>
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Save draft</button></div>
      </form>
    </div>
    <div class="content-card" style="margin-top:16px">
      <div class="section-head"><div><h2>Campaign history</h2><p>Failed deliveries can be retried; unsubscribed recipients are skipped.</p></div></div>
      <div class="list-stack">${rows}</div>
    </div>`;

  dash.content.querySelector('#campaign-form').addEventListener('submit', createCampaign);
  dash.content.querySelectorAll('[data-send-campaign]').forEach((button) => {
    button.addEventListener('click', () => sendCampaign(button));
  });
}

async function createCampaign(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  setButtonLoading(button, true, 'Saving…');
  try {
    await api.post('/admin/campaigns', payload);
    toast('Campaign draft saved.');
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function sendCampaign(button) {
  if (!window.confirm('Send this campaign to all eligible recipients?')) return;
  setButtonLoading(button, true, 'Sending…');
  try {
    const result = await api.post(`/admin/campaigns/${button.dataset.sendCampaign}/send`);
    toast(result.campaign.status === 'sent' ? 'Campaign sent.' : 'Campaign sent with failed email deliveries.');
    await load();
  } catch (error) {
    toast(errorMessage(error), 'error');
    setButtonLoading(button, false);
  }
}

async function load() {
  try {
    const data = await api.get('/admin/campaigns');
    campaigns = data.campaigns;
    render();
  } catch (error) {
    dash.content.innerHTML = errorState(errorMessage(error));
    dash.content.querySelector('[data-retry]')?.addEventListener('click', load);
  }
}

async function init() {
  dash = await initDashboard({
    role: 'admin',
    active: '/admin/campaigns',
    title: 'Campaigns',
    subtitle: 'Send consent-based email and in-app announcements.'
  });
  if (dash) await load();
}

init();
