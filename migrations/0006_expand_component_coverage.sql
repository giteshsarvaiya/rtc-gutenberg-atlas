-- The initial seed (0002/0003) only hand-picked a handful of files per
-- component. Auditing the actual gutenberg source turned up real gaps in
-- the registry itself (packages/core-data/src/awareness/**,
-- block-selection-history.ts, use-post-editor-awareness-state.ts, and the
-- PHP bootstrap collaboration.php were completely untracked — fixed in
-- src/registry.ts alongside this migration) plus a long tail of peripheral
-- files under collaborators-overlay/collaborators-presence and
-- packages/sync/src that were already covered by existing `**` globs but
-- never seeded.
--
-- This migration brings both the high-level file counts and the low-level
-- per-file descriptions up to what's actually in the codebase today.
-- Deliberately excluded: packages/editor/src/components/collab-sidebar/*
-- (a separate async notes/comments feature, not live CRDT sync — it only
-- incidentally shares one color-picking helper with RTC), core-data's
-- general private-apis.ts (exports far more than just RTC), and vendored
-- third-party code (quill-delta/, y-utilities/).

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
  "packages/editor/src/components/collaborators-overlay/collaborator-styles.ts"
]' WHERE component = 'editor-ui';

UPDATE architecture_snapshot SET description = 'Bridges Redux entity records to and from the Yjs CRDT document, and tracks collaborator awareness state.' WHERE component = 'core-data-bridge';

UPDATE architecture_snapshot SET updated_at = datetime('now'), files = '[
  "packages/core-data/src/sync.ts",
  "packages/core-data/src/utils/crdt.ts",
  "packages/core-data/src/utils/crdt-blocks.ts",
  "packages/core-data/src/utils/crdt-text.ts",
  "packages/core-data/src/utils/crdt-selection.ts",
  "packages/core-data/src/utils/crdt-user-selections.ts",
  "packages/core-data/src/utils/crdt-utils.ts",
  "packages/core-data/src/utils/block-selection-history.ts",
  "packages/core-data/src/utils/save-crdt-doc.js",
  "packages/core-data/src/hooks/use-post-editor-awareness-state.ts",
  "packages/core-data/src/awareness/awareness-state.ts",
  "packages/core-data/src/awareness/base-awareness.ts",
  "packages/core-data/src/awareness/block-lookup.ts",
  "packages/core-data/src/awareness/config.ts",
  "packages/core-data/src/awareness/post-editor-awareness.ts",
  "packages/core-data/src/awareness/typed-awareness.ts",
  "packages/core-data/src/awareness/types.ts",
  "packages/core-data/src/awareness/utils.ts"
]' WHERE component = 'core-data-bridge';

UPDATE architecture_snapshot SET updated_at = datetime('now'), files = '[
  "packages/sync/src/manager.ts",
  "packages/sync/src/config.ts",
  "packages/sync/src/undo-manager.ts",
  "packages/sync/src/index.ts",
  "packages/sync/src/errors.ts",
  "packages/sync/src/utils.ts",
  "packages/sync/src/providers/index.ts",
  "packages/sync/src/providers/http-polling/http-polling-provider.ts",
  "packages/sync/src/providers/http-polling/polling-manager.ts"
]' WHERE component = 'sync-engine';

UPDATE architecture_snapshot SET updated_at = datetime('now'), files = '[
  "lib/compat/wordpress-7.1/class-wp-http-polling-sync-server.php",
  "lib/compat/wordpress-7.1/class-wp-sync-save-server.php",
  "lib/compat/wordpress-7.1/class-wp-sync-config.php",
  "lib/compat/wordpress-7.1/class-wp-sync-post-meta-storage.php",
  "lib/compat/wordpress-7.1/interface-wp-sync-storage.php",
  "lib/compat/wordpress-7.1/collaboration.php"
]' WHERE component = 'php-rest';

INSERT OR IGNORE INTO file_facts (path, component, summary, symbols_added, symbols_removed, symbols_changed, last_pr_number, updated_at) VALUES
('packages/editor/src/components/collaborators-presence/use-collaborator-notifications.ts', 'editor-ui', 'Shows toast notifications when a collaborator joins, leaves, or another user saves the post.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-presence/avatar/component.tsx', 'editor-ui', 'Renders a single collaborator''s avatar image with a colored border, falling back to a placeholder while loading.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-presence/avatar/use-image-loading-status.ts', 'editor-ui', 'Tracks whether an avatar image is loading, loaded, or failed, so the avatar component can show a fallback.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-presence/avatar-group/component.tsx', 'editor-ui', 'Renders a capped, overlapping stack of avatars with a "+N" overflow indicator.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/overlay.tsx', 'editor-ui', 'Renders the cursor and highlight overlays inside the block editor iframe; recomputes positions on layout changes and on a periodic timer to catch DOM shifts that awareness updates alone would miss.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/cursor-registry.ts', 'editor-ui', 'Holds references to rendered cursor DOM elements so other components can scroll a specific collaborator''s cursor into view and briefly highlight it.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/compute-selection.ts', 'editor-ui', 'Resolves a collaborator''s selection into on-screen rectangles (multi-block) or a single cursor position (caret).', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/cursor-dom-utils.ts', 'editor-ui', 'DOM geometry helpers — cursor coordinates, selection rectangles, node ordering — used to render collaborator selections.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/get-avatar-url.ts', 'editor-ui', 'Picks the best available avatar image size (48px, then 96px, then 24px) from a collaborator''s avatar_urls.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/use-debounced-recompute.ts', 'editor-ui', 'A debounced "recompute token" hook that coalesces rapid successive triggers into a single recompute after a delay.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/timing-utils.ts', 'editor-ui', 'A setInterval-like helper that chains setTimeout calls so delays are measured from the end of one run, preventing overlapping executions.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/collaborator-styles.ts', 'editor-ui', 'Design tokens (elevation, radius, button sizes) duplicated from @wordpress/base-styles for use inside the editor canvas iframe, where Sass isn''t available.', '[]', '[]', '[]', NULL, datetime('now')),

('packages/core-data/src/utils/crdt-utils.ts', 'core-data-bridge', 'Shared Y.Map type-safety wrappers and rich-text/HTML offset conversion helpers used across the other crdt-*.ts files.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/block-selection-history.ts', 'core-data-bridge', 'Tracks a bounded history of recent selections per Y.Doc, used to restore a sensible selection after undo/redo.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/hooks/use-post-editor-awareness-state.ts', 'core-data-bridge', 'The public-facing hook that exposes active collaborators and selection-resolution to the editor UI, bridging the awareness/ subsystem into React.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/awareness-state.ts', 'core-data-bridge', 'Base class wrapping Yjs awareness with equality-checked state fields, so setting local state only triggers re-renders when values actually change.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/base-awareness.ts', 'core-data-bridge', 'Extends the base awareness state to automatically populate the current user''s collaborator info (name, avatar, browser) on setup.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/block-lookup.ts', 'core-data-bridge', 'Finds a block''s position in the Yjs document tree and resolves nested rich-text attributes back to their containing block.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/config.ts', 'core-data-bridge', 'Timing constants for awareness: cursor update throttle/debounce delays and how long before a disconnected collaborator is removed from presence.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/post-editor-awareness.ts', 'core-data-bridge', 'The concrete awareness implementation for the post editor — computes each collaborator''s resolved selection and exposes it as the state consumed by the UI.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/typed-awareness.ts', 'core-data-bridge', 'A typed wrapper around Yjs''s Awareness class giving type-safe get/set accessors for local and remote state fields.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/types.ts', 'core-data-bridge', 'Shared TypeScript types for awareness state: collaborator info and the base/editor state shapes.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/awareness/utils.ts', 'core-data-bridge', 'Small helpers for awareness state: browser-name detection and collaborator-info equality checks.', '[]', '[]', '[]', NULL, datetime('now')),

('packages/sync/src/index.ts', 'sync-engine', 'Package entry point; re-exports Yjs itself (as Y) so plugins share WordPress''s own Yjs instance rather than bundling a second, conflicting copy.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/errors.ts', 'sync-engine', 'Defines ConnectionError and its error codes (auth failure, connection limit, protocol mismatch, etc.) for the sync transport.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/utils.ts', 'sync-engine', 'Shared helpers for constructing a Y.Doc with document metadata and version/save-state bookkeeping.', '[]', '[]', '[]', NULL, datetime('now')),

('lib/compat/wordpress-7.1/collaboration.php', 'php-rest', 'Bootstraps collaborative editing on the PHP side: registers the wp_sync_storage post type, wires up the /wp-sync/v1 REST routes on rest_api_init, and registers the _crdt_document post meta.', '[]', '[]', '[]', NULL, datetime('now'));
