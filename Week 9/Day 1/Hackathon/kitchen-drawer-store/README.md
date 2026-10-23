# The Kitchen Drawer

A complete mini e-commerce store for cooking utensils, built with **Node.js, Express, EJS and SQLite**.

Product photos are real utensil photographs from Wikimedia Commons, stored locally in `public/images/products`. See [the photo credits](./public/images/products/ATTRIBUTION.md) for creators and license terms.

The expanded demo catalog has about 20 distinct products in each of its four categories. `npm run seed` adds missing products and demo accounts, removes retired duplicate listings when they are not referenced by an order, and preserves accounts and order history.

## Features

**Storefront**
- Homepage with category links and featured products
- Product catalog at `/shop` with category filters and search
- Product detail pages with stock indicators ("Only X left", "Out of stock")
- Session-based shopping cart
- Checkout with shipping form (Cash on Delivery)
- Order confirmation page

**Accounts**
- Register / login (bcrypt-hashed passwords, session-based auth)
- Order history on "My Account" page

**Admin panel** (`/admin`)
- Dashboard with stats: products, orders, revenue, pending orders
- Product CRUD (add / edit / delete with validation)
- Order management with status updates (pending → shipped → delivered / cancelled)
- Stock decreases automatically when an order is placed

## Tech stack

| Piece | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Templating | EJS (server-rendered) |
| Database | SQLite via `better-sqlite3` (file-based, zero setup) |
| Auth | `express-session` + `bcryptjs` |
| Security | `helmet`, parameterized queries, server-side validation |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Seed the database (12 products, admin + demo customer, 1 sample order)
npm run seed

# 4. Start the dev server (auto-restarts on file change)
npm run dev
```

Open **http://localhost:3000**

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@store.com | admin123 |
| Customer | customer@store.com | customer123 |

> These are demo credentials only — change them before any real deployment.

## Project structure

```
├── server.js              # App entry point
├── db/
│   ├── connection.js      # SQLite setup + schema
│   ├── seed.js            # Seed script (npm run seed)
│   └── store.db           # Created automatically
├── middleware/auth.js     # requireAuth / requireAdmin guards
├── routes/
│   ├── shop.js            # Catalog, cart, checkout, orders
│   ├── auth.js            # Register, login, logout, account
│   └── admin.js           # Dashboard, product CRUD, order status
├── views/                 # EJS templates (+ partials)
└── public/                # CSS & client JS
```

## Next steps you can build on this

- [ ] Product image upload (`multer` + Cloudinary)
- [ ] Real payments (Stripe Checkout in test mode)
- [ ] Order confirmation emails (Nodemailer)
- [ ] Order detail view in admin (with line items)
- [ ] Pagination for the catalog
- [ ] Password reset flow
