const campaignService = require('../services/marketingCampaignService');
const unsubscribeService = require('../services/marketingUnsubscribeService');

async function unsubscribePage(req, res) {
  const token = String(req.query.token || '');
  if (!unsubscribeService.userIdFromToken(token)) {
    return res.status(400).type('text').send('This unsubscribe link is invalid.');
  }
  res.type('html').send(`<!doctype html>
    <html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
    <title>Email preferences · STOKANA</title>
    <body style="font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px">
      <h1>Unsubscribe from marketing emails</h1>
      <p>Confirm to stop receiving promotional emails and abandoned-cart reminders.</p>
      <form method="post" action="/api/marketing/unsubscribe">
        <input type="hidden" name="token" value="${token}">
        <button type="submit">Unsubscribe</button>
      </form>
    </body></html>`);
}

async function unsubscribe(req, res) {
  const token = String(req.body.token || req.query.token || '');
  const changed = await unsubscribeService.unsubscribe(token);
  if (!changed) return res.status(400).type('text').send('This unsubscribe link is invalid or expired.');
  res.type('text').send('You have been unsubscribed from STOKANA marketing emails.');
}

async function listCampaigns(req, res) {
  res.json({ campaigns: await campaignService.listCampaigns() });
}

async function createCampaign(req, res) {
  const campaign = await campaignService.createCampaign(req.user.id, req.body);
  res.status(201).json({ campaign });
}

async function sendCampaign(req, res) {
  const result = await campaignService.sendCampaign(Number(req.params.campaignId));
  res.json({ campaign: result });
}

module.exports = { unsubscribePage, unsubscribe, listCampaigns, createCampaign, sendCampaign };
