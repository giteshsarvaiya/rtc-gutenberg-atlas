-- Caches the latest WordPress/gutenberg release, refreshed by the poller
-- each run, so the footer can show a live version link without hitting the
-- GitHub API on every page view.
ALTER TABLE checkpoint ADD COLUMN gutenberg_version TEXT;
ALTER TABLE checkpoint ADD COLUMN gutenberg_version_url TEXT;
