# RTC Atlas

A living architecture tracker for Gutenberg's Real-Time Collaboration (RTC) stack.
A Cloudflare Worker polls `WordPress/gutenberg` on a cron schedule, finds merged PRs
that touch a fixed set of RTC-relevant files, asks Cloudflare Workers AI to extract
structured facts about each changed file, and serves a high-level layer map, a
low-level per-file view, a PR timeline, and an RSS feed — all read from D1.

Scope is intentionally narrowed to RTC (`packages/sync`, the CRDT bridge in
`packages/core-data`, the collaborators UI in `packages/editor`, and the PHP REST
layer in `lib/compat/wordpress-*`) — see `src/registry.ts` for the exact watch-list.

## Why polling, not a webhook

We don't administer `WordPress/gutenberg`, so we can't install a webhook there.
A Cloudflare Cron Trigger polls the GitHub Search API instead — no special access
needed, works against any public repo.

## Why AI only fills in facts, never structure

`src/registry.ts` is a checked-in, deterministic list of components and path globs.
The poller uses it to decide *whether* a changed file matters and *which* component
it belongs to. The AI call in `src/extractor.ts` is only ever asked to describe what
changed *within* an already-known component (one-line summary, added/removed/changed
symbol names) — it never gets to invent a new component or reassign a file. This is
the main guard against architecture drift from hallucination.

## Local setup

```bash
npm install

# wrangler.toml is gitignored because it holds your account-specific D1
# database_id. Copy the template, then fill it in:
cp wrangler.toml.example wrangler.toml

# One-time: create the D1 database, then paste the returned database_id
# into wrangler.toml's [[d1_databases]] block.
npx wrangler d1 create rtc_atlas

# Apply migrations locally
npm run db:migrate:local

# Optional: guards the manual poll-trigger route (see Verification below)
npx wrangler secret put DEBUG_TOKEN

npm run dev
```

## Deploying

```bash
npm run db:migrate:remote
npm run deploy
```

After the first deploy, replace `SITE_URL` in `src/render/feed.ts` with the real
`*.workers.dev` URL (or custom domain) and redeploy, so the Atom feed's `<link>`
entries resolve correctly.

The cron trigger fires automatically every 20 minutes (see `wrangler.toml`). On its
very first run it **bootstraps** the checkpoint to "now" and processes nothing —
this is deliberate, so the tracker never tries to backfill Gutenberg's entire PR
history against an unauthenticated GitHub rate limit (60 req/hr core API,
10 req/min search API). Everything from that point forward is picked up going
forward, capped at `MAX_PRS_PER_RUN` (10) matching PRs per cron tick.

If polling needs to go faster than the unauthenticated rate limit allows, set a
personal access token as `GITHUB_TOKEN` via `wrangler secret put GITHUB_TOKEN`
(no special scopes needed for public repos) — `src/github.ts` already picks it up
if present.

## Verification checklist

1. **Local dry run**: `npm run dev`, then hit
   `http://localhost:8787/debug/poll?token=<DEBUG_TOKEN>` — first call should return
   `{"bootstrapped": true, ...}`. Manually rewind the checkpoint
   (`UPDATE checkpoint SET last_merged_at = '2025-01-01T00:00:00Z'` via
   `wrangler d1 execute rtc_atlas --local --command "..."`) and call it again to
   exercise the real matching/extraction path against a known RTC-touching PR
   (e.g. one of the commits in `WordPress/gutenberg`'s `packages/sync` history).
2. **Render check**: load `/`, `/low-level`, `/timeline` locally and compare against
   the one-off architecture explainer this tracker replaces — same layer names,
   same component groupings.
3. **Feed validity**: fetch `/feed.xml` and run it through any Atom validator.
4. **Deployed cron**: after `npm run deploy`, confirm the trigger fires on schedule
   in the Cloudflare dashboard's Worker logs, and that a genuinely new RTC-relevant
   merged PR shows up in `/timeline` within one 20-minute interval.

## Not in v1 (by design, to keep scope down)

- No email/push notifications — RSS only.
- No auth/accounts — the site is read-only and public.
- No support for repos/paths outside the RTC registry.
