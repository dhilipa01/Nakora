-- 001_initial_schema.sql
-- All tables follow: id INTEGER PRIMARY KEY, created_at with default

CREATE TABLE IF NOT EXISTS schema_migrations (
  id         INTEGER PRIMARY KEY,
  filename   TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS threat_log (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  domain     TEXT NOT NULL,
  verdict    TEXT NOT NULL CHECK (verdict IN ('SAFE','WARNING','BLOCKED','CLEAN')),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  trigger    TEXT,
  analyzer   TEXT,
  abuse_type TEXT,
  latency    INTEGER
);

CREATE TABLE IF NOT EXISTS dns_query_log (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  domain     TEXT NOT NULL,
  verdict    TEXT NOT NULL CHECK (verdict IN ('SAFE','WARNING','BLOCKED','CLEAN')),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  trigger    TEXT,
  analyzer   TEXT,
  abuse_type TEXT,
  latency    INTEGER,
  query_type TEXT
);

CREATE TABLE IF NOT EXISTS whitelist (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  domain     TEXT UNIQUE NOT NULL,
  source     TEXT NOT NULL DEFAULT 'USER',
  reason     TEXT,
  added_by   TEXT NOT NULL DEFAULT 'USER' CHECK (added_by IN ('USER','FILTER_LIST'))
);

CREATE TABLE IF NOT EXISTS blacklist (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  domain     TEXT UNIQUE NOT NULL,
  source     TEXT NOT NULL DEFAULT 'USER',
  reason     TEXT,
  added_by   TEXT NOT NULL DEFAULT 'USER' CHECK (added_by IN ('USER','FILTER_LIST'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  action     TEXT NOT NULL,
  channel    TEXT,
  success    INTEGER NOT NULL DEFAULT 1,
  error      TEXT
);

CREATE TABLE IF NOT EXISTS session_meta (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT
);

-- Seed default whitelist entries
INSERT OR IGNORE INTO whitelist (domain, reason) VALUES
  ('hdfc.co.in',       'Indian banking — whitelisted by default'),
  ('sbi.co.in',        'Indian banking — whitelisted by default'),
  ('icicibank.com',    'Indian banking — whitelisted by default'),
  ('github.com',       'Development tools'),
  ('stackoverflow.com','Development tools'),
  ('microsoft.com',    'OS vendor');
