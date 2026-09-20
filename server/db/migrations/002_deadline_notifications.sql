CREATE TABLE IF NOT EXISTS client_notification_preferences (
  client_id uuid PRIMARY KEY,
  lead_days smallint NOT NULL DEFAULT 7
    CHECK (lead_days BETWEEN 1 AND 30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deadline_notifications (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  protected_purchase_id uuid NOT NULL
    REFERENCES protected_purchases(id)
    ON DELETE CASCADE,
  deadline_kind text NOT NULL
    CHECK (deadline_kind IN ('return', 'warranty', 'renewal')),
  deadline_date date NOT NULL,
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (
    client_id,
    protected_purchase_id,
    deadline_kind,
    deadline_date
  )
);

CREATE INDEX IF NOT EXISTS deadline_notifications_client_unread_idx
  ON deadline_notifications (
    client_id,
    read_at,
    deadline_date
  );

CREATE INDEX IF NOT EXISTS deadline_notifications_purchase_idx
  ON deadline_notifications (
    protected_purchase_id
  );
