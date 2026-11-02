const db = require('../config/db');
const env = require('../config/env');
const { sendEmail } = require('./verificationDelivery');
const unsubscribeService = require('./marketingUnsubscribeService');
const { conflict, notFound } = require('../utils/errors');

async function listCampaigns() {
  const { rows } = await db.query(
    `SELECT c.id, c.title, c.subject, c.body, c.status,
            c.created_at AS "createdAt", c.sent_at AS "sentAt",
            COUNT(r.user_id)::int AS "recipientCount",
            COUNT(r.user_id) FILTER (WHERE r.status = 'sent')::int AS "sentCount",
            COUNT(r.user_id) FILTER (WHERE r.status = 'failed')::int AS "failedCount"
     FROM marketing_campaigns c
     LEFT JOIN marketing_campaign_recipients r ON r.campaign_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT 50`
  );
  return rows;
}

async function createCampaign(adminId, input) {
  const { rows } = await db.query(
    `INSERT INTO marketing_campaigns (created_by, title, subject, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, subject, body, status, created_at AS "createdAt"`,
    [adminId, input.title, input.subject, input.body]
  );
  return rows[0];
}

async function queueCampaign(campaignId) {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, title, subject, body, status,
              updated_at AS "updatedAt"
       FROM marketing_campaigns WHERE id = $1 FOR UPDATE`,
      [campaignId]
    );
    const campaign = result.rows[0];
    if (!campaign) throw notFound('Campaign not found.');
    if (campaign.status === 'sent') throw conflict('This campaign has already been sent.');
    if (campaign.status === 'sending' &&
        Date.now() - new Date(campaign.updatedAt).getTime() < 10 * 60 * 1000) {
      throw conflict('This campaign is already being sent.');
    }

    await client.query(
      `INSERT INTO marketing_campaign_recipients (campaign_id, user_id)
       SELECT $1, id FROM users
       WHERE marketing_email_consent = TRUE AND email_verified = TRUE AND is_active = TRUE
       ON CONFLICT (campaign_id, user_id) DO NOTHING`,
      [campaignId]
    );
    await client.query(
      `INSERT INTO user_notifications (user_id, campaign_id, title, message)
       SELECT id, $1, $2, $3 FROM users WHERE is_active = TRUE
       ON CONFLICT (campaign_id, user_id) WHERE campaign_id IS NOT NULL DO NOTHING`,
      [campaignId, campaign.title, campaign.body]
    );
    await client.query(
      `UPDATE marketing_campaign_recipients r
       SET status = 'queued', error_message = NULL
       FROM users u
       WHERE r.campaign_id = $1 AND r.user_id = u.id AND r.status = 'failed'
         AND u.marketing_email_consent = TRUE AND u.email_verified = TRUE AND u.is_active = TRUE`,
      [campaignId]
    );
    await client.query(
      `UPDATE marketing_campaign_recipients r
       SET status = 'skipped', error_message = 'Recipient is no longer eligible for marketing email'
       FROM users u
       WHERE r.campaign_id = $1 AND r.user_id = u.id AND r.status IN ('queued', 'failed')
         AND (u.marketing_email_consent = FALSE OR u.email_verified = FALSE OR u.is_active = FALSE)`,
      [campaignId]
    );
    await client.query(
      `UPDATE marketing_campaigns
       SET status = 'sending', updated_at = now()
       WHERE id = $1`,
      [campaignId]
    );
    const recipients = await client.query(
      `SELECT r.user_id AS "userId", u.email, u.full_name AS "fullName"
       FROM marketing_campaign_recipients r
       JOIN users u ON u.id = r.user_id
       WHERE r.campaign_id = $1 AND r.status = 'queued'
         AND u.marketing_email_consent = TRUE AND u.email_verified = TRUE AND u.is_active = TRUE
       ORDER BY r.user_id`,
      [campaignId]
    );
    return { campaign, recipients: recipients.rows };
  });
}

async function sendCampaign(campaignId) {
  const { campaign, recipients } = await queueCampaign(campaignId);
  for (const recipient of recipients) {
    const eligibility = await db.query(
      `SELECT email FROM users
       WHERE id = $1 AND is_active = TRUE AND email_verified = TRUE
         AND marketing_email_consent = TRUE`,
      [recipient.userId]
    );
    if (!eligibility.rowCount) {
      await db.query(
        `UPDATE marketing_campaign_recipients
         SET status = 'skipped', error_message = 'Recipient is no longer eligible for marketing email'
         WHERE campaign_id = $1 AND user_id = $2 AND status = 'queued'`,
        [campaignId, recipient.userId]
      );
      continue;
    }
    const unsubscribeUrl = `${env.appUrl}/api/marketing/unsubscribe?token=${encodeURIComponent(
      unsubscribeService.createToken(recipient.userId)
    )}`;
    const text = `${campaign.body}\n\nYou received this because you opted in to STOKANA marketing emails.\nUnsubscribe: ${unsubscribeUrl}`;
    try {
      await sendEmail(eligibility.rows[0].email, campaign.subject, text, {
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });
      await db.query(
        `UPDATE marketing_campaign_recipients
         SET status = 'sent', sent_at = now(), error_message = NULL
         WHERE campaign_id = $1 AND user_id = $2 AND status = 'queued'`,
        [campaignId, recipient.userId]
      );
    } catch (error) {
      await db.query(
        `UPDATE marketing_campaign_recipients
         SET status = 'failed', error_message = $3
         WHERE campaign_id = $1 AND user_id = $2 AND status = 'queued'`,
        [campaignId, recipient.userId, String(error.message || 'Email delivery failed.').slice(0, 500)]
      );
    }
  }

  const result = await db.query(
    `UPDATE marketing_campaigns c
     SET status = CASE WHEN EXISTS (
           SELECT 1 FROM marketing_campaign_recipients r
           WHERE r.campaign_id = c.id AND r.status IN ('queued', 'failed')
         ) THEN 'failed' ELSE 'sent' END,
         sent_at = CASE WHEN NOT EXISTS (
           SELECT 1 FROM marketing_campaign_recipients r
             WHERE r.campaign_id = c.id AND r.status IN ('queued', 'failed')
         ) THEN now() ELSE NULL END,
         updated_at = now()
     WHERE c.id = $1
     RETURNING id, status, sent_at AS "sentAt"`,
    [campaignId]
  );
  return result.rows[0];
}

module.exports = { listCampaigns, createCampaign, sendCampaign };
