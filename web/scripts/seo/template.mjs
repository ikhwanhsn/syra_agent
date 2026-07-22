/**
 * CSP-safe HTML template for Syra programmatic SEO pages.
 * Inline styles only (web/vercel.json CSP: style-src 'self' 'unsafe-inline' + Google Fonts).
 * No external scripts.
 */

export const SITE_ORIGIN = "https://www.syraa.fun";
export const DOCS_ORIGIN = "https://docs.syraa.fun";
export const API_ORIGIN = "https://api.syraa.fun";

const OG_IMAGE = `${SITE_ORIGIN}/images/og-banner.png`;

/** Escape text for HTML body / attributes. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function breadcrumbJsonLd(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_ORIGIN}${item.url}`,
    })),
  };
}

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.canonicalPath - e.g. /tools/news/
 * @param {string} opts.heading
 * @param {string} opts.eyebrow
 * @param {Array<{name: string, url: string}>} opts.breadcrumbs
 * @param {string} opts.bodyHtml - trusted HTML fragments built by the generator
 * @param {string} [opts.jsonLdType]
 * @param {object} [opts.extraJsonLd]
 * @param {Array<{href: string, label: string}>} [opts.related]
 * @param {string} [opts.primaryCtaHref]
 * @param {string} [opts.primaryCtaLabel]
 * @param {string} [opts.secondaryCtaHref]
 * @param {string} [opts.secondaryCtaLabel]
 */
export function renderSeoPage({
  title,
  description,
  canonicalPath,
  heading,
  eyebrow,
  breadcrumbs,
  bodyHtml,
  jsonLdType = "TechArticle",
  extraJsonLd = {},
  related = [],
  primaryCtaHref = "/marketplace",
  primaryCtaLabel = "Open marketplace",
  secondaryCtaHref = `${DOCS_ORIGIN}/docs/build/mcp`,
  secondaryCtaLabel = "Install MCP",
}) {
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const canonical = `${SITE_ORIGIN}${path.endsWith("/") ? path : `${path}/`}`;
  const fullTitle = title.includes("Syra") ? title : `${title} | Syra`;

  const graph = [
    {
      "@type": jsonLdType,
      "@id": `${canonical}#page`,
      headline: heading,
      name: heading,
      description,
      url: canonical,
      image: OG_IMAGE,
      author: { "@type": "Organization", name: "Syra", url: SITE_ORIGIN },
      publisher: {
        "@type": "Organization",
        name: "Syra",
        url: SITE_ORIGIN,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_ORIGIN}/android-chrome-512x512.png`,
        },
      },
      ...extraJsonLd,
    },
    breadcrumbJsonLd([{ name: "Home", url: "/" }, ...breadcrumbs]),
  ];

  const relatedHtml =
    related.length > 0
      ? `<section class="related">
          <h2>Related</h2>
          <ul>
            ${related
              .map(
                (r) =>
                  `<li><a href="${escapeHtml(r.href)}">${escapeHtml(r.label)}</a></li>`,
              )
              .join("\n            ")}
          </ul>
        </section>`
      : "";

  const crumbsHtml = breadcrumbs
    .map((b, i) => {
      const url = b.url.startsWith("http") ? b.url : `${SITE_ORIGIN}${b.url}`;
      const sep = i === 0 ? "" : `<span class="sep">/</span>`;
      return `${sep}<a href="${escapeHtml(url)}">${escapeHtml(b.name)}</a>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="theme-color" content="#0a0a0f" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=3" />
  <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" />
  <meta property="og:site_name" content="Syra" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(OG_IMAGE)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@syra_agent" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0a0a0f;
      --fg: #f4f4f5;
      --muted: #a1a1aa;
      --card: #12121a;
      --border: #27272a;
      --accent: #a78bfa;
      --accent-2: #34d399;
      --radius: 12px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      font-family: Inter, system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 24px 20px 64px; }
    header.site {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; padding: 16px 0 28px; border-bottom: 1px solid var(--border);
      margin-bottom: 28px;
    }
    .logo {
      font-family: "Space Grotesk", Inter, sans-serif;
      font-weight: 700; font-size: 1.15rem; color: var(--fg); letter-spacing: -0.02em;
    }
    .logo span { color: var(--accent); }
    nav.top a { margin-left: 14px; font-size: 0.875rem; color: var(--muted); }
    nav.top a:hover { color: var(--fg); }
    .crumbs { font-size: 0.8rem; color: var(--muted); margin-bottom: 16px; }
    .crumbs .sep { margin: 0 6px; opacity: 0.5; }
    .crumbs a { color: var(--muted); }
    .eyebrow {
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent-2);
      margin-bottom: 10px;
    }
    h1 {
      font-family: "Space Grotesk", Inter, sans-serif;
      font-size: clamp(1.6rem, 4vw, 2.15rem); line-height: 1.2;
      letter-spacing: -0.03em; margin: 0 0 12px;
    }
    .lede { color: var(--muted); font-size: 1.05rem; margin: 0 0 28px; }
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px 22px; margin: 20px 0;
    }
    h2 { font-size: 1.15rem; margin: 28px 0 10px; letter-spacing: -0.02em; }
    h3 { font-size: 1rem; margin: 18px 0 8px; }
    p { margin: 0 0 14px; }
    ul, ol { margin: 0 0 16px; padding-left: 1.25rem; color: var(--muted); }
    li { margin-bottom: 6px; }
    li strong { color: var(--fg); }
    code, pre {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.82rem;
    }
    code {
      background: #1a1a24; border: 1px solid var(--border);
      border-radius: 6px; padding: 1px 6px; color: #e4e4e7;
    }
    pre {
      background: #1a1a24; border: 1px solid var(--border);
      border-radius: var(--radius); padding: 14px 16px; overflow-x: auto;
      color: #e4e4e7; line-height: 1.5; margin: 12px 0 20px;
    }
    .ctas { display: flex; flex-wrap: wrap; gap: 10px; margin: 28px 0 8px; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 16px; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
      text-decoration: none !important; min-height: 44px;
    }
    .btn-primary { background: var(--accent); color: #0a0a0f; }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-secondary {
      background: transparent; color: var(--fg); border: 1px solid var(--border);
    }
    .btn-secondary:hover { border-color: var(--muted); }
    .pill {
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      padding: 4px 10px; border-radius: 999px; background: #1a1a24;
      border: 1px solid var(--border); color: var(--muted); margin-right: 8px;
    }
    .grid-list { list-style: none; padding: 0; margin: 0; }
    .grid-list li {
      border-bottom: 1px solid var(--border); padding: 12px 0;
      display: flex; flex-direction: column; gap: 4px;
    }
    .grid-list li a { font-weight: 600; color: var(--fg); }
    .grid-list .meta { font-size: 0.85rem; color: var(--muted); }
    .related ul { color: var(--muted); }
    footer.site {
      margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border);
      font-size: 0.8rem; color: var(--muted);
    }
    footer.site a { color: var(--muted); margin-right: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="site">
      <a class="logo" href="${SITE_ORIGIN}/">Syra <span>-</span> Machine Money</a>
      <nav class="top" aria-label="Primary">
        <a href="/tools/">Tools</a>
        <a href="/apis/">APIs</a>
        <a href="/vs/">Compare</a>
        <a href="/pricing/">Pricing</a>
        <a href="/marketplace">Marketplace</a>
      </nav>
    </header>

    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${SITE_ORIGIN}/">Home</a>${crumbsHtml ? `<span class="sep">/</span>${crumbsHtml}` : ""}
    </nav>

    <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h1>${escapeHtml(heading)}</h1>
    <p class="lede">${escapeHtml(description)}</p>

    <div class="ctas">
      <a class="btn btn-primary" href="${escapeHtml(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a>
      <a class="btn btn-secondary" href="${escapeHtml(secondaryCtaHref)}">${escapeHtml(secondaryCtaLabel)}</a>
    </div>

    ${bodyHtml}

    ${relatedHtml}

    <div class="ctas">
      <a class="btn btn-primary" href="${escapeHtml(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a>
      <a class="btn btn-secondary" href="/agent">Open agent chat</a>
    </div>

    <footer class="site">
      <p>Syra - Machine Money for Agents. Live today: pay-per-call crypto APIs over x402.</p>
      <p>
        <a href="${DOCS_ORIGIN}">Docs</a>
        <a href="${API_ORIGIN}/openapi.json">OpenAPI</a>
        <a href="https://x.com/syra_agent">@syra_agent</a>
        <a href="/privacy">Privacy</a>
      </p>
    </footer>
  </div>
</body>
</html>
`;
}
