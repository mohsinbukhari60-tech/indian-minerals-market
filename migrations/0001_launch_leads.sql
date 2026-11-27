-- Additive launch-intake table. Does not alter existing marketplace tables.
CREATE TABLE IF NOT EXISTS launch_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('Buy', 'Sell')),
  product TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  location TEXT,
  quantity_mt REAL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_launch_leads_status_created
ON launch_leads(status, created_at DESC);
