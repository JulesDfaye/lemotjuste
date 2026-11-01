CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL, day TEXT NOT NULL, sid TEXT NOT NULL,
  type TEXT NOT NULL, game TEXT, score INTEGER, total INTEGER, ok INTEGER,
  detail TEXT, country TEXT, device TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(type,ts);
