import { initDashboard } from '../dashboard.js';
import { icon } from '../icons.js';
import { panel } from '../dashboard-ui.js';
import { escapeHtml } from '../format.js';

const PLANS = [
  {
    name: 'Starter',
    audience: 'For new shops building their first catalogue.',
    description: 'Set up an individual storefront and start selling on the marketplace.'
  },
  {
    name: 'Growth',
    audience: 'For shops growing their product range and order volume.',
    description: 'Review sales trends and keep products and inventory up to date.'
  },
  {
    name: 'Established',
    audience: 'For experienced sellers managing a busy shop.',
    description: 'Use marketplace reporting to monitor sales, reviews and seller earnings.'
  }
];

async function init() {
  const dash = await initDashboard({
    role: 'seller',
    active: '/seller/plans',
    title: 'Seller plans',
    subtitle: 'Compare the seller plan options for your shop.'
  });
  if (!dash) return;

  const planCards = PLANS.map((plan) => `
    <section class="content-card" style="padding:22px">
      <span class="eyebrow">${escapeHtml(plan.audience)}</span>
      <h3 style="margin:10px 0 6px">${escapeHtml(plan.name)}</h3>
      <p class="muted">${escapeHtml(plan.description)}</p>
      <div class="divider" style="margin:16px 0"></div>
      <span class="badge warning">Pricing not configured</span>
    </section>
  `).join('');

  dash.content.innerHTML = `
    <div class="alert info" style="margin-bottom:16px">
      ${icon('info', { size: 18 })}
      <div><strong>Plan catalogue only.</strong> Pricing, subscriptions, and plan-based feature access are not configured. Viewing these options does not start a subscription or change your account.</div>
    </div>
    <div class="dash-grid-2 equal">
      ${planCards}
    </div>
    ${panel({
      title: 'Seller tools currently available',
      subtitle: 'The current marketplace tools are available to approved sellers regardless of the catalogue options above.',
      body: `<div class="card-body">
        <div class="status-list">
          ${[
            ['Storefront', 'Manage your public shop profile and products.'],
            ['Sales insights', 'Review monthly sales, earnings and commissions.'],
            ['Inventory', 'Update stock levels and monitor low-stock products.'],
            ['Reviews and payouts', 'See buyer reviews and recorded payout references.']
          ].map(([title, detail]) => `<div class="status-row">
            <div class="grow"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>
            ${icon('check-circle', { size: 17, className: 'muted' })}
          </div>`).join('')}
        </div>
      </div>`
    })}`;
}

init();
