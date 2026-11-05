ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12, 2)
  CHECK (delivery_fee >= 0);

UPDATE seller_profiles
SET delivery_fee = COALESCE(
  (SELECT value::numeric FROM settings WHERE key = 'shipping_fee'),
  250
)
WHERE delivery_fee IS NULL;

ALTER TABLE seller_profiles
  ALTER COLUMN delivery_fee SET DEFAULT 250,
  ALTER COLUMN delivery_fee SET NOT NULL;

CREATE TABLE IF NOT EXISTS order_seller_delivery_fees (
  order_id      BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  delivery_fee  NUMERIC(12, 2) NOT NULL CHECK (delivery_fee >= 0),
  PRIMARY KEY (order_id, seller_id)
);

ALTER TABLE commissions
  ALTER COLUMN order_item_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_commissions_delivery_order_seller
  ON commissions (order_id, seller_id) WHERE order_item_id IS NULL;
