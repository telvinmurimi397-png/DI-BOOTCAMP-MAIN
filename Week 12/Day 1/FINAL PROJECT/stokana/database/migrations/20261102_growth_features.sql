ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_email_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16),
  ADD COLUMN IF NOT EXISTS referred_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

UPDATE users
SET referral_code = 'STK' || upper(lpad(to_hex(id), 10, '0'))
WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_referral_code
  ON users (referral_code) WHERE referral_code IS NOT NULL;

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_claimed_at TIMESTAMPTZ;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (discount_total >= 0),
  ADD COLUMN IF NOT EXISTS promotion_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0
    CHECK (loyalty_points_redeemed >= 0),
  ADD COLUMN IF NOT EXISTS referral_credit_used NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (referral_credit_used >= 0);

CREATE TABLE IF NOT EXISTS promotions (
  id               BIGSERIAL PRIMARY KEY,
  owner_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
  code             VARCHAR(40),
  kind             VARCHAR(12) NOT NULL CHECK (kind IN ('coupon', 'flash_sale')),
  product_id       BIGINT REFERENCES products(id) ON DELETE CASCADE,
  discount_type    VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  max_discount     NUMERIC(12, 2) CHECK (max_discount IS NULL OR max_discount > 0),
  minimum_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_subtotal >= 0),
  usage_limit      INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'coupon' AND code IS NOT NULL AND product_id IS NULL)
      OR (kind = 'flash_sale' AND code IS NULL AND product_id IS NOT NULL)),
  CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promotions_code
  ON promotions (upper(code)) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_active_flash
  ON promotions (product_id, starts_at, ends_at)
  WHERE kind = 'flash_sale' AND is_active;
CREATE INDEX IF NOT EXISTS idx_promotions_owner
  ON promotions (owner_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_promotions_updated ON promotions;
CREATE TRIGGER trg_promotions_updated
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id               BIGSERIAL PRIMARY KEY,
  promotion_id     BIGINT NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  buyer_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id         BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount > 0),
  status           VARCHAR(10) NOT NULL DEFAULT 'reserved'
                   CHECK (status IN ('reserved', 'applied', 'released')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_promotion
  ON promotion_redemptions (promotion_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_buyer
  ON promotion_redemptions (buyer_id, promotion_id, status);

CREATE TABLE IF NOT EXISTS customer_reward_ledger (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_reward_order_entry
  ON customer_reward_ledger (user_id, entry_type, order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user
  ON customer_reward_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id               BIGSERIAL PRIMARY KEY,
  referrer_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  referred_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_order_id   BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  awarded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id          BIGSERIAL PRIMARY KEY,
  created_by  BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title       VARCHAR(120) NOT NULL,
  subject     VARCHAR(180) NOT NULL,
  body        TEXT NOT NULL,
  status      VARCHAR(12) NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at     TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS marketing_campaign_recipients (
  campaign_id   BIGINT NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(10) NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  PRIMARY KEY (campaign_id, user_id)
);
ALTER TABLE marketing_campaign_recipients
  DROP CONSTRAINT IF EXISTS marketing_campaign_recipients_status_check;
ALTER TABLE marketing_campaign_recipients
  ADD CONSTRAINT marketing_campaign_recipients_status_check
  CHECK (status IN ('queued', 'sent', 'failed', 'skipped'));

CREATE TABLE IF NOT EXISTS user_notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  title       VARCHAR(120) NOT NULL,
  message     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_notifications_campaign_user
  ON user_notifications (campaign_id, user_id)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;
