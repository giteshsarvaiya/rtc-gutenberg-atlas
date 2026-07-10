import type { Env } from '../types';
import { fetchTimelineRows } from './timeline';

function xmlEscape( s: string ): string {
	return s
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

const SITE_URL = 'https://rtc-atlas.example.workers.dev'; // replace after first deploy

export async function renderFeed( env: Env ): Promise< string > {
	const rows = await fetchTimelineRows( env, 50 );

	const items = rows
		.map(
			( row ) => `  <entry>
    <title>${ xmlEscape( `#${ row.pr_number } ${ row.title }` ) }</title>
    <link href="${ xmlEscape( row.url ) }"/>
    <id>${ xmlEscape( row.url ) }</id>
    <updated>${ row.merged_at }</updated>
    <summary>${ xmlEscape( row.summary ?? 'No summary available.' ) }</summary>
  </entry>`
		)
		.join( '\n' );

	const updated = rows[ 0 ]?.merged_at ?? new Date().toISOString();

	return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>RTC Atlas — Gutenberg Real-Time Collaboration architecture changes</title>
  <link href="${ SITE_URL }/feed.xml" rel="self"/>
  <link href="${ SITE_URL }/"/>
  <id>${ SITE_URL }/</id>
  <updated>${ updated }</updated>
${ items }
</feed>`;
}
