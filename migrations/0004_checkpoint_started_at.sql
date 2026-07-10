-- Tracks when the tracker first started watching (distinct from
-- last_merged_at, which keeps advancing as PRs are processed). Needed so
-- the UI can show "tracking since <date>" instead of leaving an empty
-- timeline looking indistinguishable from a broken one.
ALTER TABLE checkpoint ADD COLUMN started_at TEXT;

-- Backfill for any checkpoint row that already existed before this column:
-- last_merged_at at the time of writing this migration is the closest
-- available approximation of when tracking actually began.
UPDATE checkpoint SET started_at = last_merged_at WHERE started_at IS NULL;
