"""SQLite baseline adapter with bounded, read-only analytical execution."""

import sqlite3
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  user_segment TEXT NOT NULL,
  acquisition_source TEXT NOT NULL,
  app_version TEXT NOT NULL,
  device TEXT NOT NULL,
  feature_usage TEXT NOT NULL,
  onboarding_step TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_date_name ON events(event_date, event_name);
CREATE TABLE IF NOT EXISTS releases (
  version TEXT PRIMARY KEY,
  released_at TEXT NOT NULL,
  notes TEXT NOT NULL
);
"""


class Database:
    def __init__(self, path: str | Path = "data/product_analytics.db"):
        self.path = str(path)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    def query(self, sql: str, params: tuple = (), limit: int = 1000) -> list[dict]:
        with self.connect() as connection:
            connection.execute("PRAGMA query_only = ON")
            rows = connection.execute(sql, params).fetchmany(limit + 1)
            if len(rows) > limit:
                raise ValueError(f"query exceeded the {limit}-row safety limit")
            return [dict(row) for row in rows]
