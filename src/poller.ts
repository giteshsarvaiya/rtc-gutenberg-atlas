import type { Env } from './types';
import { matchFile } from './registry';
import {
	MAX_PRS_PER_RUN,
	getLatestGutenbergRelease,
	getPullFiles,
	getPullMergedAt,
	searchMergedPRsSince,
} from './github';
import { extractFileFacts } from './extractor';

export interface PollResult {
	bootstrapped: boolean;
	candidatesSeen: number;
	prsMatched: number;
	filesUpdated: number;
}

async function getCheckpoint( env: Env ): Promise< string | null > {
	const row = await env.DB.prepare(
		'SELECT last_merged_at FROM checkpoint WHERE id = 1'
	).first< { last_merged_at: string | null } >();
	return row?.last_merged_at ?? null;
}

/** Set once, at bootstrap, and never touched again — this is what "tracking
 * since <date>" on the timeline page reflects, distinct from last_merged_at
 * which keeps advancing as PRs are processed. */
async function bootstrapCheckpoint( env: Env, now: string ): Promise< void > {
	await env.DB.prepare(
		`INSERT INTO checkpoint (id, last_merged_at, started_at, updated_at) VALUES (1, ?1, ?1, datetime('now'))`
	)
		.bind( now )
		.run();
}

async function advanceCheckpoint( env: Env, lastMergedAt: string ): Promise< void > {
	await env.DB.prepare(
		`UPDATE checkpoint SET last_merged_at = ?1, updated_at = datetime('now') WHERE id = 1`
	)
		.bind( lastMergedAt )
		.run();
}

/** Refreshes the cached Gutenberg version shown in the footer. Best-effort:
 * failures are swallowed so a GitHub hiccup on this lookup never blocks the
 * actual PR-tracking poll cycle. */
async function refreshGutenbergVersion( env: Env ): Promise< void > {
	const release = await getLatestGutenbergRelease( env );
	if ( ! release ) return;
	await env.DB.prepare(
		`UPDATE checkpoint SET gutenberg_version = ?1, gutenberg_version_url = ?2 WHERE id = 1`
	)
		.bind( release.tag_name, release.html_url )
		.run();
}

/**
 * Runs one poll cycle: finds newly merged PRs touching RTC paths, extracts
 * facts, and writes them to D1. On the very first run (no checkpoint yet)
 * it bootstraps the checkpoint to "now" and does nothing else — this
 * deliberately avoids backfilling Gutenberg's entire PR history against an
 * unauthenticated GitHub rate limit.
 */
export async function pollOnce( env: Env ): Promise< PollResult > {
	const existingCheckpoint = await getCheckpoint( env );

	if ( ! existingCheckpoint ) {
		const now = new Date().toISOString();
		await bootstrapCheckpoint( env, now );
		await refreshGutenbergVersion( env );
		return {
			bootstrapped: true,
			candidatesSeen: 0,
			prsMatched: 0,
			filesUpdated: 0,
		};
	}

	await refreshGutenbergVersion( env );

	const candidates = await searchMergedPRsSince( existingCheckpoint, env );
	let prsMatched = 0;
	let filesUpdated = 0;
	let latestMergedAt = existingCheckpoint;

	for ( const candidate of candidates.slice( 0, MAX_PRS_PER_RUN ) ) {
		const alreadySeen = await env.DB.prepare(
			'SELECT 1 FROM timeline WHERE pr_number = ?1'
		)
			.bind( candidate.number )
			.first();
		if ( alreadySeen ) {
			continue;
		}

		const mergedAt = await getPullMergedAt( candidate.number, env );
		if ( ! mergedAt ) {
			continue; // closed but not actually merged
		}
		if ( mergedAt > latestMergedAt ) {
			latestMergedAt = mergedAt;
		}
		if ( mergedAt <= existingCheckpoint ) {
			continue; // already covered by a prior run
		}

		const files = await getPullFiles( candidate.number, env );
		const matches = files
			.map( ( file ) => ( { file, match: matchFile( file.filename ) } ) )
			.filter(
				(
					x
				): x is {
					file: ( typeof files )[ number ];
					match: NonNullable< ReturnType< typeof matchFile > >;
				} => Boolean( x.match )
			);

		if ( matches.length === 0 ) {
			continue; // not RTC-relevant
		}

		const touchedComponents = new Set< string >();
		let firstSummary: string | null = null;

		for ( const { file, match } of matches ) {
			const facts = await extractFileFacts(
				env,
				match.component,
				file.filename,
				file.patch
			);
			touchedComponents.add( match.component.id );
			firstSummary ??= facts.summary;

			await env.DB.prepare(
				`INSERT INTO file_facts
					(path, component, summary, symbols_added, symbols_removed, symbols_changed, last_pr_number, updated_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
				 ON CONFLICT(path) DO UPDATE SET
					component = excluded.component,
					summary = excluded.summary,
					symbols_added = excluded.symbols_added,
					symbols_removed = excluded.symbols_removed,
					symbols_changed = excluded.symbols_changed,
					last_pr_number = excluded.last_pr_number,
					updated_at = excluded.updated_at`
			)
				.bind(
					file.filename,
					match.component.id,
					facts.summary,
					JSON.stringify( facts.symbols_added ),
					JSON.stringify( facts.symbols_removed ),
					JSON.stringify( facts.symbols_changed ),
					candidate.number
				)
				.run();
			filesUpdated++;

			// Keep the component's file list current — this is the only
			// thing that changes the high-level layer map.
			const snapshot = await env.DB.prepare(
				'SELECT files FROM architecture_snapshot WHERE component = ?1'
			)
				.bind( match.component.id )
				.first< { files: string } >();
			if ( snapshot ) {
				const currentFiles: string[] = JSON.parse( snapshot.files );
				if ( ! currentFiles.includes( file.filename ) ) {
					currentFiles.push( file.filename );
					await env.DB.prepare(
						`UPDATE architecture_snapshot SET files = ?1, updated_at = datetime('now') WHERE component = ?2`
					)
						.bind(
							JSON.stringify( currentFiles ),
							match.component.id
						)
						.run();
				}
			}
		}

		await env.DB.prepare(
			`INSERT INTO timeline (pr_number, title, url, merged_at, components, summary, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`
		)
			.bind(
				candidate.number,
				candidate.title,
				candidate.html_url,
				mergedAt,
				JSON.stringify( [ ...touchedComponents ] ),
				firstSummary
			)
			.run();
		prsMatched++;
	}

	if ( latestMergedAt !== existingCheckpoint ) {
		await advanceCheckpoint( env, latestMergedAt );
	}

	return {
		bootstrapped: false,
		candidatesSeen: candidates.length,
		prsMatched,
		filesUpdated,
	};
}
