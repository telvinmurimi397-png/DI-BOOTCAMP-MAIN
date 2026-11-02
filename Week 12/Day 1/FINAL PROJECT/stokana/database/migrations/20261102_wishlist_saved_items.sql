BEGIN;

CREATE TABLE IF NOT EXISTS wishlists (
  buyer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (buyer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_buyer_created
  ON wishlists (buyer_id, created_at DESC);

COMMIT;
