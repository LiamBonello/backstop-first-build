CREATE TABLE IF NOT EXISTS resolution_cases (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  protected_purchase_id uuid NOT NULL
    REFERENCES protected_purchases(id)
    ON DELETE CASCADE,
  issue_type text NOT NULL
    CHECK (
      issue_type IN (
        'return_refused',
        'refund_overdue',
        'merchant_unresponsive',
        'unexpected_renewal',
        'warranty_problem',
        'item_not_as_described',
        'other'
      )
    ),
  amount_in_dispute numeric(14, 2),
  currency text,
  desired_outcome text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (
      status IN (
        'draft',
        'merchant_contacted',
        'awaiting_response',
        'escalated',
        'refund_promised',
        'resolved',
        'closed'
      )
    ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, protected_purchase_id)
);

CREATE TABLE IF NOT EXISTS resolution_case_events (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  resolution_case_id uuid NOT NULL
    REFERENCES resolution_cases(id)
    ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('created', 'status', 'note')),
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resolution_cases_client_status_idx
  ON resolution_cases (client_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS resolution_case_events_case_idx
  ON resolution_case_events (resolution_case_id, created_at ASC);
