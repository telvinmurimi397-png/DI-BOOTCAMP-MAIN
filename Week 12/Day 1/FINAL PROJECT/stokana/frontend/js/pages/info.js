import { mountSite } from '../layout.js';
import { icon } from '../icons.js';

const SUPPORT_EMAIL = 'hello@stokana.co.ke';
const SUPPORT_PHONE = '+254 700 000 000';

const PAGES = {
  help: {
    eyebrow: 'Support',
    title: 'How can we help?',
    intro:
      'Answers to common questions about buying, selling, payments and delivery. If you still need a hand, our team is one message away.',
    updated: '26 October 2026',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting started',
        body: `
          <p>STOKANA connects Kenyan buyers with independent, vetted shops. Create a free account to place orders, chat with sellers and track deliveries from one dashboard.</p>
          <ul>
            <li><strong>Buyers:</strong> browse or search, add items to your cart, checkout with your delivery details and follow every order in <a href="/account/orders">My orders</a>.</li>
            <li><strong>Sellers:</strong> register a shop, add products and wait for approval. After approval your listings go live and you can fulfil orders and message buyers.</li>
          </ul>
          <div class="info-note">Every new shop is reviewed before it can publish products. This keeps the marketplace trustworthy for everyone.</div>`
      },
      {
        id: 'buying',
        title: 'Buying and orders',
        body: `
          <p>Your cart can hold items from several shops. At checkout the order is split by seller, while you pay one total and follow one order number.</p>
          <ol>
            <li>Open a product and choose your quantity.</li>
            <li>Review your cart and continue to checkout.</li>
            <li>Enter your name, phone, county, town and delivery address.</li>
            <li>Confirm the order and complete payment.</li>
          </ol>
          <p>An order remains <strong>awaiting payment</strong> until a payment succeeds. Unpaid orders can be paid later from the order page or cancelled, which releases the reserved stock.</p>`
      },
      {
        id: 'delivery',
        title: 'Delivery',
        body: `
          <p>Delivery is arranged by each seller. Typical timelines are 1–2 working days for Nairobi and 2–5 working days elsewhere in Kenya. Remote areas may take longer.</p>
          <ul>
            <li>Your delivery fee is shown before payment. Orders above the free-delivery threshold ship free.</li>
            <li>Tracking details appear on the order page once the seller creates a shipment.</li>
            <li>Check your phone number carefully — couriers call before delivery.</li>
          </ul>`
      },
      {
        id: 'payments',
        title: 'Payments',
        body: `
          <p>This build runs payments through a secure simulated sandbox so you can test the full experience without moving real money. Server-side verification, retry handling and duplicate protection are built in.</p>
          <p>A production launch will connect the M-Pesa Daraja API. Payment secrets and database credentials live only on the server and are never included in frontend code.</p>
          <div class="info-note">No real payment is taken in the sandbox. Do not enter real M-Pesa credentials anywhere on this demo.</div>`
      },
      {
        id: 'returns',
        title: 'Returns and refunds',
        body: `
          <p>Most unused items can be returned within 7 days of delivery. See the full <a href="/refunds">returns and refunds policy</a> for eligibility, exclusions and timelines.</p>`
      },
      {
        id: 'selling',
        title: 'Selling on STOKANA',
        body: `
          <p>To open a shop, <a href="/register?role=seller">register as a seller</a> with your shop name, county and a short description. Our team reviews new applications, then your shop dashboard unlocks product publishing.</p>
          <ul>
            <li>Add clear photos, accurate prices and real stock levels.</li>
            <li>Keep stock updated — sold-out products are hidden from checkout automatically.</li>
            <li>Reply to buyer messages promptly and fulfil orders from the seller hub.</li>
            <li>Sales, commission and payout records are available under Sales &amp; payouts.</li>
          </ul>`
      },
      {
        id: 'contact',
        title: 'Contact support',
        body: `
          <div class="info-contact-grid">
            <div class="info-contact-card">
              <span class="stat-icon">${icon('mail', { size: 17 })}</span>
              <strong>Email us</strong>
              <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
            </div>
            <div class="info-contact-card">
              <span class="stat-icon green">${icon('phone', { size: 17 })}</span>
              <strong>Call or WhatsApp</strong>
              <a href="tel:+254700000000">${SUPPORT_PHONE}</a>
            </div>
            <div class="info-contact-card">
              <span class="stat-icon amber">${icon('clock', { size: 17 })}</span>
              <strong>Support hours</strong>
              <span>Mon–Sat, 8:00–18:00 EAT</span>
            </div>
          </div>
          <p>Include your order number (for example STK-2026-0001) so we can help faster. Order-related disputes can also be raised directly with the seller from the order page.</p>`
      }
    ]
  },
  refunds: {
    eyebrow: 'Policies',
    title: 'Returns and refunds',
    intro:
      'We want every order to arrive as described. If something is wrong, here is how returns, refunds and disputes work on STOKANA.',
    updated: '26 October 2026',
    sections: [
      {
        id: 'window',
        title: 'Return window',
        body: `
          <p>You may request a return within <strong>7 days</strong> of delivery for most items. The item must be unused, in its original packaging and in the same condition you received it.</p>
          <p>Report damaged, missing or incorrect items within <strong>48 hours</strong> of delivery and include photos where possible.</p>`
      },
      {
        id: 'eligible',
        title: 'Eligible returns',
        body: `
          <ul>
            <li>The item does not match its description or photos.</li>
            <li>The item arrived damaged, defective or incomplete.</li>
            <li>You received the wrong item, size or colour.</li>
            <li>The seller did not deliver within the agreed timeframe.</li>
          </ul>`
      },
      {
        id: 'excluded',
        title: 'Items that cannot be returned',
        body: `
          <ul>
            <li>Perishable goods such as food and fresh produce.</li>
            <li>Opened personal care, beauty or hygiene products.</li>
            <li>Custom-made or personalised items.</li>
            <li>Underwear, swimwear and pierced jewellery for hygiene reasons.</li>
            <li>Digital goods and gift cards once delivered.</li>
          </ul>`
      },
      {
        id: 'request',
        title: 'How to request a return',
        body: `
          <ol>
            <li>Open <a href="/account/orders">My orders</a> and select the order.</li>
            <li>Message the seller with the item, reason and photos.</li>
            <li>Agree the return method and pickup or drop-off point with the seller.</li>
            <li>Keep proof of return until your refund is confirmed.</li>
          </ol>
          <p>Sellers have 2 working days to respond to a return request. If you cannot agree, contact STOKANA support and we will review the case.</p>`
      },
      {
        id: 'refunds',
        title: 'Refund timelines',
        body: `
          <p>Once a return is approved and received, refunds are issued to the original payment method.</p>
          <ul>
            <li>M-Pesa or mobile money: 1–5 working days.</li>
            <li>Card payments: 5–10 working days depending on your bank.</li>
            <li>Order cancelled before payment success: no charge is taken.</li>
            <li>Failed payment attempts: any reserved amount is released by your provider.</li>
          </ul>
          <p>Delivery fees are refunded only when the return is due to a seller error or a damaged or incorrect item.</p>`
      },
      {
        id: 'disputes',
        title: 'Disputes',
        body: `
          <p>If a seller does not respond or you cannot resolve a return, email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> with your order number, photos and a summary. We aim to resolve disputes within 14 days of receiving all evidence.</p>
          <p>STOKANA may withhold seller payouts while a dispute is under review.</p>`
      }
    ]
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of service',
    intro:
      'These terms govern your use of the STOKANA marketplace. By creating an account or placing an order you agree to them.',
    updated: '26 October 2026',
    sections: [
      {
        id: 'marketplace',
        title: 'The marketplace',
        body: `
          <p>STOKANA is a marketplace that connects buyers with independent Kenyan sellers. The sale contract for a product is between you and the seller. STOKANA provides the platform, payment flow, messaging and dispute support.</p>
          <p>We may review, approve, suspend or remove shops and listings to protect the marketplace.</p>`
      },
      {
        id: 'accounts',
        title: 'Accounts',
        body: `
          <ul>
            <li>Provide accurate registration details and keep them up to date.</li>
            <li>You are responsible for activity under your account and for keeping your password private.</li>
            <li>You must be at least 18 years old to buy or sell.</li>
            <li>Do not create duplicate accounts to avoid restriction or review.</li>
          </ul>`
      },
      {
        id: 'buying',
        title: 'Buying',
        body: `
          <p>Prices, stock and delivery fees are shown before payment. Placing an order reserves stock while payment is pending. Orders that remain unpaid may be cancelled and stock released.</p>
          <p>Product photos and descriptions are supplied by sellers. Buyers should read descriptions and ask questions through messages before buying.</p>`
      },
      {
        id: 'selling',
        title: 'Selling',
        body: `
          <ul>
            <li>Sellers must hold the right to sell every product they list.</li>
            <li>Listings must be accurate, including condition, price, stock and location.</li>
            <li>New shops require approval before products can be published.</li>
            <li>Sellers must fulfil accepted orders promptly and honour the published return policy.</li>
            <li>Commission is calculated on the product value of each order item and recorded per sale.</li>
          </ul>`
      },
      {
        id: 'payments',
        title: 'Payments and payouts',
        body: `
          <p>Payments are processed by our payment partners. STOKANA never stores your full payment credentials. In this build payments use a simulated sandbox for testing.</p>
          <p>Seller earnings become payable after delivery, less the applicable commission and any adjustments for refunds or disputes. Payout records are shown in the seller dashboard.</p>`
      },
      {
        id: 'prohibited',
        title: 'Prohibited items',
        body: `
          <p>You may not list or buy illegal goods, weapons, drugs, stolen property, counterfeit goods, wildlife products, adult content or anything that infringes intellectual property. We remove prohibited listings and may suspend accounts.</p>`
      },
      {
        id: 'content',
        title: 'Content and intellectual property',
        body: `
          <p>You retain ownership of the content you upload and grant STOKANA a licence to host, display and resize it for running the marketplace. Do not upload content you do not have rights to use.</p>
          <p>The STOKANA name, logo and platform design may not be reused without permission.</p>`
      },
      {
        id: 'liability',
        title: 'Limitation of liability',
        body: `
          <p>STOKANA works to keep the marketplace safe and available but does not guarantee uninterrupted service. To the extent permitted by Kenyan law, STOKANA is not liable for indirect loss arising from seller conduct, product defects or delivery delays. Our dispute process is available to help resolve problems.</p>`
      },
      {
        id: 'general',
        title: 'Changes and governing law',
        body: `
          <p>We may update these terms as the marketplace evolves. Material changes will be announced on this page. Continued use after a change means you accept the updated terms.</p>
          <p>These terms are governed by the laws of Kenya. Questions can be sent to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
          <div class="info-note">This document is a working template for the STOKANA build and should be reviewed by qualified legal counsel before commercial launch.</div>`
      }
    ]
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy policy',
    intro:
      'This policy explains what personal data STOKANA collects, why we need it and the choices you have. We follow the Kenya Data Protection Act, 2019.',
    updated: '26 October 2026',
    sections: [
      {
        id: 'collect',
        title: 'Data we collect',
        body: `
          <ul>
            <li><strong>Account data:</strong> name, email address, phone number, password hash and role.</li>
            <li><strong>Seller data:</strong> shop name, county, town, description, logo and payout details.</li>
            <li><strong>Order data:</strong> cart contents, delivery address, order history and payment status.</li>
            <li><strong>Communication:</strong> messages exchanged with sellers or buyers.</li>
            <li><strong>Technical data:</strong> session cookies, IP address and basic logs needed to secure the service.</li>
          </ul>`
      },
      {
        id: 'use',
        title: 'How we use your data',
        body: `
          <ul>
            <li>Create and secure your account and sign you in.</li>
            <li>Process orders, payments, deliveries and refunds.</li>
            <li>Enable messaging between buyers and sellers.</li>
            <li>Prevent fraud, abuse and duplicate payment processing.</li>
            <li>Provide support, resolve disputes and improve the marketplace.</li>
            <li>Send essential service messages such as password resets and order updates.</li>
          </ul>`
      },
      {
        id: 'legal-basis',
        title: 'Why we are allowed to process it',
        body: `
          <p>We process data to perform our contract with you (for example fulfilling an order), to comply with legal obligations, to protect legitimate business interests such as fraud prevention, and with your consent where required, for example optional marketing messages.</p>`
      },
      {
        id: 'sharing',
        title: 'Who we share data with',
        body: `
          <ul>
            <li><strong>Sellers</strong> receive the delivery details needed to fulfil your order.</li>
            <li><strong>Payment and delivery providers</strong> receive only what they need to process a transaction.</li>
            <li><strong>Service providers</strong> that host, store images or help us operate securely.</li>
            <li><strong>Authorities</strong> where required by law or to protect users.</li>
          </ul>
          <p>We do not sell your personal data.</p>`
      },
      {
        id: 'cookies',
        title: 'Cookies and sessions',
        body: `
          <p>STOKANA uses a server-side session cookie to keep you signed in. The cookie is HttpOnly, SameSite-protected and marked Secure in production. We do not use advertising trackers in this build.</p>`
      },
      {
        id: 'security',
        title: 'Security',
        body: `
          <p>Passwords are hashed with bcrypt, sessions are stored server-side, payment callbacks are verified server-side and database or payment secrets never reach the browser. We use HTTPS in production and limit access to personal data to authorised staff and systems.</p>`
      },
      {
        id: 'retention',
        title: 'Retention',
        body: `
          <p>We keep account and order records while your account is active and for as long as tax, accounting and dispute rules require. Messages are retained to support order disputes. You can ask us to delete data that we are not legally required to keep.</p>`
      },
      {
        id: 'rights',
        title: 'Your rights',
        body: `
          <p>Under the Kenya Data Protection Act you may request access to your data, correction, deletion, restriction of processing, portability, and object to certain processing. You may also withdraw consent for optional processing.</p>
          <p>To exercise a right, email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. We may verify your identity before acting. You can also complain to the Office of the Data Protection Commissioner in Kenya.</p>`
      },
      {
        id: 'contact',
        title: 'Contact',
        body: `
          <p>Questions about this policy can be sent to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or ${SUPPORT_PHONE}.</p>
          <div class="info-note">This policy is a working template for the STOKANA build and should be reviewed by qualified counsel for your final production deployment.</div>`
      }
    ]
  }
};

const ORDER = ['help', 'refunds', 'terms', 'privacy'];

function navHtml(active) {
  return ORDER.map(
    (key) =>
      `<a href="/${key}" class="${key === active ? 'active' : ''}">${key === 'help' ? 'Help centre' : key === 'refunds' ? 'Returns & refunds' : key === 'terms' ? 'Terms of service' : 'Privacy policy'}</a>`
  ).join('');
}

function render() {
  const key = PAGES[document.body.dataset.infoPage] ? document.body.dataset.infoPage : 'help';
  const page = PAGES[key];

  document.title = `${page.title} · STOKANA`;
  const eyebrow = document.getElementById('info-eyebrow');
  const title = document.getElementById('info-title');
  const intro = document.getElementById('info-intro');
  const nav = document.getElementById('info-nav');
  const content = document.getElementById('info-content');

  if (eyebrow) eyebrow.textContent = page.eyebrow;
  if (title) title.textContent = page.title;
  if (intro) intro.textContent = page.intro;
  if (nav) nav.innerHTML = `<h2>Policies &amp; support</h2>${navHtml(key)}`;

  if (content) {
    content.innerHTML = `
      <span class="info-updated">${icon('clock', { size: 13 })} Last updated ${page.updated}</span>
      ${page.sections
        .map((section) => `<h2 id="${section.id}">${section.title}</h2>${section.body}`)
        .join('')}`;
  }
}

mountSite();
render();
