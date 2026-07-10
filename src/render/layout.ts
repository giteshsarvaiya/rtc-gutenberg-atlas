export function escapeHtml( s: string ): string {
	return s
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' );
}

const NAV = [
	{ href: '/', label: 'Architecture' },
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
  /*
    Palette borrowed deliberately from the texty editor project
    (app/globals.css): warm paper-and-ink, light-only, no color
    accent. This is a single-theme commitment, not a missing
    dark mode — component identity is carried by label + weight,
    not hue.
  */
  :root {
    --bg: #FAFAF8;
    --fg: #1C1917;
    --muted: #78716C;
    --border: #E7E5E4;
    --surface: #F5F4F2;
    --surface-2: #EFEDEA;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--bg); color: var(--fg);
    font-family: "DM Sans", -apple-system, "Segoe UI", sans-serif;
    font-size: 17px; line-height: 1.6; margin: 0; padding: 0 24px 96px;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--fg); text-decoration-color: var(--border); text-underline-offset: 2px; }
  a:hover { text-decoration-color: var(--fg); }
  code { font-family: "DM Mono", ui-monospace, Menlo, Consolas, monospace; background: var(--surface); padding: .1em .4em; border-radius: 3px; font-size: .85em; }
  header.site { max-width: 960px; margin: 0 auto; padding: 40px 0 20px; display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--border); }
  header.site h1 { font-family: "Instrument Serif", Georgia, serif; font-size: 26px; font-style: italic; font-weight: 400; margin: 0; }
  header.site h1 a { color: var(--fg); text-decoration: none; }
  nav.site { display: flex; gap: 6px; flex-wrap: wrap; }
  nav.site a { font-family: "DM Mono", monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; text-decoration: none; color: var(--muted); border: 1px solid var(--border); border-radius: 100px; padding: 6px 14px; transition: color .15s ease, border-color .15s ease, background .15s ease; }
  nav.site a:hover { color: var(--fg); border-color: var(--fg); }
  nav.site a[aria-current="page"] { color: var(--fg); border-color: var(--fg); background: var(--surface); font-weight: 500; }
  main { max-width: 960px; margin: 0 auto; padding-top: 32px; }
  h2 { font-family: "DM Mono", monospace; font-size: 19px; font-weight: 500; letter-spacing: -.01em; }
  table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
  th { font-family: "DM Mono", monospace; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); text-align: left; padding: 0 12px 8px; border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: top; font-size: 14.5px; }
  td:first-child, th:first-child { padding-left: 0; }
  tr:last-child td { border-bottom: none; }

  /* Chips: monochrome by design (texty has no color accent). Component
     identity is carried by the label text itself plus a stepped
     surface tone, not by hue. */
  .chip { font-family: "DM Mono", monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; padding: 3px 9px; border-radius: 100px; display: inline-block; background: var(--surface); color: var(--muted); border: 1px solid var(--border); }

  .empty { color: var(--muted); font-style: italic; padding: 24px 0; font-family: "Instrument Serif", serif; font-size: 18px; }
  footer.site { max-width: 960px; margin: 56px auto 0; padding-top: 20px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-family: "DM Mono", monospace; font-size: 12px; color: var(--muted); }
  footer.site a { color: var(--muted); }
  footer.site a:hover { color: var(--fg); }

  .layers { display: flex; flex-direction: column; gap: 1px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); margin: 16px 0; background: var(--border); }
  .layer { background: var(--bg); padding: 18px 22px; display: grid; grid-template-columns: 180px 1fr; gap: 20px; border-left: 3px solid var(--border); }
  .layer:nth-child(odd) { background: var(--surface); }
  .layer-tag { font-family: "DM Mono", monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; padding-top: 3px; color: var(--fg); }
  .layer-body strong { display: block; font-family: "DM Sans", sans-serif; font-weight: 600; font-size: 15.5px; margin-bottom: 4px; }
  .layer-body .files { font-family: "DM Mono", monospace; font-size: 12px; color: var(--muted); line-height: 1.8; word-break: break-all; }

  .section-divider { margin: 48px 0 24px; padding-top: 24px; border-top: 1px solid var(--border); }
  .section-divider h2 { margin: 0 0 6px; }
  .section-divider .desc { color: var(--muted); font-size: 15px; margin: 0 0 8px; max-width: 62ch; }

  .mermaid-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin: 16px 0; overflow-x: auto; }

  .timeline { position: relative; padding-left: 26px; margin-top: 16px; }
  .timeline::before { content: ""; position: absolute; left: 5px; top: 6px; bottom: 6px; width: 1px; background: var(--border); }
  .step { position: relative; padding-bottom: 22px; }
  .step:last-child { padding-bottom: 0; }
  .step::before { content: ""; position: absolute; left: -26px; top: 4px; width: 9px; height: 9px; border-radius: 50%; background: var(--bg); border: 2px solid var(--fg); }
  .step-meta { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
  .step-meta time { font-family: "DM Mono", monospace; font-size: 11.5px; color: var(--muted); }
  .step p { margin: 0 0 4px; font-size: 15.5px; font-family: "Instrument Serif", Georgia, serif; }
  .step a.pr-link { font-family: "DM Sans", sans-serif; font-weight: 600; text-decoration: none; color: var(--fg); }
  .step .summary { font-size: 14.5px; color: var(--muted); font-family: "DM Sans", sans-serif; }
  .step .note { margin-top: 6px; font-family: "DM Mono", monospace; font-size: 12px; color: var(--muted); background: var(--surface-2); border-radius: 6px; padding: 6px 10px; display: inline-block; }

  .file-group { margin-bottom: 32px; }
  .file-group h3 { font-family: "DM Mono", monospace; font-size: 15px; margin: 0 0 4px; }
  .file-group .desc { color: var(--muted); font-size: 14px; margin: 0 0 14px; font-family: "DM Sans", sans-serif; }
  .file-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .file-card .path { font-family: "DM Mono", monospace; font-size: 12.5px; word-break: break-all; }
  .file-card .fsummary { font-family: "Instrument Serif", Georgia, serif; font-size: 16px; color: var(--fg); margin: 6px 0 0; }
  .file-card .symbols { font-family: "DM Mono", monospace; font-size: 11.5px; color: var(--muted); margin-top: 6px; }
</style>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      background: '#FAFAF8',
      primaryColor: '#F5F4F2',
      primaryBorderColor: '#78716C',
      primaryTextColor: '#1C1917',
      lineColor: '#78716C',
      secondaryColor: '#EFEDEA',
      tertiaryColor: '#FAFAF8',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '14px',
    },
  });
</script>
</head>
<body>
<header class="site">
  <h1><a href="/">RTC Atlas</a></h1>
  <nav class="site">${ nav }</nav>
</header>
<main>
${ body }
</main>
<footer class="site">
  <span>Tracking WordPress/gutenberg · packages/sync, packages/core-data, lib/compat/wordpress-*/class-wp-sync-*</span>
  <a href="https://profiles.wordpress.org/giteshsarvaiya/" target="_blank" rel="noopener">wordpress.org/giteshsarvaiya</a>
</footer>
</body>
</html>`;
}
