-- ============================================================
-- STOKANA marketplace — PostgreSQL schema
-- Run against a fresh database:  psql "$DATABASE_URL" -f schema.sql
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Shared helpers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Accounts and roles
-- ------------------------------------------------------------
CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  phone           VARCHAR(30),
  password_hash   TEXT NOT NULL,
  role            VARCHAR(10) NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('buyer', 'seller', 'admin')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE password_resets (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_resets_user ON password_resets (user_id);

-- ------------------------------------------------------------
-- Seller shops
-- ------------------------------------------------------------
CREATE TABLE seller_profiles (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name         VARCHAR(120) NOT NULL UNIQUE,
  shop_slug         VARCHAR(150) NOT NULL UNIQUE,
  description       TEXT,
  logo_url          TEXT,
  banner_url        TEXT,
  county            VARCHAR(80),
  town              VARCHAR(80),
  phone             VARCHAR(30),
  status            VARCHAR(12) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason  TEXT,
  approved_at       TIMESTAMPTZ,
  approved_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seller_profiles_status ON seller_profiles (status);

CREATE TRIGGER trg_seller_profiles_updated
BEFORE UPDATE ON seller_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Catalogue
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(40),
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categories_updated
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE products (
  id                BIGSERIAL PRIMARY KEY,
  seller_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id       BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name              VARCHAR(180) NOT NULL,
  slug              VARCHAR(220) NOT NULL UNIQUE,
  description       TEXT,
  price             NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  compare_at_price  NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price > 0),
  stock             INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  condition         VARCHAR(15) NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  location          VARCHAR(120),
  status            VARCHAR(12) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  rejection_reason  TEXT,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  views_count       INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  approved_at       TIMESTAMPTZ,
  approved_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_catalogue ON products (status, category_id, created_at DESC);
CREATE INDEX idx_products_seller ON products (seller_id, created_at DESC);
CREATE INDEX idx_products_name_search ON products (lower(name));
CREATE INDEX idx_products_price ON products (price);

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
  id          BIGSERIAL PRIMARY KEY,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    VARCHAR(200),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, url)
);

CREATE INDEX idx_product_images_product ON product_images (product_id, sort_order);
CREATE UNIQUE INDEX uq_product_primary_image
  ON product_images (product_id)
  WHERE is_primary;

-- ------------------------------------------------------------
-- Cart
-- ------------------------------------------------------------
CREATE TABLE carts (
  id          BIGSERIAL PRIMARY KEY,
  buyer_id    BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_carts_updated
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
  id          BIGSERIAL PRIMARY KEY,
  cart_id     BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TRIGGER trg_cart_items_updated
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Orders
-- order_items keeps seller + price snapshots for multi-vendor orders
-- ------------------------------------------------------------
CREATE TABLE orders (
  id                    BIGSERIAL PRIMARY KEY,
  order_number          VARCHAR(30) NOT NULL UNIQUE,
  buyer_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN ('pending_payment', 'paid', 'processing',
                                          'shipped', 'delivered', 'cancelled')),
  payment_status        VARCHAR(12) NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  subtotal              NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee          NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total                 NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  commission_total      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (commission_total >= 0),
  seller_earnings_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (seller_earnings_total >= 0),
  shipping_name         VARCHAR(120) NOT NULL,
  shipping_phone        VARCHAR(30) NOT NULL,
  shipping_email        VARCHAR(255),
  shipping_county       VARCHAR(80) NOT NULL,
  shipping_town         VARCHAR(80) NOT NULL,
  shipping_address      TEXT NOT NULL,
  notes                 TEXT,
  paid_at               TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders (buyer_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders (status, created_at DESC);

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id        BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name      VARCHAR(180) NOT NULL,
  product_image_url TEXT,
  unit_price        NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  line_total        NUMERIC(12, 2) NOT NULL CHECK (line_total > 0),
  commission_rate   NUMERIC(5, 4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
  commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
  seller_earnings   NUMERIC(12, 2) NOT NULL CHECK (seller_earnings >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_seller ON order_items (seller_id);

CREATE TABLE payments (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider        VARCHAR(30) NOT NULL DEFAULT 'simulated',
  provider_ref    VARCHAR(120) NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency        CHAR(3) NOT NULL DEFAULT 'KES',
  phone           VARCHAR(30),
  status          VARCHAR(12) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed')),
  failure_reason  TEXT,
  raw_payload     JSONB,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

CREATE INDEX idx_payments_order ON payments (order_id);
-- A single order can never have two successful payments.
CREATE UNIQUE INDEX uq_one_successful_payment_per_order
  ON payments (order_id)
  WHERE status = 'success';

CREATE TABLE shipments (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          VARCHAR(15) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'dispatched', 'in_transit', 'delivered', 'failed')),
  carrier         VARCHAR(80),
  tracking_number VARCHAR(120),
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, seller_id)
);

CREATE INDEX idx_shipments_seller ON shipments (seller_id);

CREATE TRIGGER trg_shipments_updated
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE commissions (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     BIGINT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  seller_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rate              NUMERIC(5, 4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  gross_amount      NUMERIC(12, 2) NOT NULL CHECK (gross_amount > 0),
  commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
  seller_earnings   NUMERIC(12, 2) NOT NULL CHECK (seller_earnings >= 0),
  status            VARCHAR(12) NOT NULL DEFAULT 'earned'
                    CHECK (status IN ('earned', 'paid')),
  payout_reference  VARCHAR(120),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_seller ON commissions (seller_id, status);
CREATE INDEX idx_commissions_order ON commissions (order_id);

-- ------------------------------------------------------------
-- Buyer–seller messaging
-- ------------------------------------------------------------
CREATE TABLE conversations (
  id              BIGSERIAL PRIMARY KEY,
  buyer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, seller_id),
  CHECK (buyer_id <> seller_id)
);

CREATE INDEX idx_conversations_buyer ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations (seller_id, last_message_at DESC);

CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages (conversation_id, read_at)
  WHERE read_at IS NULL;

-- ------------------------------------------------------------
-- Reviews
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id             BIGSERIAL PRIMARY KEY,
  order_item_id  BIGINT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  product_id     BIGINT REFERENCES products(id) ON DELETE SET NULL,
  buyer_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          VARCHAR(150),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON reviews (product_id, created_at DESC);
CREATE INDEX idx_reviews_seller ON reviews (seller_id);

-- ------------------------------------------------------------
-- Platform configuration
-- ------------------------------------------------------------
CREATE TABLE settings (
  key         VARCHAR(60) PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_settings_updated
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO settings (key, value) VALUES
  ('platform_commission_rate', '0.10'),
  ('shipping_fee', '250'),
  ('free_shipping_threshold', '5000')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- Server-side sessions (connect-pg-simple compatible)
-- ------------------------------------------------------------
CREATE TABLE "session" (
  "sid"     VARCHAR NOT NULL COLLATE "default",
  "sess"    JSON NOT NULL,
  "expire"  TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

COMMIT;
