CREATE TABLE IF NOT EXISTS protected_purchases (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  source_scan_id text NOT NULL,
  merchant text NOT NULL,
  domain text NOT NULL,
  product text NOT NULL,
  amount numeric(14, 2),
  currency text,
  amount_label text NOT NULL,
  purchase_date date NOT NULL,
  delivery_date date,
  return_deadline date,
  warranty_deadline date,
  renewal_deadline date,
  protection_terms jsonb NOT NULL,
  lifecycle_status text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('active', 'kept', 'returned', 'refunded')),
  lifecycle_updated_at timestamptz,
  evidence_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, source_scan_id)
);

CREATE INDEX IF NOT EXISTS protected_purchases_client_id_idx
  ON protected_purchases (client_id);

CREATE INDEX IF NOT EXISTS protected_purchases_client_deadlines_idx
  ON protected_purchases (
    client_id,
    return_deadline,
    warranty_deadline,
    renewal_deadline
  );
