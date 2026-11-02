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
  email_verified  BOOLEAN NOT NULL DEFAULT TRUE,
  phone_verified  BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_email_consent BOOLEAN NOT NULL DEFAULT FALSE,
  referral_code   VARCHAR(16) UNIQUE,
  referred_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT,
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

CREATE TABLE user_verifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     VARCHAR(8) NOT NULL CHECK (channel IN ('email', 'phone')),
  token_hash  CHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    SMALLINT NOT NULL DEFAULT 0,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_verifications_user ON user_verifications (user_id, channel, created_at DESC);

CREATE TABLE two_factor_login_challenges (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_addresses (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(60) NOT NULL,
  full_name    VARCHAR(120) NOT NULL,
  phone        VARCHAR(30) NOT NULL,
  county       VARCHAR(80) NOT NULL,
  town         VARCHAR(80) NOT NULL,
  address_line TEXT NOT NULL,
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_addresses_default ON user_addresses (user_id) WHERE is_default;
CREATE INDEX idx_user_addresses_user ON user_addresses (user_id, created_at);

CREATE TRIGGER trg_user_addresses_updated
BEFORE UPDATE ON user_addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until    TIMESTAMPTZ,
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

CREATE TABLE seller_pickup_locations (
  id              BIGSERIAL PRIMARY KEY,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           VARCHAR(80) NOT NULL,
  county          VARCHAR(80) NOT NULL,
  town            VARCHAR(80) NOT NULL,
  address_line    VARCHAR(500) NOT NULL,
  contact_name    VARCHAR(120),
  phone           VARCHAR(30),
  instructions    VARCHAR(500),
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pickup_locations_seller ON seller_pickup_locations (seller_id, is_active);
CREATE UNIQUE INDEX uq_pickup_locations_default
  ON seller_pickup_locations (seller_id) WHERE is_default AND is_active;

CREATE TRIGGER trg_pickup_locations_updated
BEFORE UPDATE ON seller_pickup_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Catalogue
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  parent_category_id BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
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

CREATE INDEX idx_categories_parent ON categories (parent_category_id, sort_order, name);

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
  specifications    JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE TABLE wishlists (
  buyer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (buyer_id, product_id)
);

CREATE INDEX idx_wishlists_buyer_created ON wishlists (buyer_id, created_at DESC);

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

CREATE TABLE product_variants (
  id          BIGSERIAL PRIMARY KEY,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         VARCHAR(80) NOT NULL,
  attributes  JSONB NOT NULL CHECK (jsonb_typeof(attributes) = 'object'),
  price       NUMERIC(12, 2) CHECK (price IS NULL OR price > 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, id),
  UNIQUE (product_id, sku)
);

CREATE INDEX idx_product_variants_product ON product_variants (product_id);

CREATE TRIGGER trg_product_variants_updated
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Cart
-- ------------------------------------------------------------
CREATE TABLE carts (
  id          BIGSERIAL PRIMARY KEY,
  buyer_id    BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reminder_sent_at TIMESTAMPTZ,
  reminder_claimed_at TIMESTAMPTZ,
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
  variant_id  BIGINT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, variant_id) REFERENCES product_variants(product_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_cart_items_product
  ON cart_items (cart_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX uq_cart_items_variant
  ON cart_items (cart_id, product_id, variant_id) WHERE variant_id IS NOT NULL;

CREATE TRIGGER trg_cart_items_updated
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE saved_cart_items (
  id          BIGSERIAL PRIMARY KEY,
  buyer_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  BIGINT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, variant_id) REFERENCES product_variants(product_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_saved_cart_product
  ON saved_cart_items (buyer_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX uq_saved_cart_variant
  ON saved_cart_items (buyer_id, product_id, variant_id) WHERE variant_id IS NOT NULL;

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
  discount_total        NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  promotion_code        VARCHAR(40),
  loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points_redeemed >= 0),
  referral_credit_used  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (referral_credit_used >= 0),
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
  variant_id        BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
  variant_sku       VARCHAR(80),
  variant_attributes JSONB,
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
  transaction_ref VARCHAR(120),
  status          VARCHAR(12) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed')),
  failure_reason  TEXT,
  raw_payload     JSONB,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

CREATE INDEX idx_payments_order ON payments (order_id);
CREATE UNIQUE INDEX uq_payments_transaction_ref
  ON payments (provider, transaction_ref) WHERE transaction_ref IS NOT NULL;
-- A single order can never have two successful payments.
CREATE UNIQUE INDEX uq_one_successful_payment_per_order
  ON payments (order_id)
  WHERE status = 'success';

CREATE TABLE shipments (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location_id BIGINT REFERENCES seller_pickup_locations(id) ON DELETE SET NULL,
  status          VARCHAR(15) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'dispatched', 'in_transit', 'delivered', 'failed')),
  carrier         VARCHAR(80),
  tracking_number VARCHAR(120),
  tracking_url    TEXT,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, seller_id)
);

CREATE INDEX idx_shipments_seller ON shipments (seller_id);

CREATE TRIGGER trg_shipments_updated
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Growth, promotions and customer engagement
-- ------------------------------------------------------------
CREATE TABLE promotions (
  id              BIGSERIAL PRIMARY KEY,
  owner_id        BIGINT REFERENCES users(id) ON DELETE CASCADE,
  code            VARCHAR(40),
  kind            VARCHAR(12) NOT NULL CHECK (kind IN ('coupon', 'flash_sale')),
  product_id      BIGINT REFERENCES products(id) ON DELETE CASCADE,
  discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  max_discount    NUMERIC(12, 2) CHECK (max_discount IS NULL OR max_discount > 0),
  minimum_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_subtotal >= 0),
  usage_limit     INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'coupon' AND code IS NOT NULL AND product_id IS NULL)
      OR (kind = 'flash_sale' AND code IS NULL AND product_id IS NOT NULL)),
  CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE UNIQUE INDEX uq_promotions_code ON promotions (upper(code)) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_active_flash ON promotions (product_id, starts_at, ends_at)
  WHERE kind = 'flash_sale' AND is_active;
CREATE INDEX idx_promotions_owner ON promotions (owner_id, created_at DESC);

CREATE TRIGGER trg_promotions_updated
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE promotion_redemptions (
  id              BIGSERIAL PRIMARY KEY,
  promotion_id    BIGINT NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  buyer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id        BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount > 0),
  status          VARCHAR(10) NOT NULL DEFAULT 'reserved'
                  CHECK (status IN ('reserved', 'applied', 'released')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotion_redemptions_promotion ON promotion_redemptions (promotion_id, status);
CREATE INDEX idx_promotion_redemptions_buyer ON promotion_redemptions (buyer_id, promotion_id, status);

CREATE TABLE customer_reward_ledger (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type      VARCHAR(24) NOT NULL CHECK (
                    entry_type IN ('loyalty_earned', 'loyalty_redeemed',
                                   'referral_credit', 'referral_reversal',
                                   'loyalty_reversal', 'credit_redeemed', 'credit_reversal')
                  ),
  points_delta    INTEGER NOT NULL DEFAULT 0,
  credit_delta    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  related_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  note            VARCHAR(240),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_reward_order_entry ON customer_reward_ledger (user_id, entry_type, order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX idx_reward_ledger_user ON customer_reward_ledger (user_id, created_at DESC);

CREATE TABLE referral_rewards (
  id              BIGSERIAL PRIMARY KEY,
  referrer_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  referred_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_order_id  BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversed_at     TIMESTAMPTZ
);

CREATE TABLE marketing_campaigns (
  id              BIGSERIAL PRIMARY KEY,
  created_by      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title           VARCHAR(120) NOT NULL,
  subject         VARCHAR(180) NOT NULL,
  body            TEXT NOT NULL,
  status          VARCHAR(12) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at         TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE marketing_campaign_recipients (
  campaign_id     BIGINT NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          VARCHAR(10) NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE user_notifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id     BIGINT REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  title           VARCHAR(120) NOT NULL,
  message         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_user_notifications_campaign_user
  ON user_notifications (campaign_id, user_id)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_user_notifications_unread ON user_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE order_adjustment_requests (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_item_id   BIGINT REFERENCES order_items(id) ON DELETE CASCADE,
  request_type    VARCHAR(20) NOT NULL CHECK (request_type IN ('cancellation', 'return_refund')),
  reason          TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 2000),
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  status          VARCHAR(12) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (request_type = 'cancellation' AND order_item_id IS NULL AND quantity = 0)
    OR (request_type = 'return_refund' AND order_item_id IS NOT NULL AND quantity > 0)
  )
);

CREATE UNIQUE INDEX uq_open_order_cancellation_request
  ON order_adjustment_requests (order_id)
  WHERE request_type = 'cancellation' AND status IN ('pending', 'approved');
CREATE UNIQUE INDEX uq_open_item_return_request
  ON order_adjustment_requests (order_item_id)
  WHERE request_type = 'return_refund' AND status IN ('pending', 'approved');
CREATE INDEX idx_order_adjustment_order
  ON order_adjustment_requests (order_id, created_at DESC);
CREATE INDEX idx_order_adjustment_status
  ON order_adjustment_requests (status, created_at DESC);

CREATE TABLE refunds (
  id                  BIGSERIAL PRIMARY KEY,
  request_id          BIGINT NOT NULL UNIQUE REFERENCES order_adjustment_requests(id) ON DELETE RESTRICT,
  order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  provider_reference  VARCHAR(120) NOT NULL UNIQUE,
  processed_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
                    CHECK (status IN ('earned', 'paid', 'refunded')),
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
  product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (product_id IS NULL OR order_id IS NULL),
  CHECK (buyer_id <> seller_id)
);

CREATE INDEX idx_conversations_buyer ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations (seller_id, last_message_at DESC);
CREATE UNIQUE INDEX uq_conversations_general
  ON conversations (buyer_id, seller_id)
  WHERE product_id IS NULL AND order_id IS NULL;
CREATE UNIQUE INDEX uq_conversations_product
  ON conversations (buyer_id, seller_id, product_id)
  WHERE product_id IS NOT NULL AND order_id IS NULL;
CREATE UNIQUE INDEX uq_conversations_order
  ON conversations (buyer_id, seller_id, order_id)
  WHERE order_id IS NOT NULL;

CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL DEFAULT '',
  attachment_url  TEXT,
  attachment_mime VARCHAR(80),
  CHECK (
    (length(btrim(body)) BETWEEN 1 AND 4000)
    OR (attachment_url IS NOT NULL AND attachment_mime IN ('image/jpeg', 'image/png', 'image/webp'))
  ),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages (conversation_id, read_at)
  WHERE read_at IS NULL;

CREATE TABLE conversation_blocks (
  blocker_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE conversation_reports (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reporter_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 10 AND 2000),
  status          VARCHAR(12) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_reports_status ON conversation_reports (status, created_at DESC);

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
  ('platform_commission_rate', '0.05'),
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
