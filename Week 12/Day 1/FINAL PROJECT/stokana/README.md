# STOKANA

A complete multi-vendor marketplace for Kenya. Buyers discover products from verified shops, chat with sellers, check out securely and track delivery. Sellers run their shop, catalogue, stock, orders and conversations. Admins approve shops and products and monitor orders, commissions and platform settings.

Built with HTML5, CSS3 and vanilla JavaScript on the front end, Node.js + Express and PostgreSQL on the back end, server-side sessions, Socket.IO chat and a simulated payment sandbox.

---

## Contents

- [What is included](#what-is-included)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Quick start with your own PostgreSQL](#quick-start-with-your-own-postgresql)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [How the marketplace works](#how-the-marketplace-works)
- [The ten business rules](#the-ten-business-rules)
- [Testing](#testing)
- [Postman collection](#postman-collection)
- [Security notes](#security-notes)
- [Deployment checklist](#deployment-checklist)
- [Known limitations and next steps](#known-limitations-and-next-steps)

---

## What is included

**Public storefront**
- Home page with live catalogue stats, featured products, categories and verified shops
- Explore/search with keyword search, category, shop, price, stock and sort filters
- Category directory, shop directory and individual shop pages
- Product pages with image gallery, stock state, seller card, related products and paginated reviews
- Help, refunds, terms and privacy pages, custom 404, responsive navigation
- Locally hosted product photography for the seeded catalogue

**Buyers**
- Register, sign in, sign out, edit profile and change password
- Persistent cart with availability warnings and stock-aware quantities
- Checkout with delivery details, shipping fee and free-shipping threshold
- Simulated payment success/failure, retry payment and cancel an unpaid order
- Order history, order detail, per-seller shipment tracking and buyer protection copy
- Start conversations with sellers, exchange messages and see unread counts
- Review delivered order items; reviews appear on product pages and seller dashboards

**Sellers**
- Create a shop at registration; it stays pending until an admin approves it
- Shop profile editor (description, logo, banner, county, town, phone)
- Product creation/editing with category, price, compare-at price, stock, condition, location and up to five images
- Image uploads through the server or direct image URLs
- Stock editor, product archiving and review statuses/rejection reasons
- Paid-order queue, shipment updates (dispatched, in transit, delivered, failed) with courier/tracking
- Sales and earnings breakdown, commission totals, recent reviews, message inbox

**Admins**
- Dashboard overview of users, shops, products, orders and recent activity
- Shop applications: approve, reject or suspend with a reason
- Product moderation: approve, reject or archive
- User management and account deactivation
- Category management (create, edit, deactivate)
- Order monitoring and manual status updates
- Reports over a date range, commission ledger and seller payouts
- Platform settings for commission rate, shipping fee and free-shipping threshold

**Platform**
- Server-side sessions stored in PostgreSQL with bcrypt password hashing
- Socket.IO chat shared with the Express session
- Zod request validation, rate limiting, parameterised SQL and role guards
- Multi-vendor order snapshots so historical prices, commission rates and earnings never change
- Transactional checkout with product row locks and guarded stock decrements
- Simulated payment provider with idempotency and duplicate-payment protection
- Structured API errors and a health endpoint at `/api/health`

---

## Technology

| Layer | Choice |
| --- | --- |
| Front end | HTML5, CSS3, vanilla JavaScript ES modules |
| Server | Node.js 20+, Express 4 |
| Database | PostgreSQL 14+ (`pg`, `pgcrypto`) |
| Sessions | `express-session` + `connect-pg-simple` |
| Passwords | `bcrypt` (cost 12) |
| Realtime | Socket.IO |
| Images | Local uploads by default; optional Cloudinary (server-side only) |
| Validation | Zod |
| Payments | Simulated sandbox (M-Pesa-ready server-side boundary) |
| Tests | Node HTTP smoke test covering the ten business rules |

---

## Project structure

```text
stokana/
├── backend/
│   ├── src/
│   │   ├── config/          env, PostgreSQL pool, session store
│   │   ├── controllers/     HTTP handlers
│   │   ├── middleware/      auth guards, validation, origin check, errors
│   │   ├── routes/          /api route maps
│   │   ├── services/        business logic and SQL
│   │   ├── sockets/         Socket.IO chat
│   │   ├── utils/           money, slugs, tokens, errors
│   │   └── validators/      Zod schemas
│   ├── tests/smoke.test.js  ten business-rule checks
│   ├── uploads/             local development image storage
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql           tables, constraints, indexes, triggers, sessions
│   └── seeds/dev_seed.sql   demo users, shops, categories and products
├── docs/                    Postman collection and environment
└── frontend/
    ├── pages/               HTML pages
    ├── js/pages/            page controllers (ES modules)
    ├── js/                  shared API, auth, layout, UI and chat modules
    ├── css/                 design system and responsive styles
    └── assets/products/     seeded product photography
```

The Express server serves both the API and the static front end on the same origin, so no separate front-end build or dev server is required.

---

## Quick start with your own PostgreSQL

Your database credentials stay in `backend/.env`, which is ignored by Git. Nothing secret is placed in front-end JavaScript, the schema or the seed files.

### 1. Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer, running locally or reachable over the network
- `psql` available in your terminal (installed with PostgreSQL)

### 2. Create the database

Using `psql`:

```bash
createdb stokana_db
```

Or with pgAdmin: create a database named `stokana_db`.

If `psql` is not on your `PATH`, use pgAdmin's Query Tool or the full executable path, usually `C:\Program Files\PostgreSQL\<version>\bin\psql.exe` on Windows.

### 3. Load the schema and demo data

From the `stokana` project root:

```bash
psql -d stokana_db -f database/schema.sql
psql -d stokana_db -f database/seeds/dev_seed.sql
```

If your PostgreSQL user requires a password or a non-default host/port:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/stokana_db" -f database/schema.sql
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/stokana_db" -f database/seeds/dev_seed.sql
```

The schema requires the `pgcrypto` extension (used by the seed passwords); `schema.sql` enables it automatically.

### 4. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```dotenv
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/stokana_db
PGSSL=false
SESSION_SECRET=replace-with-a-long-random-secret
COOKIE_SECURE=false
TRUST_PROXY=false
PAYMENT_PROVIDER=simulated
```

Generate a strong session secret, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 5. Install and run

```bash
npm install
npm start
```

Open <http://localhost:4000>. Verify the API and database connection at <http://localhost:4000/api/health>.

For development with automatic restarts:

```bash
npm run dev
```

### Note for Windows users

The convenience scripts `npm run db:schema` and `npm run db:seed` rely on a shell that expands `$DATABASE_URL`. On Windows Command Prompt use the direct `psql` commands above, or run those npm scripts from Git Bash/WSL after exporting `DATABASE_URL`.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Keep it only in `backend/.env`. |
| `SESSION_SECRET` | Yes | Signs session cookies. Use 32+ random characters in production. |
| `PORT` | No | API/server port, default `4000`. |
| `NODE_ENV` | No | `development` or `production`. |
| `APP_URL` | No | Public origin used for links, allowed origins and cookies. |
| `PGSSL` | No | Set `true` when the database requires TLS. Defaults to on in production. |
| `COOKIE_SECURE` | No | Send session cookie only over HTTPS. Defaults to on in production. |
| `TRUST_PROXY` | No | Trust one reverse-proxy hop. Enable behind Nginx/Heroku/Render. |
| `PAYMENT_PROVIDER` | No | `simulated` (default) or `mpesa` for Safaricom Daraja STK Push. |
| `MPESA_ENVIRONMENT` | No | `sandbox` (default) or `production`. |
| `MPESA_CONSUMER_KEY` | When using M-PESA | Daraja app consumer key. Keep it server-side in `backend/.env`. |
| `MPESA_CONSUMER_SECRET` | When using M-PESA | Daraja app consumer secret. Keep it server-side in `backend/.env`. |
| `MPESA_SHORTCODE` | When using M-PESA | Paybill or organization shortcode registered with Daraja. |
| `MPESA_PASSKEY` | When using M-PESA | STK Push passkey issued for the shortcode. |
| `MPESA_TRANSACTION_TYPE` | No | Defaults to `CustomerPayBillOnline`; set the Daraja-supported type for your shortcode. |
| `MPESA_CALLBACK_URL` | When using M-PESA | Public HTTPS callback endpoint, e.g. `https://your-domain.example/api/payments/mpesa/callback`. |
| `CLOUDINARY_CLOUD_NAME` | No | Enables Cloudinary storage when all three Cloudinary values are set. |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key (server-side only). |
| `CLOUDINARY_API_SECRET` | No | Cloudinary secret (server-side only). |
| `CLOUDINARY_FOLDER` | No | Upload folder, default `stokana/products`. |

Never commit `backend/.env`. The repository ignores it and all other `.env.*` files except `.env.example`.

---

## Demo accounts

Created by `database/seeds/dev_seed.sql`. These are development credentials only — remove or change them before any public deployment.

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin@stokana.co.ke` | `Admin@2026` | Approvals, orders, reports, settings |
| Seller | `nairobitech@stokana.co.ke` | `Seller@2026` | Nairobi Tech Hub, approved |
| Seller | `zuribeauty@stokana.co.ke` | `Seller@2026` | Zuri Beauty & Care, approved |
| Seller | `savannahome@stokana.co.ke` | `Seller@2026` | Savanna Home, approved |
| Seller | `mavuno@stokana.co.ke` | `Seller@2026` | Mavuno Grocers, approved |
| Seller | `sanaa@stokana.co.ke` | `Seller@2026` | Sanaa Studio, approved |
| Seller | `alpine@stokana.co.ke` | `Seller@2026` | Alpine Outdoor KE, pending approval |
| Buyer | `buyer@stokana.co.ke` | `Buyer@2026` | Faith Wambui |
| Buyer | `wanjiru@example.com` | `Buyer@2026` | Second buyer for order tests |

The seed also creates 15 approved products, two pending products, demo orders, reviews, conversations and commission history. Use `alpine@stokana.co.ke` with the admin account to demonstrate shop approval; use a pending product in the admin queue to demonstrate product approval.

---

## How the marketplace works

### Order and money flow

1. A buyer adds products from one or more sellers to the cart.
2. Checkout locks the cart items and products, validates that products, shops and categories are still active, and checks stock inside one transaction.
3. The server calculates subtotal, shipping and commission from the current **server-side** settings; the browser never supplies prices or commission.
4. The order is created as `pending_payment` / `unpaid`, stock is decremented, a pending payment is created for the configured provider, and the cart is cleared.
5. In simulated mode the buyer can simulate a successful or failed payment. In M-PESA mode the server sends an STK Push to the buyer's phone and waits for the callback. A successful callback is checked against the Daraja STK Query API and the exact order amount before the payment is marked successful and the order `processing` / `paid`; commissions and shipments are then created once.
6. Sellers see paid orders only, update shipments and can deliver the order.
7. The buyer can review delivered items. Cancelling an unpaid order restores stock and fails its pending payments.

### Multi-vendor snapshots

`order_items` stores the seller, product name, image, unit price, quantity, commission rate, commission amount and seller earnings at the time of purchase. Later edits to products or platform settings never change historical orders or payouts.

### Payment simulation

The order detail page exposes simulated payment actions. Equivalent API calls:

```bash
# Successful payment
curl -X POST http://localhost:4000/api/orders/STK-YYYYMMDD-XXXXXX/payment/simulate \
  -H "Content-Type: application/json" \
  -H "Cookie: stokana.sid=YOUR_SESSION" \
  -d '{"outcome":"success"}'

# Retry an existing pending payment
curl -X POST http://localhost:4000/api/orders/STK-YYYYMMDD-XXXXXX/payment/retry ...

# Cancel an unpaid order
curl -X POST http://localhost:4000/api/orders/STK-YYYYMMDD-XXXXXX/cancel ...
```

### M-PESA Daraja STK Push

The simulator remains the default. To enable real Daraja sandbox requests, add the Daraja app credentials, shortcode, passkey and a publicly reachable HTTPS callback URL to `backend/.env`, then set:

```dotenv
PAYMENT_PROVIDER=mpesa
MPESA_ENVIRONMENT=sandbox
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
MPESA_CALLBACK_URL=https://your-public-host.example/api/payments/mpesa/callback
```

Restart the backend after changing environment variables. Checkout sends an STK Push to the Kenyan phone number entered for delivery. Only the server talks to Daraja, and a payment is finalized only after its callback matches the stored request, Daraja's STK Query confirms success, and the callback amount exactly matches the order. The callback URL must be reachable over HTTPS from Safaricom; `localhost` will not work. Use sandbox credentials and Safaricom's test numbers before switching to production. M-PESA STK amounts must be whole KES.

Run the focused phone-number and timestamp checks with `npm run test:mpesa` from `backend`.

Repeating a successful callback returns `alreadyProcessed: true` and creates no additional payment or commission. Failed payments leave the order reserved so the buyer can retry. Before enabling production payments, complete sandbox tests for successful, declined, cancelled and timed-out prompts; verify callback reachability, retries and order totals; and obtain Safaricom production approval. The configured credentials and callback still need an end-to-end test in the environment where the application will run.

---

## The ten business rules

The smoke test verifies each rule over real HTTP calls against a running server:

1. A buyer can register, sign out and log in again.
2. A seller cannot publish a product until an admin approves the shop; new products also remain hidden until product approval.
3. A seller cannot read or edit another seller's product through the seller API.
4. A product appears only in the category it was assigned to.
5. A sold-out product cannot be added to a cart or purchased.
6. When only one unit remains, only one of two buyers can complete checkout; the other receives a conflict response.
7. A buyer and seller are placed in their own conversation, and a second buyer gets a separate conversation with that seller.
8. Before payment the order is `pending_payment` / `unpaid`, has no paid timestamp, is absent from seller paid orders and has no commission.
9. A repeated successful payment callback creates no duplicate payment or commission, and only one shipment per seller is created.
10. A buyer cannot read another buyer's order or private conversation, and another seller cannot read that conversation.

### Where the rules are enforced

| Rule | Main enforcement points |
| --- | --- |
| 1 | `authController`, `middleware/auth.js`, server-side sessions |
| 2 | `requireApprovedSeller`, `adminService.reviewSeller`, approved-seller joins in `catalogueService` |
| 3 | Ownership-scoped queries in `sellerService` |
| 4 | Category FK plus `category` filter in `catalogueService` |
| 5 | `cartService.addItem`, `checkoutService.placeOrder` |
| 6 | `FOR UPDATE OF p, ci` and guarded `UPDATE products SET stock = stock - $1 WHERE stock >= $1` |
| 7 | Unique `(buyer_id, seller_id)` conversation and participant checks in `messagingService` |
| 8 | `checkoutService`, `paymentService`, paid-only seller order queries |
| 9 | Early idempotency return, unique partial success index, `ON CONFLICT (order_item_id) DO NOTHING` |
| 10 | Buyer ownership filter in `orderService`, participant filter in `messagingService` |

---

## Testing

### Automated business-rule smoke test

With the server running and the demo admin seeded:

```bash
cd backend
npm run test:smoke
```

Expected output ends with `10/10 business rules passed.`

The test calls `http://localhost:4000` by default. To point it elsewhere:

```bash
SMOKE_BASE_URL=https://staging.example.com npm run test:smoke
```

Optional admin overrides: `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD`.

What the test creates and cleans up:

- Registers two temporary buyers and two temporary sellers with unique `@stokana.test` emails.
- Creates and approves temporary products, places and pays a temporary order, and opens temporary conversations.
- Afterwards archives the temporary products, suspends the temporary shops and deactivates the temporary accounts through the admin API.
- A paid test order cannot be deleted by design; it remains in the database as an auditable transaction. Run the test against a disposable or dedicated test database.

### Manual milestone checks

1. Sign in as `alpine@stokana.co.ke` and confirm product creation is blocked with a clear approval message.
2. Sign in as admin, approve Alpine Outdoor KE, then approve its product.
3. Confirm the product appears in the correct category with imagery and opens its product page.
4. Sign in as buyer, open chat from the product page and exchange messages with the seller.
5. Set the product stock to zero in the seller dashboard; the product shows Sold out and cannot be added to a cart.
6. Restore stock, buy through checkout, simulate payment, accept the order as the seller, dispatch and deliver it, then leave a review.

### API health

```bash
curl http://localhost:4000/api/health
```

Returns `200` with the database name, server time and uptime when PostgreSQL is reachable, or `503` when it is not.

---

## Postman collection

Import both files from `docs/`:

- `docs/STOKANA.postman_collection.json`
- `docs/STOKANA.postman_environment.json`

Select the **STOKANA local** environment and adjust `baseUrl` and credentials if needed. Postman stores the session cookie automatically after each login request.

The collection contains 76 requests in nine folders. Run them in this order:

1. **Setup & auth** — health, marketplace stats, optional buyer/seller registration, login as admin/buyer/seller, inspect `/auth/me`.
2. **Public catalogue** — categories, search, category browse, product detail, reviews, shop directory and shop detail.
3. **Seller** — overview, shop profile, product creation/update, stock, image URL add/primary/delete, sales and reviews.
4. **Admin** — overview, approve the newly registered shop and the new product, sellers, users, orders, reports, commissions and settings.
5. **Buyer cart & orders** — cart, checkout, retry, successful simulated payment, duplicate callback, order detail, history and stats.
6. **Seller fulfilment** — refresh seller orders, dispatch the shipment and mark it delivered.
7. **Messages** — start a conversation, send, read, list and check unread counts.
8. **Seller inbox** — read and reply to the same conversation.
9. **Reviews** — list reviewable purchases and submit a review for the delivered item.

Key requests save returned ids and slugs into collection variables (`productId`, `productSlug`, `orderNumber`, `orderItemId`, `shipmentId`, `conversationId`, `sellerId`, `newSellerProfileId`) so later requests reuse them. The buyer flow places a real demo order and pays it with the simulated provider, so use a disposable development database rather than production data. The **Upload image file** and **Cancel unpaid order** requests need manual setup and are explained in their request descriptions.

---

## Security notes

- Passwords are hashed with bcrypt cost 12; password resets store only SHA-256 token hashes and expire after one hour.
- Sessions live in PostgreSQL, are sent in an `HttpOnly`, `SameSite=Lax` cookie, and are regenerated on login to prevent session fixation. Set `COOKIE_SECURE=true` in production.
- Helmet sets a strict content security policy; scripts are limited to the same origin and framing is denied.
- Mutating API requests with an `Origin` header are rejected unless the origin matches `APP_URL` (plus localhost in development).
- Role guards and ownership filters protect buyer, seller and admin endpoints. A missing record and another user's record both return `404` to avoid leaking existence.
- All SQL uses parameterised queries; dynamic filters are built from fixed fragments. Search terms are escaped for `ILIKE`.
- Checkout computes prices, shipping and commission on the server inside a transaction with row locks and guarded stock updates.
- The database enforces one successful payment per order and one commission per order item; callback handling is idempotent.
- Auth, registration, password reset and messaging endpoints are rate limited.
- Database passwords, session secrets and Cloudinary secrets belong only in `backend/.env` or the hosting provider's secret store. Never place them in front-end JavaScript or commit them.

---

## Deployment checklist

### Before deployment

- [ ] Provision PostgreSQL 14+ with TLS and automated backups.
- [ ] Run `database/schema.sql` against the production database.
- [ ] Do **not** load the demo seed into production. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` temporarily in the production environment and run `npm run admin:bootstrap` from `backend/` against the production database. Remove the temporary variables after it succeeds. This one-off command updates the sole existing admin or creates one if none exists; it is not run at app startup. Never put the password in source code or commit it.
- [ ] Set `NODE_ENV=production`, a 32+ character `SESSION_SECRET`, the real `APP_URL`, `COOKIE_SECURE=true`, `PGSSL=true` and `TRUST_PROXY=true` when behind a proxy.
- [ ] Configure a durable image store (Cloudinary or a persistent mounted volume for `backend/uploads`).
- [ ] Complete Daraja sandbox testing for successful, declined, cancelled and timed-out prompts; verify callback reachability, retries, exact order totals and idempotency before enabling production credentials. Never expose payment secrets to the browser.
- [ ] Integrate an email provider for password reset links; the development console log is not a production delivery mechanism.
- [ ] Review the demo help, refunds, terms and privacy copy with the business/legal owner.
- [ ] Configure the reverse proxy for HTTPS, request size limits, timeouts and WebSocket upgrades.
- [ ] Run `npm ci --omit=dev`, start under a process manager (systemd, PM2 or the platform runner), and expose only the app port behind TLS.
- [ ] Set up log aggregation, uptime checks against `/api/health`, database monitoring and alerting.
- [ ] Confirm backups restore successfully, not just that they run.

### After deployment

- [ ] Run the smoke test against staging (`SMOKE_BASE_URL=... npm run test:smoke`) using a disposable test database.
- [ ] Confirm secure cookies and HTTPS redirects work, and that `http://` sessions are not accepted.
- [ ] Verify admin approval, seller publishing, buyer checkout, payment, shipment and review flows with real accounts.
- [ ] Rotate any credentials used during setup and remove temporary test accounts.
- [ ] Test mobile layouts on a real phone, not only a desktop browser.

### Scaling notes

Socket.IO currently runs in-process. If you run more than one Node instance, add sticky sessions and a Socket.IO adapter (for example Redis) so chat events reach the right instance. Session storage is already shared through PostgreSQL.

---

## Known limitations and next steps

- **Payment readiness is unverified.** The default provider is `simulated`, and Daraja STK Push/callback support is implemented. An end-to-end sandbox payment and production configuration still need to be verified; do not assume credentials or callback reachability work just because Daraja mode is selected.
- **Password reset emails are not sent.** In development the reset link is logged to the server console and returned as `devResetToken`; production needs an email integration.
- **Local image uploads are not durable.** Use Cloudinary or persistent storage in production.
- **Single-instance realtime.** Add a Socket.IO adapter before horizontal scaling.
- **Automated coverage is API-focused.** The smoke test covers the ten business rules; front-end flows were verified manually in a browser. A Playwright/Cypress suite would be the next quality step.
- **No automated database migrations.** Apply `schema.sql` to a fresh database, or introduce a migration tool before evolving a production schema.
- **No real delivery-provider integration.** Shipments are tracked manually by sellers with courier and tracking numbers.

---

Built for the STOKANA marketplace brief: browsable catalogue, approved sellers, server-verified checkout, seller fulfilment, admin oversight and a first milestone that works end to end.
