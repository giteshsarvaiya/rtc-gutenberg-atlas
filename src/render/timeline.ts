import type { Env } from '../types';
import { REGISTRY } from '../registry';
import { escapeHtml, page } from './layout';

export interface TimelineRow {
	pr_number: number;
	title: string;
	url: string;
	merged_at: string;
	components: string;
	summary: string | null;
}

const LABELS = new Map( REGISTRY.map( ( c ) => [ c.id, c.label ] ) );

export async function fetchTimelineRows( env: Env, limit = 100 ): Promise< TimelineRow[] > {
	const { results } = await env.DB.prepare(
		'SELECT pr_number, title, url, merged_at, components, summary FROM timeline ORDER BY merged_at DESC LIMIT ?1'
	)
		.bind( limit )
		.all< TimelineRow >();
	return results ?? [];
}

export async function renderTimeline( env: Env ): Promise< string > {
	const rows = await fetchTimelineRows( env );

	const steps = rows
		.map( ( row ) => {
			const components: string[] = JSON.parse( row.components );
			const chips = components
				.map(
					( id ) =>
						`<span class="chip ${ id }">${ escapeHtml( LABELS.get( id ) ?? id ) }</span>`
				)
				.join( '' );
			return `<div class="step">
  <div class="step-meta">${ chips }<time datetime="${ row.merged_at }">${ row.merged_at.slice( 0, 10 ) }</time></div>
  <p><a class="pr-link" href="${ row.url }" target="_blank" rel="noopener">#${ row.pr_number } ${ escapeHtml( row.title ) }</a></p>
  ${ row.summary ? `<p class="summary">${ escapeHtml( row.summary ) }</p>` : '' }
</div>`;
		} )
		.join( '' );

	const body = `
<p style="max-width: 62ch;">Every merged PR that touched an RTC-watched file, newest
first. Subscribe via <a href="/feed.xml">RSS</a> to get notified as the architecture
changes.</p>
<div class="timeline">${ steps || '<p class="empty">No RTC-relevant merges recorded yet.</p>' }</div>`;

	return page( 'Timeline', '/timeline', body );
}
