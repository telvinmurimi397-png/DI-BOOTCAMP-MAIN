CREATE TABLE IF NOT EXISTS seller_pickup_locations (
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

CREATE INDEX IF NOT EXISTS idx_pickup_locations_seller
  ON seller_pickup_locations (seller_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_locations_default
  ON seller_pickup_locations (seller_id) WHERE is_default AND is_active;

DROP TRIGGER IF EXISTS trg_pickup_locations_updated ON seller_pickup_locations;
CREATE TRIGGER trg_pickup_locations_updated
BEFORE UPDATE ON seller_pickup_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS pickup_location_id BIGINT
    REFERENCES seller_pickup_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMPTZ;
