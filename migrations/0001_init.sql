-- Single-row checkpoint: the merge timestamp of the last processed PR.
-- Bootstrapped to "now" on first poll so we never backfill Gutenberg's
-- entire PR history against an unauthenticated rate limit.
CREATE TABLE checkpoint (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_merged_at TEXT,
  updated_at TEXT NOT NULL
);

-- One row per merged PR that touched a watched RTC path.
CREATE TABLE timeline (
  pr_number INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  merged_at TEXT NOT NULL,
  components TEXT NOT NULL, -- JSON array of component names touched
  summary TEXT,             -- short AI-written rollup of the PR's effect, may be null
  created_at TEXT NOT NULL
);

-- Latest known facts about a single watched file (low-level view).
CREATE TABLE file_facts (
  path TEXT PRIMARY KEY,
  component TEXT NOT NULL,
  summary TEXT,
  symbols_added TEXT,   -- JSON array of strings
  symbols_removed TEXT, -- JSON array of strings
  symbols_changed TEXT, -- JSON array of strings
  last_pr_number INTEGER,
  updated_at TEXT NOT NULL
);

-- Current file membership per component (high-level view). Only rewritten
-- when a file's component mapping changes or a new watched file appears,
-- so the layer map doesn't churn on every unrelated commit.
CREATE TABLE architecture_snapshot (
  component TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  files TEXT NOT NULL, -- JSON array of file paths
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_timeline_merged_at ON timeline (merged_at DESC);
CREATE INDEX idx_file_facts_component ON file_facts (component);
