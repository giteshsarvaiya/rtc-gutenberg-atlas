import type { Env } from '../types';
import { escapeHtml } from './layout';

interface SnapshotRow {
	component: string;
	label: string;
	description: string;
	files: string;
}

interface FactAggRow {
	component: string;
	n: number;
	last_pr: number | null;
}

interface FactRow {
	path: string;
	component: string;
	summary: string | null;
}

/** Mermaid node/label text is our own controlled strings (component labels,
 * counts, PR numbers) — never PR titles or diff text — but still strip
 * characters that would break the grammar if a label is ever hand-edited. */
function safeLabel( s: string ): string {
	return s.replace( /["<>]/g, '' );
}

/**
 * Renders one combined flowchart describing the whole RTC system: structure
 * (which component talks to which) and flow (polling interval, save path,
 * replay-on-load) in a single diagram, annotated with live counts from D1.
 * Each component node is clickable (wired up in layout.ts via plain DOM
 * listeners on the rendered SVG, not Mermaid's own click syntax) and expands
 * a detail panel underneath listing that component's files with their
 * descriptions — the same file_facts data behind the low-level page.
 */
export async function renderMermaidArchitecture( env: Env ): Promise< string > {
	const [ snapshotResult, factsAggResult, factsResult ] = await Promise.all( [
		env.DB.prepare(
			'SELECT component, label, description, files FROM architecture_snapshot'
		).all< SnapshotRow >(),
		env.DB.prepare(
			'SELECT component, COUNT(*) as n, MAX(last_pr_number) as last_pr FROM file_facts GROUP BY component'
		).all< FactAggRow >(),
		env.DB.prepare(
			'SELECT path, component, summary FROM file_facts ORDER BY component, path'
		).all< FactRow >(),
	] );

	const snapshots = new Map(
		( snapshotResult.results ?? [] ).map( ( r ) => [ r.component, r ] )
	);
	const factsAgg = new Map(
		( factsAggResult.results ?? [] ).map( ( r ) => [ r.component, r ] )
	);
	const factsByComponent = new Map< string, FactRow[] >();
	for ( const row of factsResult.results ?? [] ) {
		if ( ! factsByComponent.has( row.component ) ) {
			factsByComponent.set( row.component, [] );
		}
		factsByComponent.get( row.component )!.push( row );
	}

	function nodeLabel( id: string ): string {
		const snap = snapshots.get( id );
		if ( ! snap ) return id;
		const fileCount = ( JSON.parse( snap.files ) as string[] ).length;
		const agg = factsAgg.get( id );
		const lines = [
			safeLabel( snap.label ),
			`${ fileCount } file${ fileCount === 1 ? '' : 's' }`,
		];
		if ( agg?.last_pr ) {
			lines.push( `last: PR #${ agg.last_pr }` );
		}
		return lines.join( '<br/>' );
	}

	const definition = `flowchart LR
  classDef default fill:#F5F4F2,stroke:#78716C,stroke-width:1px,color:#1C1917;
  classDef db fill:#EFEDEA,stroke:#1C1917,stroke-width:1px,color:#1C1917;

  subgraph client["Client (browser tab)"]
    ui["${ nodeLabel( 'editor-ui' ) }"]
    cd["${ nodeLabel( 'core-data-bridge' ) }"]
    se["${ nodeLabel( 'sync-engine' ) }"]
  end
  pr["${ nodeLabel( 'php-rest' ) }"]
  db[("${ nodeLabel( 'db-footprint' ) }")]:::db

  ui --> cd --> se
  se -->|"poll every 20min"| pr
  pr -->|"updates + awareness"| se
  pr -->|"save"| db
  db -.->|"replay on load"| se
`;

	const componentOrder = [
		'editor-ui',
		'core-data-bridge',
		'sync-engine',
		'php-rest',
		'db-footprint',
	];

	const panels = componentOrder
		.map( ( id ) => {
			const snap = snapshots.get( id );
			if ( ! snap ) return '';

			const facts = factsByComponent.get( id ) ?? [];
			// Fall back to the plain file list from architecture_snapshot for
			// any file that hasn't got a file_facts row yet (shouldn't happen
			// for real files after seeding, but covers db-footprint's
			// descriptive, non-path entries).
			const factPaths = new Set( facts.map( ( f ) => f.path ) );
			const fallbackFiles = ( JSON.parse( snap.files ) as string[] ).filter(
				( f ) => ! factPaths.has( f )
			);

			const factRows = facts
				.map(
					( f ) => `<div class="file-row">
    <div class="path">${ escapeHtml( f.path ) }</div>
    ${ f.summary ? `<p class="fsummary">${ escapeHtml( f.summary ) }</p>` : '' }
  </div>`
				)
				.join( '' );
			const fallbackRows = fallbackFiles
				.map(
					( f ) => `<div class="file-row"><div class="path">${ escapeHtml( f ) }</div></div>`
				)
				.join( '' );

			return `<div class="detail-panel" id="detail-${ id }" hidden>
  <h3>${ escapeHtml( snap.label ) }</h3>
  <p class="desc">${ escapeHtml( snap.description ) }</p>
  ${ factRows }${ fallbackRows }
</div>`;
		} )
		.join( '' );

	return `
<div class="section-divider">
  <h2>Architecture — live</h2>
  <p class="desc">The whole RTC system in one diagram, regenerated on every page load from
  the same data behind the <a href="/low-level">files &amp; components</a> view — file counts
  and the last PR that touched each part update automatically as new merges land.</p>
</div>
<div class="mermaid-wrap">
  <pre class="mermaid">${ definition }</pre>
</div>
<p class="mermaid-hint">Click a component to see its files.</p>
${ panels }`;
}
