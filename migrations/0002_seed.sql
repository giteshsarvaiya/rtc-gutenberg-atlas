-- Seed the high-level snapshot with the components/files verified by hand
-- (see the RTC architecture explainer this tracker replaces). The poller
-- will keep this current going forward; this just avoids an empty site
-- before the first cron run.

INSERT INTO architecture_snapshot (component, label, description, files, updated_at) VALUES
('editor-ui', 'Editor UI', 'Renders the block tree and draws collaborator presence/cursors.',
 '["packages/editor/src/components/collaborators-presence/index.tsx","packages/editor/src/components/collaborators-presence/list.tsx","packages/editor/src/components/collaborators-overlay/index.tsx","packages/editor/src/components/collaborators-overlay/use-render-cursors.ts","packages/editor/src/components/collaborators-overlay/use-block-highlighting.ts"]',
 datetime('now')),
('core-data-bridge', 'core-data bridge', 'Bridges Redux entity records to and from the Yjs CRDT document.',
 '["packages/core-data/src/sync.ts","packages/core-data/src/utils/crdt.ts","packages/core-data/src/utils/crdt-blocks.ts","packages/core-data/src/utils/crdt-text.ts","packages/core-data/src/utils/crdt-selection.ts","packages/core-data/src/utils/crdt-user-selections.ts","packages/core-data/src/utils/save-crdt-doc.js"]',
 datetime('now')),
('sync-engine', 'Sync engine', 'WP-agnostic CRDT engine: Y.Doc per entity, persisted-doc reconciliation, undo manager, polling transport.',
 '["packages/sync/src/manager.ts","packages/sync/src/config.ts","packages/sync/src/undo-manager.ts","packages/sync/src/providers/index.ts","packages/sync/src/providers/http-polling/http-polling-provider.ts","packages/sync/src/providers/http-polling/polling-manager.ts"]',
 datetime('now')),
('php-rest', 'PHP / REST', 'REST relay for live peer updates/awareness, and the durable save endpoint.',
 '["lib/compat/wordpress-7.1/class-wp-http-polling-sync-server.php","lib/compat/wordpress-7.1/class-wp-sync-save-server.php","lib/compat/wordpress-7.1/class-wp-sync-config.php","lib/compat/wordpress-7.1/class-wp-sync-post-meta-storage.php","lib/compat/wordpress-7.1/interface-wp-sync-storage.php"]',
 datetime('now')),
('db-footprint', 'DB footprint', 'wp_postmeta keys the rest of the stack reads and writes.',
 '["_crdt_document (durable snapshot, written by WP_Sync_Save_Server)","rolling update/awareness log (written by WP_Sync_Post_Meta_Storage)"]',
 datetime('now'));
