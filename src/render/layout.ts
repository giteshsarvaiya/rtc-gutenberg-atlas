export function escapeHtml( s: string ): string {
	return s
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' );
}

const NAV = [
	{ href: '/', label: 'Layer map' },
	{ href: '/low-level', label: 'Files & components' },
	{ href: '/timeline', label: 'Timeline' },
	{ href: '/feed.xml', label: 'RSS' },
];

export function page( title: string, activePath: string, body: string ): string {
	const nav = NAV.map(
		( item ) =>
			`<a href="${ item.href }"${ item.href === activePath ? ' aria-current="page"' : '' }>${ item.label }</a>`
	).join( '' );

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ escapeHtml( title ) } — RTC Atlas</title>
<style>
  :root {
    --bg: #F3F5F6; --surface: #FFFFFF; --border: #DCE2E5;
    --text: #1B2027; --text-muted: #5B6570;
    --accent: #146F67; --accent-soft: #E1F0EE;
    --server: #9C5A22; --server-soft: #F5E9DB;
    --db: #4B4F86; --db-soft: #E9E9F5;
    --code-bg: #EAEDEE;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #12151A; --surface: #191E25; --border: #2A3038;
      --text: #E6E9ED; --text-muted: #96A1AC;
      --accent: #4FC4B8; --accent-soft: rgba(79,196,184,.13);
      --server: #E0A159; --server-soft: rgba(224,161,89,.13);
      --db: #9B9FE0; --db-soft: rgba(155,159,224,.13);
      --code-bg: #1F252D;
    }
  }
  :root[data-theme="dark"] {
    --bg: #12151A; --surface: #191E25; --border: #2A3038;
    --text: #E6E9ED; --text-muted: #96A1AC;
    --accent: #4FC4B8; --accent-soft: rgba(79,196,184,.13);
    --server: #E0A159; --server-soft: rgba(224,161,89,.13);
    --db: #9B9FE0; --db-soft: rgba(155,159,224,.13);
    --code-bg: #1F252D;
  }
  :root[data-theme="light"] {
    --bg: #F3F5F6; --surface: #FFFFFF; --border: #DCE2E5;
    --text: #1B2027; --text-muted: #5B6570;
    --accent: #146F67; --accent-soft: #E1F0EE;
    --server: #9C5A22; --server-soft: #F5E9DB;
    --db: #4B4F86; --db-soft: #E9E9F5;
    --code-bg: #EAEDEE;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--bg); color: var(--text);
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    font-size: 17px; line-height: 1.6; margin: 0; padding: 0 24px 96px;
  }
  a { color: var(--accent); }
  code { font-family: ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace; background: var(--code-bg); padding: .1em .4em; border-radius: 3px; font-size: .85em; }
  header.site { max-width: 960px; margin: 0 auto; padding: 40px 0 20px; display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  header.site h1 { font-family: ui-monospace, "JetBrains Mono", monospace; font-size: 18px; margin: 0; }
  header.site h1 a { color: var(--text); text-decoration: none; }
  nav.site { display: flex; gap: 6px; flex-wrap: wrap; }
  nav.site a { font-family: ui-monospace, monospace; font-size: 12.5px; text-transform: uppercase; letter-spacing: .06em; text-decoration: none; color: var(--text-muted); border: 1px solid var(--border); border-radius: 100px; padding: 6px 14px; }
  nav.site a[aria-current="page"] { color: var(--accent); border-color: var(--accent); }
  main { max-width: 960px; margin: 0 auto; }
  h2 { font-family: ui-monospace, monospace; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
  th { font-family: ui-monospace, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); text-align: left; padding: 0 12px 8px; border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: top; font-family: -apple-system, "Segoe UI", sans-serif; font-size: 14.5px; }
  td:first-child, th:first-child { padding-left: 0; }
  tr:last-child td { border-bottom: none; }
  .chip { font-family: ui-monospace, monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; padding: 3px 8px; border-radius: 100px; display: inline-block; }
  .chip.editor-ui, .chip.core-data-bridge, .chip.sync-engine { background: var(--accent-soft); color: var(--accent); }
  .chip.php-rest { background: var(--server-soft); color: var(--server); }
  .chip.db-footprint { background: var(--db-soft); color: var(--db); }
  .empty { color: var(--text-muted); font-style: italic; padding: 24px 0; }
  footer.site { max-width: 960px; margin: 48px auto 0; font-family: ui-monospace, monospace; font-size: 12px; color: var(--text-muted); }

  .layers { display: flex; flex-direction: column; gap: 2px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04); margin: 16px 0; }
  .layer { background: var(--surface); border: 1px solid var(--border); padding: 18px 22px; display: grid; grid-template-columns: 180px 1fr; gap: 20px; }
  .layer + .layer { border-top: none; }
  .layer-tag { font-family: ui-monospace, monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; padding-top: 3px; color: var(--accent); }
  .layer-tag.php-rest { color: var(--server); }
  .layer-tag.db-footprint { color: var(--db); }
  .layer-body strong { display: block; font-family: -apple-system, "Segoe UI", sans-serif; font-size: 15.5px; margin-bottom: 4px; }
  .layer-body .files { font-family: ui-monospace, monospace; font-size: 12px; color: var(--text-muted); line-height: 1.8; word-break: break-all; }

  .timeline { position: relative; padding-left: 26px; margin-top: 16px; }
  .timeline::before { content: ""; position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px; background: var(--border); }
  .step { position: relative; padding-bottom: 22px; }
  .step:last-child { padding-bottom: 0; }
  .step::before { content: ""; position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--surface); border: 2px solid var(--accent); }
  .step-meta { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
  .step-meta time { font-family: ui-monospace, monospace; font-size: 11.5px; color: var(--text-muted); }
  .step p { margin: 0 0 4px; font-size: 15.5px; }
  .step a.pr-link { font-family: -apple-system, "Segoe UI", sans-serif; font-weight: 600; text-decoration: none; }
  .step .summary { font-size: 14.5px; color: var(--text-muted); font-family: -apple-system, "Segoe UI", sans-serif; }

  .file-group { margin-bottom: 32px; }
  .file-group h3 { font-family: ui-monospace, monospace; font-size: 15px; margin: 0 0 4px; }
  .file-group .desc { color: var(--text-muted); font-size: 14px; margin: 0 0 14px; font-family: -apple-system, "Segoe UI", sans-serif; }
  .file-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .file-card .path { font-family: ui-monospace, monospace; font-size: 12.5px; word-break: break-all; }
  .file-card .fsummary { font-family: -apple-system, "Segoe UI", sans-serif; font-size: 14px; color: var(--text); margin: 6px 0 0; }
  .file-card .symbols { font-family: ui-monospace, monospace; font-size: 11.5px; color: var(--text-muted); margin-top: 6px; }
</style>
</head>
<body>
<header class="site">
  <h1><a href="/">RTC Atlas</a></h1>
  <nav class="site">${ nav }</nav>
</header>
<main>
${ body }
</main>
<footer class="site">Tracking WordPress/gutenberg · packages/sync, packages/core-data, lib/compat/wordpress-*/class-wp-sync-*</footer>
</body>
</html>`;
}
