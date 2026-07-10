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

async function fetchTrackingStartedAt( env: Env ): Promise< string | null > {
	const row = await env.DB.prepare(
		'SELECT started_at FROM checkpoint WHERE id = 1'
	).first< { started_at: string | null } >();
	return row?.started_at ?? null;
}

function formatDate( iso: string ): string {
	return new Date( iso ).toLocaleString( 'en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC',
	} ) + ' UTC';
}

export async function renderTimeline( env: Env ): Promise< string > {
	const [ rows, startedAt ] = await Promise.all( [
		fetchTimelineRows( env ),
		fetchTrackingStartedAt( env ),
	] );

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

	const trackingNote = startedAt
		? `Tracking merges since <strong>${ escapeHtml( formatDate( startedAt ) ) }</strong> — anything merged before that date won't appear here.`
		: 'Tracking hasn’t started yet.';

	const body = `
<p style="max-width: 62ch;">Every merged PR that touched an RTC-watched file, newest
first. Subscribe via <a href="/feed.xml">RSS</a> to get notified as the architecture
changes.</p>
<p class="mermaid-hint" style="margin: 0 0 20px;">${ trackingNote }</p>
<div class="timeline">${ steps || '<p class="empty">No RTC-relevant merges recorded yet — check back after the next 20-minute poll, or once a real RTC-touching PR merges upstream.</p>' }</div>`;

	return page( env, 'Timeline', '/timeline', body );
}
