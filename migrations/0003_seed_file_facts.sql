-- Pre-fills file_facts with grounded, hand-verified descriptions of every
-- file in the registry, read directly from the WordPress/gutenberg source
-- (not guessed) — same standard the AI extractor is held to. This means the
-- Files & components page and the diagram's click-to-expand panels have
-- real content from day one, instead of waiting on merged PRs to populate
-- them. INSERT OR IGNORE: if the poller has already recorded real facts for
-- a path (e.g. from an earlier test run), that data wins over this seed.

INSERT OR IGNORE INTO file_facts (path, component, summary, symbols_added, symbols_removed, symbols_changed, last_pr_number, updated_at) VALUES
('packages/editor/src/components/collaborators-presence/index.tsx', 'editor-ui', 'Renders the avatar list of active collaborators (max 3 visible) with a popover showing everyone on hover.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-presence/list.tsx', 'editor-ui', 'Renders the full collaborators list inside the popover; clicking a collaborator scrolls their cursor into view.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/index.tsx', 'editor-ui', 'Hosts the overlay layer on the block canvas where collaborator cursor and selection visuals are drawn.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/use-render-cursors.ts', 'editor-ui', 'Computes each collaborator''s cursor/selection visuals (position, color, avatar) from awareness state and the resolved selection.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/editor/src/components/collaborators-overlay/use-block-highlighting.ts', 'editor-ui', 'Computes block-level highlight overlays for collaborators who have a multi-block selection.', '[]', '[]', '[]', NULL, datetime('now')),

('packages/core-data/src/sync.ts', 'core-data-bridge', 'Wraps the sync manager as a private API for core-data; re-exports CRDT map keys, Delta, and change-origin constants.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/crdt.ts', 'core-data-bridge', 'Converts entity record fields (title, content, blocks, status) to and from the Yjs document''s maps; the file behind the #80004 blocks/content reconciliation.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/crdt-blocks.ts', 'core-data-bridge', 'Converts the block tree to and from the Yjs blocks array, including block attribute schema handling.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/crdt-text.ts', 'core-data-bridge', 'Caches HTML-to-RichTextData conversions (bounded FIFO cache) so identical rich text strings aren''t re-parsed.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/crdt-selection.ts', 'core-data-bridge', 'Resolves a block selection to and from positions in the Yjs document; defines the selection-type discriminated union.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/crdt-user-selections.ts', 'core-data-bridge', 'Tracks and persists each collaborator''s block selection history within a Y.Doc, one history per document.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/core-data/src/utils/save-crdt-doc.js', 'core-data-bridge', 'Serializes the current CRDT document and POSTs it to the /wp-sync/v1/save REST endpoint.', '[]', '[]', '[]', NULL, datetime('now')),

('packages/sync/src/manager.ts', 'sync-engine', 'The core CRDT engine: creates a Y.Doc per entity, wires up providers, and reconciles a persisted doc against the live record via _applyPersistedCrdtDoc.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/config.ts', 'sync-engine', 'Shared constants: CRDT doc schema version, Y.Map key names, and change-origin identifiers (editor, sync manager, undo-ignored).', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/undo-manager.ts', 'sync-engine', 'WordPress-compatible undo/redo built on YMultiDocUndoManager, giving each peer an independent undo stack across multiple CRDT docs.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/index.ts', 'sync-engine', 'Registers and filters the available Yjs provider creators; defaults to HTTP polling, filterable via the sync.providers hook.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/http-polling/http-polling-provider.ts', 'sync-engine', 'The Yjs provider that syncs document updates and awareness state to peers via HTTP polling.', '[]', '[]', '[]', NULL, datetime('now')),
('packages/sync/src/providers/http-polling/polling-manager.ts', 'sync-engine', 'Implements the polling loop itself: batches sync-protocol messages, adapts the polling interval, and handles retry/backoff.', '[]', '[]', '[]', NULL, datetime('now')),

('lib/compat/wordpress-7.1/class-wp-http-polling-sync-server.php', 'php-rest', 'REST endpoint (/wp-sync/v1/updates) that relays Yjs sync-protocol messages and merges awareness state between peers.', '[]', '[]', '[]', NULL, datetime('now')),
('lib/compat/wordpress-7.1/class-wp-sync-save-server.php', 'php-rest', 'REST endpoint (/wp-sync/v1/save) that persists a serialized CRDT document snapshot to post meta.', '[]', '[]', '[]', NULL, datetime('now')),
('lib/compat/wordpress-7.1/class-wp-sync-config.php', 'php-rest', 'Parses room identifiers into entity type/ID and checks whether that entity type supports CRDT doc persistence.', '[]', '[]', '[]', NULL, datetime('now')),
('lib/compat/wordpress-7.1/class-wp-sync-post-meta-storage.php', 'php-rest', 'Storage backend that persists sync updates and awareness state as post meta on a dedicated storage post per room.', '[]', '[]', '[]', NULL, datetime('now')),
('lib/compat/wordpress-7.1/interface-wp-sync-storage.php', 'php-rest', 'The storage contract (add_update, get_awareness_state, get_cursor, etc.) any sync storage backend must implement.', '[]', '[]', '[]', NULL, datetime('now'));
