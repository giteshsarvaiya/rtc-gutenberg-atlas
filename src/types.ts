export interface Env {
	DB: D1Database;
	AI: Ai;
	DEBUG_TOKEN?: string;
	GITHUB_TOKEN?: string; // optional, unset for v1 (unauthenticated)
}

export interface GitHubPullSearchItem {
	number: number;
	title: string;
	html_url: string;
	pull_request?: { merged_at?: string | null };
}

export interface GitHubPullFile {
	filename: string;
	status: string;
	patch?: string;
}

export interface ExtractedFacts {
	summary: string | null;
	symbols_added: string[];
	symbols_removed: string[];
	symbols_changed: string[];
}
