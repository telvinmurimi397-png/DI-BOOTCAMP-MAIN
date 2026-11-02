ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(120);

UPDATE payments p
SET transaction_ref = (
  SELECT item->>'Value'
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p.raw_payload #> '{callback,Body,stkCallback,CallbackMetadata,Item}') = 'array'
      THEN p.raw_payload #> '{callback,Body,stkCallback,CallbackMetadata,Item}'
      ELSE '[]'::jsonb
    END
  ) AS metadata(item)
  WHERE item->>'Name' = 'MpesaReceiptNumber'
  LIMIT 1
)
WHERE p.provider = 'mpesa'
  AND p.status = 'success'
  AND p.transaction_ref IS NULL
  AND p.raw_payload #> '{callback,Body,stkCallback,CallbackMetadata,Item}' IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_ref
  ON payments (provider, transaction_ref)
  WHERE transaction_ref IS NOT NULL;
