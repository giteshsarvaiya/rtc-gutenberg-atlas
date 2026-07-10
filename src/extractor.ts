import type { Env, ExtractedFacts } from './types';
import type { RegistryComponent } from './registry';

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You summarize a single file's diff from a WordPress Gutenberg pull request \
for a technical architecture tracker. You are told which known architectural \
component the file belongs to — never invent a different one. \
Respond with ONLY a JSON object, no prose, no markdown fences, matching exactly:
{"summary": string (one sentence, what changed and why it matters, or null if the diff is unclear), \
"symbols_added": string[] (function/class/const names newly introduced), \
"symbols_removed": string[] (function/class/const names deleted), \
"symbols_changed": string[] (function/class/const names whose body changed but name stayed)}
If the diff doesn't let you tell, return empty arrays and a null summary. Do not fabricate symbol names \
that don't appear in the diff.`;

function parseModelJson( raw: string ): ExtractedFacts | null {
	// Models sometimes wrap JSON in ```json fences despite instructions.
	const stripped = raw
		.trim()
		.replace( /^```(?:json)?/i, '' )
		.replace( /```$/, '' )
		.trim();

	try {
		const parsed = JSON.parse( stripped );
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			! Array.isArray( parsed.symbols_added ) ||
			! Array.isArray( parsed.symbols_removed ) ||
			! Array.isArray( parsed.symbols_changed )
		) {
			return null;
		}
		return {
			summary:
				typeof parsed.summary === 'string' ? parsed.summary : null,
			symbols_added: parsed.symbols_added.filter(
				( s: unknown ) => typeof s === 'string'
			),
			symbols_removed: parsed.symbols_removed.filter(
				( s: unknown ) => typeof s === 'string'
			),
			symbols_changed: parsed.symbols_changed.filter(
				( s: unknown ) => typeof s === 'string'
			),
		};
	} catch {
		return null;
	}
}

const EMPTY_FACTS: ExtractedFacts = {
	summary: null,
	symbols_added: [],
	symbols_removed: [],
	symbols_changed: [],
};

/**
 * Extracts structured, grounded facts about one file's diff. Never invents a
 * component (the caller already resolved that via the registry) — only
 * describes what the diff itself shows. Falls back to EMPTY_FACTS rather
 * than fabricating a summary when the model output is missing or malformed.
 */
export async function extractFileFacts(
	env: Env,
	component: RegistryComponent,
	filePath: string,
	patch: string | undefined
): Promise< ExtractedFacts > {
	if ( ! patch ) {
		return {
			...EMPTY_FACTS,
			summary: 'Diff too large or binary to summarize.',
		};
	}

	// Diffs can be huge; cap what we send to keep the call cheap and fast.
	const truncatedPatch =
		patch.length > 6000 ? patch.slice( 0, 6000 ) + '\n… (truncated)' : patch;

	const userPrompt = `Component: ${ component.label } (${ component.description })
File: ${ filePath }

Diff:
${ truncatedPatch }`;

	try {
		const response = await env.AI.run( MODEL, {
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: userPrompt },
			],
		} );

		const text =
			typeof response === 'object' &&
			response !== null &&
			'response' in response
				? String( ( response as { response: unknown } ).response )
				: String( response );

		return parseModelJson( text ) ?? EMPTY_FACTS;
	} catch {
		return EMPTY_FACTS;
	}
}
