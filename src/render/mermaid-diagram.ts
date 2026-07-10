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
	last_pr_number: number | null;
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
			'SELECT path, component, summary, last_pr_number FROM file_facts ORDER BY component, path'
		).all< FactRow >(),
	] );

	const factsByPath = new Map(
		( factsResult.results ?? [] ).map( ( r ) => [ r.path, r ] )
	);

	/** Annotates a sequence-diagram step with the real file behind it and,
	 * when the poller has recorded one, the last PR that touched it — so the
	 * diagram reflects actual tracked facts rather than being purely
	 * hand-written prose, and updates on its own as new PRs land. */
	function annotateStep( label: string, filePath: string ): string {
		const fact = factsByPath.get( filePath );
		const prPart = fact?.last_pr_number ? ` (last: PR #${ fact.last_pr_number })` : '';
		return `${ safeLabel( label ) }<br/>${ filePath }${ prPart }`;
	}

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
  classDef peer fill:#FAFAF8,stroke:#78716C,stroke-width:1px,stroke-dasharray:3 3,color:#78716C;

  subgraph clientA["Client A — browser tab"]
    ui["${ nodeLabel( 'editor-ui' ) }"]
    cd["${ nodeLabel( 'core-data-bridge' ) }"]
    se["${ nodeLabel( 'sync-engine' ) }"]
  end

  pr["${ nodeLabel( 'php-rest' ) }<br/>/wp-sync/v1/updates + /save"]
  db[("${ nodeLabel( 'db-footprint' ) }")]:::db
  peerB["Other collaborators'<br/>browser tabs"]:::peer

  ui -->|"types in a block"| cd -->|"applyPostChangesToCRDTDoc"| se
  se <-->|"poll every 1-4s:<br/>Yjs updates + awareness"| pr
  pr <-->|"same relay, filtered<br/>per client_id"| peerB
  cd -.->|"on Save / autosave"| pr
  pr -.->|"update_post_meta"| db
  db -.->|"replay on load:<br/>Y.applyUpdateV2"| se
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

	const sequenceDefinition = `sequenceDiagram
  participant A as Client A
  participant S as Server (wp-sync/v1)
  participant DB as wp_postmeta
  participant B as Client B

  A->>A: type in a block (Redux action)
  A->>A: ${ annotateStep( 'applyPostChangesToCRDTDoc — mutate local Y.Doc', 'packages/core-data/src/utils/crdt.ts' ) }
  loop poll every 1-4s
    A->>S: ${ annotateStep( 'POST /updates — updates, awareness, cursor', 'packages/sync/src/providers/http-polling/polling-manager.ts' ) }
    S->>DB: ${ annotateStep( 'append to rolling update log', 'lib/compat/wordpress-7.1/class-wp-http-polling-sync-server.php' ) }
    S-->>A: updates since cursor + merged awareness
    S-->>B: same updates + awareness (on B's own poll tick)
    B->>B: ${ annotateStep( 'Y.applyUpdateV2(update) — re-render blocks + cursor overlay', 'packages/sync/src/manager.ts' ) }
  end
  A->>S: ${ annotateStep( 'POST /save {room, doc} — on Save / autosave', 'packages/core-data/src/utils/save-crdt-doc.js' ) }
  S->>DB: ${ annotateStep( 'update_post_meta(_crdt_document, doc)', 'lib/compat/wordpress-7.1/class-wp-sync-save-server.php' ) }
  Note over DB,A: next time the post is opened
  DB-->>A: ${ annotateStep( '_applyPersistedCrdtDoc replays doc via Y.applyUpdateV2', 'packages/sync/src/manager.ts' ) }
`;

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
<p class="mermaid-hint">
  Solid arrows = live edit sync (polled every 1&ndash;4s while collaborators are active).
  Dotted arrows = persistence (Save/autosave writing to <code>wp_postmeta</code>, and replay on
  the next page load). "Other collaborators' browser tabs" stands in for every other peer in the
  same room — the server relays the same polled updates to all of them, not just one.
  Click a component box to see its files.
</p>

<div class="section-divider">
  <h2>How a single edit propagates</h2>
  <p class="desc">The same system as a sequence: one keystroke's full round trip to another
  collaborator, plus what happens the next time the post is reopened. Each step names the real
  file behind it, with the last PR that touched it when the poller has recorded one — so this
  updates on its own as new merges land, the same as everything else on this page.</p>
</div>
<div class="mermaid-wrap">
  <pre class="mermaid">${ sequenceDefinition }</pre>
</div>

${ panels }`;
}
