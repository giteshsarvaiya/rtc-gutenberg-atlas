# RTC Atlas

A living architecture tracker for Gutenberg's Real-Time Collaboration (RTC) stack —
live at **https://rtc-atlas.gitesh-sarvaiya82.workers.dev**.

Scope is intentionally narrowed to RTC (`packages/sync`, the CRDT bridge in
`packages/core-data`, the collaborators UI in `packages/editor`, and the PHP REST
layer in `lib/compat/wordpress-*`) — see `src/registry.ts` for the exact watch-list.

## Why I built this

Whenever I start contributing somewhere new, I try to build the bigger picture
first and then go top-down — understand the whole shape of a system before I
worry about any one file in it. It's how I personally get to a meaningful
understanding faster than reading code bottom-up ever does for me.

RTC in Gutenberg is a good example of a system where that bigger picture isn't
written down anywhere as a single page — it's spread across `packages/sync`,
the CRDT bridge in `core-data`, the collaborators UI in `editor`, and the PHP
REST layer, and it changes as PRs land. So instead of just writing myself a
one-off note, I thought: why not make that "bigger picture" a living site,
so anyone else contributing to RTC gets the same top-down starting point,
without having to reconstruct it from scratch the way I did.

This isn't necessarily *the* right way to learn a codebase — it's just the way
I do it. If you use a different approach (bottom-up, test-first, pairing with
someone who already knows it, whatever), I'd genuinely like to hear what works
for you. And if this site actually helped you get oriented on the RTC/CRDT
connection faster, that's the whole point of it existing.

## How it works today

1. A Cloudflare Cron Trigger polls the GitHub Search API every 20 minutes for
   PRs merged into `WordPress/gutenberg`'s `trunk` since the last checkpoint.
2. Each candidate PR's changed files are checked against `src/registry.ts` — a
   checked-in, deterministic list of the five RTC components and their path
   globs. PRs that don't touch a watched path are skipped entirely.
3. For PRs that do match, Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`)
   is asked to summarize *only* the matched files' diffs — a one-line summary
   plus added/removed/changed symbol names. It's never allowed to invent a new
   component or reassign a file; that structure only ever comes from the
   registry. Malformed AI output falls back to no summary rather than a
   fabricated one.
4. Results land in D1 (`file_facts`, `timeline`, `architecture_snapshot`,
   `checkpoint`), and every page reads straight from there — so the site is
   never more than one poll cycle behind reality, with no rebuild/redeploy step.
5. The site itself has four views: a live Mermaid architecture diagram plus a
   grounded sequence diagram (`/`), per-file facts grouped by component
   (`/low-level`), a chronological PR timeline (`/timeline`), and an Atom feed
   to subscribe to changes (`/feed.xml`).

The live site's own "Architecture" page is honestly the best explanation of
this — the diagrams there are generated from the same data this README is
describing, and update as PRs land.

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

## Future scope

Roughly in the order I'd actually pick them up:

- **Flag unmatched files, not just silently skip them.** Today, if a merged PR
  touches a genuinely new RTC-relevant file/folder that isn't in
  `src/registry.ts` yet, it's indistinguishable from a PR that's simply
  irrelevant — nothing surfaces it. A lightweight "files that looked
  RTC-adjacent but matched nothing" log would catch registry drift instead of
  relying on someone noticing by hand.
- **A real webhook instead of polling**, if a Gutenberg maintainer is ever
  willing to install a GitHub App — would remove the 20-minute lag and the
  unauthenticated rate-limit ceiling entirely.
- **A `GITHUB_TOKEN` secret by default** to raise the rate limit headroom,
  once polling frequency or PR volume actually needs it (not urgent today).
- **Historical/versioned snapshots** of the architecture diagram itself, so
  you could see how the RTC system's shape changed over months, not just the
  current state plus a flat PR list.
- **Direct Slack/webhook notifications** as an alternative to RSS, for teams
  that want a push rather than a feed reader.
- **Community review of the registry** — right now `src/registry.ts` is
  maintained by hand; opening it up for RTC contributors to PR new paths into
  it directly would keep it current without relying on one person noticing.
