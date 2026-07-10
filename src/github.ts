import type { Env, GitHubPullFile, GitHubPullSearchItem } from './types';

const REPO = 'WordPress/gutenberg';
const BASE = 'https://api.github.com';
const USER_AGENT = 'rtc-atlas (+https://github.com/WordPress/gutenberg RTC architecture tracker)';

// Unauthenticated for v1: 60 req/hr core, 10 req/min search. Capped hard
// per run so a 20-minute cron interval never comes close to either limit.
export const MAX_PRS_PER_RUN = 10;

function headers( env: Env ): HeadersInit {
	const h: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'User-Agent': USER_AGENT,
		'X-GitHub-Api-Version': '2022-11-28',
	};
	if ( env.GITHUB_TOKEN ) {
		h.Authorization = `Bearer ${ env.GITHUB_TOKEN }`;
	}
	return h;
}

async function githubFetch< T >( url: string, env: Env ): Promise< T > {
	const res = await fetch( url, { headers: headers( env ) } );
	if ( ! res.ok ) {
		throw new Error(
			`GitHub API error ${ res.status } for ${ url }: ${ await res.text() }`
		);
	}
	return res.json() as Promise< T >;
}

/**
 * Finds PRs merged into trunk since `sinceIso`, oldest first, capped at
 * MAX_PRS_PER_RUN. Does NOT filter by touched files — the poller does that
 * per-PR against the registry, since search can't filter by path.
 */
export async function searchMergedPRsSince(
	sinceIso: string,
	env: Env
): Promise< GitHubPullSearchItem[] > {
	const date = sinceIso.slice( 0, 10 ); // GitHub's merged: qualifier is date-granularity
	const q = encodeURIComponent(
		`repo:${ REPO } is:pr is:merged base:trunk merged:>=${ date }`
	);
	const url = `${ BASE }/search/issues?q=${ q }&sort=created&order=asc&per_page=${ MAX_PRS_PER_RUN }`;
	const result = await githubFetch< { items: GitHubPullSearchItem[] } >(
		url,
		env
	);
	return result.items;
}

/**
 * Confirms the exact merge timestamp for a PR (search results don't always
 * carry it), used to advance the checkpoint precisely instead of by date.
 */
export async function getPullMergedAt(
	prNumber: number,
	env: Env
): Promise< string | null > {
	const pr = await githubFetch< { merged_at: string | null } >(
		`${ BASE }/repos/${ REPO }/pulls/${ prNumber }`,
		env
	);
	return pr.merged_at;
}

/**
 * Lists changed files for a PR, including unified diff patches where GitHub
 * provides one (omitted for very large or binary files).
 */
export async function getPullFiles(
	prNumber: number,
	env: Env
): Promise< GitHubPullFile[] > {
	const url = `${ BASE }/repos/${ REPO }/pulls/${ prNumber }/files?per_page=100`;
	return githubFetch< GitHubPullFile[] >( url, env );
}

export interface GutenbergRelease {
	tag_name: string;
	html_url: string;
}

/**
 * Fetches the latest published Gutenberg release for the footer's version
 * link. Returns null on any failure (e.g. no releases, transient API error)
 * so the poller can just keep whatever version it last cached rather than
 * failing the whole poll cycle over this one non-critical lookup.
 */
export async function getLatestGutenbergRelease(
	env: Env
): Promise< GutenbergRelease | null > {
	try {
		const release = await githubFetch< GutenbergRelease >(
			`${ BASE }/repos/${ REPO }/releases/latest`,
			env
		);
		return release;
	} catch {
		return null;
	}
}
