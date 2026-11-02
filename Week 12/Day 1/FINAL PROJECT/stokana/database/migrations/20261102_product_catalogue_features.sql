BEGIN;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_category_id BIGINT
  REFERENCES categories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_categories_parent
  ON categories (parent_category_id, sort_order, name);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS product_variants (
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
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants (product_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_product_variants_updated'
      AND tgrelid = 'product_variants'::regclass
  ) THEN
    CREATE TRIGGER trg_product_variants_updated
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id BIGINT;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cart_items_product_variant_fkey'
      AND conrelid = 'cart_items'::regclass
  ) THEN
    ALTER TABLE cart_items
      ADD CONSTRAINT cart_items_product_variant_fkey
      FOREIGN KEY (product_id, variant_id)
      REFERENCES product_variants(product_id, id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_product
  ON cart_items (cart_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_variant
  ON cart_items (cart_id, product_id, variant_id) WHERE variant_id IS NOT NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(80),
  ADD COLUMN IF NOT EXISTS variant_attributes JSONB;

COMMIT;
