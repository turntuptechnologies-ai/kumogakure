-- Initial schema for kumogakure request logging.
--
-- Tables:
--   requests     - one row per captured request
--   daily_stats  - daily aggregations populated by Cron Trigger

CREATE TABLE requests (
  id            TEXT PRIMARY KEY,
  ts            INTEGER NOT NULL,
  ip            TEXT,
  asn           INTEGER,
  asn_org       TEXT,
  country       TEXT,
  method        TEXT NOT NULL,
  path          TEXT NOT NULL,
  query         TEXT,
  ua            TEXT,
  category      TEXT,
  subcategory   TEXT,
  status        INTEGER NOT NULL,
  body_size     INTEGER,
  r2_key        TEXT,
  signals       TEXT,
  tls_version   TEXT,
  tls_cipher    TEXT
);

CREATE INDEX idx_requests_ts ON requests(ts);
CREATE INDEX idx_requests_ip ON requests(ip);
CREATE INDEX idx_requests_category ON requests(category);
CREATE INDEX idx_requests_asn ON requests(asn);

CREATE TABLE daily_stats (
  date            TEXT PRIMARY KEY,
  total           INTEGER NOT NULL,
  unique_ips      INTEGER NOT NULL,
  unique_asns     INTEGER NOT NULL,
  top_categories  TEXT,
  top_paths       TEXT,
  top_asns        TEXT,
  signal_counts   TEXT
);
