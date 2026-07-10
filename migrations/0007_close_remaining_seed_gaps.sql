-- Cross-checked every registry glob against the actual gutenberg file tree
-- (find + compare, not assumption) and found two more inconsistencies left
-- over from 0006: two editor-ui iframe-style files that are siblings of
-- collaborator-styles.ts (already seeded) but were skipped, and seven
-- sync-engine files under packages/sync/src/** that the glob already
-- matched but were never hand-seeded. Closing both gaps for real parity
-- between "what the registry would track" and "what the site shows."

UPDATE architecture_snapshot SET updated_at = datetime('now'), files = '[
  "packages/editor/src/components/collaborators-presence/index.tsx",
  "packages/editor/src/components/collaborators-presence/list.tsx",
  "packages/editor/src/components/collaborators-presence/use-collaborator-notifications.ts",
  "packages/editor/src/components/collaborators-presence/avatar/component.tsx",
  "packages/editor/src/components/collaborators-presence/avatar/use-image-loading-status.ts",
  "packages/editor/src/components/collaborators-presence/avatar-group/component.tsx",
  "packages/editor/src/components/collaborators-overlay/index.tsx",
  "packages/editor/src/components/collaborators-overlay/overlay.tsx",
  "packages/editor/src/components/collaborators-overlay/use-render-cursors.ts",
  "packages/editor/src/components/collaborators-overlay/use-block-highlighting.ts",
  "packages/editor/src/components/collaborators-overlay/cursor-registry.ts",
  "packages/editor/src/components/collaborators-overlay/compute-selection.ts",
  "packages/editor/src/components/collaborators-overlay/cursor-dom-utils.ts",
  "packages/editor/src/components/collaborators-overlay/get-avatar-url.ts",
  "packages/editor/src/components/collaborators-overlay/use-debounced-recompute.ts",
  "packages/editor/src/components/collaborators-overlay/timing-utils.ts",
  "packages/editor/src/components/collaborators-overlay/collaborator-styles.ts",
  "packages/editor/src/components/collaborators-overlay/avatar-iframe-styles.ts",
  "packages/editor/src/components/collaborators-overlay/overlay-iframe-styles.ts"
]' WHERE component = 'editor-ui';

UPDATE architecture_snapshot SET updated_at = datetime('now'), files = '[
  "packages/sync/src/manager.ts",
  "packages/sync/src/config.ts",
  "packages/sync/src/undo-manager.ts",
  "packages/sync/src/index.ts",
  "packages/sync/src/errors.ts",
  "packages/sync/src/utils.ts",
  "packages/sync/src/lock-unlock.ts",
  "packages/sync/src/performance.ts",
  "packages/sync/src/private-apis.ts",
  "packages/sync/src/types.ts",
  "packages/sync/src/providers/index.ts",
  "packages/sync/src/providers/http-polling/http-polling-provider.ts",
  "packages/sync/src/providers/http-polling/polling-manager.ts",
  "packages/sync/src/providers/http-polling/config.ts",
  "packages/sync/src/providers/http-polling/types.ts",
  "packages/sync/src/providers/http-polling/utils.ts"
]' WHERE component = 'sync-engine';

INSERT OR IGNORE INTO file_facts (path, component, summary, symbols_added, symbols_removed, symbols_changed, last_pr_number, updated_at) VALUES
('packages/editor/src/components/collaborators-overlay/avatar-iframe-styles.ts', 'editor-ui', 'Compiled CSS for the avatar, mirrored from the SCSS source, for injection into the editor canvas iframe where the editor package''s Sass isn''t available.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/overlay-iframe-styles.ts', 'editor-ui', 'CSS for cursor indicators, block highlights, and avatar-label positioning inside the editor canvas iframe.', '[]', '[]', '[]', NULL, datetime('now')),

('packages/sync/src/lock-unlock.ts', 'sync-engine', 'Opts into WordPress''s private-APIs mechanism so @wordpress/sync can expose internal APIs to other core packages without making them public.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/performance.ts', 'sync-engine', 'Wraps a function to log how long it took to execute, for diagnosing sync manager performance.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/private-apis.ts', 'sync-engine', 'Locks and exposes the package''s private API surface (createSyncManager, error codes, CRDT map keys, Delta, retrySyncConnection) for other WordPress packages to unlock.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/types.ts', 'sync-engine', 'Shared TypeScript types for the sync engine: CRDTDoc, awareness IDs, and the global _wpCollaborationEnabled flag.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/http-polling/config.ts', 'sync-engine', 'Constants for the HTTP polling provider: per-room client limits and the retry-delay schedules used after poll failures.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/http-polling/types.ts', 'sync-engine', 'Type definitions for the polling transport''s sync protocol: awareness state shape and the sync_step1/sync_step2/update/compaction update types.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/http-polling/utils.ts', 'sync-engine', 'Queue and encoding helpers for the polling transport, including base64 conversion for Yjs update payloads sent to /wp-sync/v1/updates.', '[]', '[]', '[]', NULL, datetime('now'));
