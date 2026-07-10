import type { Env } from './types';
import { pollOnce } from './poller';
import { renderHighLevel } from './render/high-level';
import { renderLowLevel } from './render/low-level';
import { renderTimeline } from './render/timeline';
import { renderFeed } from './render/feed';

function html( body: string, status = 200 ): Response {
	return new Response( body, {
		status,
		headers: { 'content-type': 'text/html; charset=utf-8' },
	} );
}

export default {
	async fetch( request: Request, env: Env ): Promise< Response > {
		const url = new URL( request.url );

		switch ( url.pathname ) {
			case '/':
				return html( await renderHighLevel( env ) );
			case '/low-level':
				return html( await renderLowLevel( env ) );
			case '/timeline':
				return html( await renderTimeline( env ) );
			case '/feed.xml':
				return new Response( await renderFeed( env ), {
					headers: {
						'content-type': 'application/atom+xml; charset=utf-8',
					},
				} );
			case '/debug/poll': {
				// Manual trigger for local/staging verification. Guarded by a
				// secret so it can't be used to burn AI/GitHub quota in prod.
				if (
					! env.DEBUG_TOKEN ||
					url.searchParams.get( 'token' ) !== env.DEBUG_TOKEN
				) {
					return new Response( 'Not found', { status: 404 } );
				}
				const result = await pollOnce( env );
				return new Response( JSON.stringify( result, null, 2 ), {
					headers: { 'content-type': 'application/json' },
				} );
			}
			default:
				return html( '<p>Not found. <a href="/">Back to the layer map</a>.</p>', 404 );
		}
	},

	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise< void > {
		ctx.waitUntil( pollOnce( env ).then( () => undefined ) );
	},
};
