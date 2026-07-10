import type { Env } from '../types';
import { REGISTRY } from '../registry';
import { escapeHtml, page } from './layout';

interface FactRow {
	path: string;
	component: string;
	summary: string | null;
	symbols_added: string;
	symbols_removed: string;
	symbols_changed: string;
	last_pr_number: number | null;
}

function symbolLine( label: string, json: string ): string {
	const arr: string[] = JSON.parse( json || '[]' );
	if ( arr.length === 0 ) return '';
	return `${ label }: ${ arr.map( escapeHtml ).join( ', ' ) }`;
}

export async function renderLowLevel( env: Env ): Promise< string > {
	const { results } = await env.DB.prepare(
		'SELECT path, component, summary, symbols_added, symbols_removed, symbols_changed, last_pr_number FROM file_facts ORDER BY component, path'
	).all< FactRow >();

	const byComponent = new Map< string, FactRow[] >();
	for ( const row of results ?? [] ) {
		if ( ! byComponent.has( row.component ) ) byComponent.set( row.component, [] );
		byComponent.get( row.component )!.push( row );
	}

	const groups = REGISTRY.map( ( component ) => {
		const rows = byComponent.get( component.id ) ?? [];
		const cards = rows
			.map( ( row ) => {
				const symbolBits = [
					symbolLine( 'added', row.symbols_added ),
					symbolLine( 'removed', row.symbols_removed ),
					symbolLine( 'changed', row.symbols_changed ),
				].filter( Boolean );
				return `<div class="file-card">
  <div class="path">${ escapeHtml( row.path ) }</div>
  ${ row.summary ? `<p class="fsummary">${ escapeHtml( row.summary ) }</p>` : '' }
  ${ symbolBits.length ? `<div class="symbols">${ symbolBits.join( ' · ' ) }</div>` : '' }
  ${ row.last_pr_number ? `<div class="symbols">Last touched in PR #${ row.last_pr_number }</div>` : '' }
</div>`;
			} )
			.join( '' );

		return `<div class="file-group">
  <h3>${ escapeHtml( component.label ) }</h3>
  <p class="desc">${ escapeHtml( component.description ) }</p>
  ${ cards || '<p class="empty">No tracked changes yet.</p>' }
</div>`;
	} ).join( '' );

	const body = `
<p style="max-width: 62ch;">Per-file facts extracted from merged PRs — one row per
watched file, updated in place as new changes land. Grouped by the same components
shown on the <a href="/">layer map</a>.</p>
${ groups }`;

	return page( env, 'Files & components', '/low-level', body );
}
