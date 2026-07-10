import type { Env } from '../types';

interface SnapshotRow {
	component: string;
	label: string;
	files: string;
}

interface FactAggRow {
	component: string;
	n: number;
	last_pr: number | null;
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
 * Unlike src/render/topology.ts (removed), this is generated fresh from
 * architecture_snapshot + file_facts on every request, so it reflects
 * whatever the poller has learned as of the last merged PR it processed.
 */
export async function renderMermaidArchitecture( env: Env ): Promise< string > {
	const [ snapshotResult, factsResult ] = await Promise.all( [
		env.DB.prepare(
			'SELECT component, label, files FROM architecture_snapshot'
		).all< SnapshotRow >(),
		env.DB.prepare(
			'SELECT component, COUNT(*) as n, MAX(last_pr_number) as last_pr FROM file_facts GROUP BY component'
		).all< FactAggRow >(),
	] );

	const snapshots = new Map(
		( snapshotResult.results ?? [] ).map( ( r ) => [ r.component, r ] )
	);
	const facts = new Map(
		( factsResult.results ?? [] ).map( ( r ) => [ r.component, r ] )
	);

	function nodeLabel( id: string ): string {
		const snap = snapshots.get( id );
		if ( ! snap ) return id;
		const fileCount = ( JSON.parse( snap.files ) as string[] ).length;
		const fact = facts.get( id );
		const lines = [
			safeLabel( snap.label ),
			`${ fileCount } file${ fileCount === 1 ? '' : 's' }`,
		];
		if ( fact?.last_pr ) {
			lines.push( `last: PR #${ fact.last_pr }` );
		}
		return lines.join( '<br/>' );
	}

	const definition = `flowchart LR
  classDef default fill:#F5F4F2,stroke:#78716C,stroke-width:1px,color:#1C1917;
  classDef db fill:#EFEDEA,stroke:#1C1917,stroke-width:1px,color:#1C1917;

  subgraph client["Client (browser tab)"]
    ui["Editor UI<br/>collaborators-presence, collaborators-overlay"]
    cd["${ nodeLabel( 'core-data-bridge' ) }"]
    se["${ nodeLabel( 'sync-engine' ) }"]
  end
  pr["${ nodeLabel( 'php-rest' ) }"]
  db[("wp_postmeta")]:::db

  ui --> cd --> se
  se -->|"poll every 20min"| pr
  pr -->|"updates + awareness"| se
  pr -->|"save"| db
  db -.->|"replay on load"| se
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
</div>`;
}
