ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_buyer_id_seller_id_key;

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_product_order_check;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_product_order_check
  CHECK (product_id IS NULL OR order_id IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_general
  ON conversations (buyer_id, seller_id)
  WHERE product_id IS NULL AND order_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_product
  ON conversations (buyer_id, seller_id, product_id)
  WHERE product_id IS NOT NULL AND order_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_order
  ON conversations (buyer_id, seller_id, order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE messages
  ALTER COLUMN body SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_mime VARCHAR(80);

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_body_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_body_or_attachment_check;
ALTER TABLE messages ADD CONSTRAINT messages_body_or_attachment_check
  CHECK (
    (length(btrim(body)) BETWEEN 1 AND 4000)
    OR (attachment_url IS NOT NULL AND attachment_mime IN ('image/jpeg', 'image/png', 'image/webp'))
  );

CREATE TABLE IF NOT EXISTS conversation_blocks (
  blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS conversation_reports (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 10 AND 2000),
  status VARCHAR(12) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_reports_status
  ON conversation_reports (status, created_at DESC);
