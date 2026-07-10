import type { Env } from '../types';
import { REGISTRY } from '../registry';
import { escapeHtml, page } from './layout';
import { renderMermaidArchitecture } from './mermaid-diagram';

interface SnapshotRow {
	component: string;
	label: string;
	description: string;
	files: string;
}

export async function renderHighLevel( env: Env ): Promise< string > {
	const { results } = await env.DB.prepare(
		'SELECT component, label, description, files FROM architecture_snapshot'
	).all< SnapshotRow >();

	const byId = new Map( ( results ?? [] ).map( ( r ) => [ r.component, r ] ) );
	// Order by the registry's declared order, plus any component the
	// registry doesn't know about (e.g. the seeded db-footprint row) last.
	const orderedIds = [
		...REGISTRY.map( ( c ) => c.id ),
		...[ ...byId.keys() ].filter(
			( id ) => ! REGISTRY.some( ( c ) => c.id === id )
		),
	];

	const layers = orderedIds
		.map( ( id ) => byId.get( id ) )
		.filter( ( r ): r is SnapshotRow => Boolean( r ) )
		.map( ( row ) => {
			const files: string[] = JSON.parse( row.files );
			return `<div class="layer">
  <div class="layer-tag ${ row.component }">${ escapeHtml( row.label ) }</div>
  <div class="layer-body">
    <strong>${ escapeHtml( row.description ) }</strong>
    <div class="files">${ files.map( escapeHtml ).join( '<br>' ) }</div>
  </div>
</div>`;
		} )
		.join( '' );

	const mermaidSection = await renderMermaidArchitecture( env );

	const body = `
${ mermaidSection }
<div class="section-divider">
  <h2>Components</h2>
  <p class="desc">The same five components, as a reference list. This updates automatically
  whenever a merged PR touches a watched file — see the <a href="/timeline">timeline</a> for
  what changed and when, or <a href="/low-level">files &amp; components</a> for per-file detail.</p>
</div>
<div class="layers">${ layers || '<p class="empty">No data yet — waiting on the first poll.</p>' }</div>`;

	return page( env, 'Architecture', '/', body );
}
