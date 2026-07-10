/**
 * Static description of the RTC protocol shape: the client/server/DB
 * topology and the edit->sync->save->reload sequence. Unlike the layer
 * map (src/render/high-level.ts, backed by architecture_snapshot), this
 * doesn't change per merged PR — it's the protocol's structure, not its
 * file contents — so it's checked-in content, not D1-backed, same as
 * the registry.
 */
import { escapeHtml } from './layout';

export function renderTopologySection(): string {
	return `
<div class="section-divider">
  <h2>Client &harr; server topology</h2>
  <p class="desc">Two editors, one server, one storage layer. The server only relays and stores bytes — it never interprets a block.</p>
</div>
<div class="topology-wrap">
  <div class="topology">
    <div class="lane" data-domain="client">
      <div class="lane-head">Client A</div>
      <div class="node">Block editor UI<span class="file">edits &rarr; Redux action</span></div>
      <div class="flowline">&darr;</div>
      <div class="node">core-data<span class="file">applyPostChangesToCRDTDoc</span></div>
      <div class="flowline">&darr;</div>
      <div class="node">sync manager<span class="file">Y.Doc + awareness</span></div>
      <div class="flowline">&darr;</div>
      <div class="node">http-polling-provider<span class="file">batches + polls on interval</span></div>
    </div>
    <div class="lane" data-domain="server">
      <div class="lane-head">Server &middot; REST</div>
      <div class="node">POST /wp-sync/v1/updates<span class="file">WP_HTTP_Polling_Sync_Server</span></div>
      <div class="node">merge awareness<span class="file">30s timeout, per client_id</span></div>
      <div class="node">POST /wp-sync/v1/save<span class="file">WP_Sync_Save_Server</span></div>
      <div class="node">WP_Sync_Config<span class="file">room parsing, permissions</span></div>
    </div>
    <div class="lane" data-domain="db">
      <div class="lane-head">wp_postmeta</div>
      <div class="node">rolling update log<span class="file">per room, compacted &gt;50 updates</span></div>
      <div class="node">_crdt_document<span class="file">update_post_meta on save</span></div>
    </div>
    <div class="lane" data-domain="client">
      <div class="lane-head">Client B</div>
      <div class="node">http-polling-provider<span class="file">receives updates + awareness</span></div>
      <div class="flowline">&darr;</div>
      <div class="node">sync manager<span class="file">Y.applyUpdateV2(update)</span></div>
      <div class="flowline">&darr;</div>
      <div class="node">Block editor UI<span class="file">re-renders blocks + cursor overlay</span></div>
    </div>
  </div>
</div>`;
}

interface SequenceStep {
	actors: Array< 'client' | 'server' | 'db' >;
	text: string;
	note?: string;
}

const STEPS: SequenceStep[] = [
	{
		actors: [ 'client' ],
		text: 'Typing in a block fires a Redux action; core-data converts it into a Yjs mutation on the local Y.Doc, tagged with origin gutenberg.',
	},
	{
		actors: [ 'client', 'server' ],
		text: "On the next polling tick, the provider batches the pending update plus current awareness state (cursor, selection) and posts it to /wp-sync/v1/updates with a cursor marking what it's already seen.",
	},
	{
		actors: [ 'server', 'db' ],
		text: "The server merges awareness state, appends the update to the room's log in wp_postmeta, and — if this client has the lowest client ID — may flag it as compactor once the log passes 50 entries.",
	},
	{
		actors: [ 'server', 'client' ],
		text: "On Client B's own polling tick, the same endpoint returns every update stored since B's cursor, plus the merged awareness map. B's sync manager applies it via Y.applyUpdateV2 and the editor re-renders — including A's cursor in the collaborators overlay.",
	},
	{
		actors: [ 'client', 'server', 'db' ],
		text: 'When A clicks Save (or an autosave fires), the current doc state is serialized and posted to /wp-sync/v1/save, which writes it straight to post meta.',
		note: "update_post_meta( $post_id, '_crdt_document', $doc )",
	},
	{
		actors: [ 'db', 'client' ],
		text: 'Next time the post is opened, _applyPersistedCrdtDoc reads _crdt_document and replays it into a fresh Y.Doc via Y.applyUpdateV2 — unconditionally, with no check for whether that snapshot was ever confirmed saved.',
	},
];

const ACTOR_LABEL: Record< SequenceStep[ 'actors' ][ number ], string > = {
	client: 'Client',
	server: 'Server',
	db: 'DB',
};

export function renderSequenceSection(): string {
	const steps = STEPS.map( ( step ) => {
		const chips = step.actors
			.map(
				( a ) => `<span class="chip actor-${ a }">${ ACTOR_LABEL[ a ] }</span>`
			)
			.join( '' );
		return `<div class="step">
  <div class="step-meta">${ chips }</div>
  <p>${ escapeHtml( step.text ) }</p>
  ${ step.note ? `<div class="note">${ escapeHtml( step.note ) }</div>` : '' }
</div>`;
	} ).join( '' );

	return `
<div class="section-divider">
  <h2>Edit &rarr; sync &rarr; save &rarr; reload</h2>
  <p class="desc">One keystroke's full round trip, plus what happens the next time the post is opened.</p>
</div>
<div class="timeline">${ steps }</div>`;
}
