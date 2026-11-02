CREATE TABLE IF NOT EXISTS saved_cart_items (
  id          BIGSERIAL PRIMARY KEY,
  buyer_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  BIGINT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, variant_id) REFERENCES product_variants(product_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_cart_product
  ON saved_cart_items (buyer_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_cart_variant
  ON saved_cart_items (buyer_id, product_id, variant_id) WHERE variant_id IS NOT NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname IN ('order_items_variant_fkey', 'order_items_variant_id_fkey')
      AND conrelid = 'order_items'::regclass
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS order_adjustment_requests (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_open_order_cancellation_request
  ON order_adjustment_requests (order_id)
  WHERE request_type = 'cancellation' AND status IN ('pending', 'approved');
CREATE UNIQUE INDEX IF NOT EXISTS uq_open_item_return_request
  ON order_adjustment_requests (order_item_id)
  WHERE request_type = 'return_refund' AND status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_order_adjustment_order
  ON order_adjustment_requests (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_adjustment_status
  ON order_adjustment_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS refunds (
  id                  BIGSERIAL PRIMARY KEY,
  request_id          BIGINT NOT NULL UNIQUE REFERENCES order_adjustment_requests(id) ON DELETE RESTRICT,
  order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  provider_reference  VARCHAR(120) NOT NULL UNIQUE,
  processed_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_status_check;
ALTER TABLE commissions ADD CONSTRAINT commissions_status_check
  CHECK (status IN ('earned', 'paid', 'refunded'));
