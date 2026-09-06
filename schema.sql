CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_ip_kind ON rate_events (ip_hash, kind, created_at);

INSERT INTO reflections (name, body, likes, created_at)
SELECT 'h1eina', 'I love this project!', 1, '2025-07-23 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM reflections LIMIT 1);
