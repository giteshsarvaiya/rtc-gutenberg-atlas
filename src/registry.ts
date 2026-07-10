/**
 * The RTC watch-list. Deterministic and checked-in — not AI-derived.
 *
 * The poller uses `globs` to decide whether a changed file is in scope at
 * all, and which component it belongs to. The extractor is only ever asked
 * to describe *what changed within* a component that already exists here;
 * it never gets to invent a new component.
 */
export interface RegistryComponent {
	id: string;
	label: string;
	description: string;
	globs: string[];
}

export const REGISTRY: RegistryComponent[] = [
	{
		id: 'editor-ui',
		label: 'Editor UI',
		description:
			'Renders the block tree and draws collaborator presence/cursors.',
		globs: [
			'packages/editor/src/components/collaborators-presence/**',
			'packages/editor/src/components/collaborators-overlay/**',
		],
	},
	{
		id: 'core-data-bridge',
		label: 'core-data bridge',
		description:
			'Bridges Redux entity records to and from the Yjs CRDT document, and tracks collaborator awareness state.',
		globs: [
			'packages/core-data/src/sync.ts',
			'packages/core-data/src/utils/crdt*.ts',
			'packages/core-data/src/utils/block-selection-history.ts',
			'packages/core-data/src/utils/save-crdt-doc.js',
			'packages/core-data/src/hooks/use-post-editor-awareness-state.ts',
			'packages/core-data/src/awareness/**',
		],
	},
	{
		id: 'sync-engine',
		label: 'Sync engine',
		description:
			'WP-agnostic CRDT engine: Y.Doc per entity, persisted-doc reconciliation, undo manager, polling transport.',
		globs: ['packages/sync/src/**'],
	},
	{
		id: 'php-rest',
		label: 'PHP / REST',
		description:
			'REST relay for live peer updates/awareness, and the durable save endpoint.',
		globs: [
			'lib/compat/wordpress-*/class-wp-sync-*.php',
			'lib/compat/wordpress-*/class-wp-http-polling-sync-server.php',
			'lib/compat/wordpress-*/interface-wp-sync-storage.php',
			'lib/compat/wordpress-*/collaboration.php',
		],
	},
];

/**
 * Converts a limited glob dialect (`*`, `**`, literal path segments) to a
 * RegExp. Intentionally minimal — no bracket classes, no external deps.
 */
function globToRegExp( glob: string ): RegExp {
	let pattern = '';
	for ( let i = 0; i < glob.length; i++ ) {
		const c = glob[ i ];
		if ( c === '*' ) {
			if ( glob[ i + 1 ] === '*' ) {
				pattern += '.*';
				i++;
			} else {
				pattern += '[^/]*';
			}
		} else if ( '.+^${}()|[]\\'.includes( c ) ) {
			pattern += '\\' + c;
		} else {
			pattern += c;
		}
	}
	return new RegExp( `^${ pattern }$` );
}

export interface RegistryMatch {
	component: RegistryComponent;
}

/**
 * Returns the component a given repo-relative file path belongs to, or
 * `undefined` if the path isn't watched at all.
 */
export function matchFile( path: string ): RegistryMatch | undefined {
	for ( const component of REGISTRY ) {
		for ( const glob of component.globs ) {
			if ( globToRegExp( glob ).test( path ) ) {
				return { component };
			}
		}
	}
	return undefined;
}
