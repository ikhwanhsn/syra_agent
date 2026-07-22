/**
 * Build-time programmatic SEO page generator for Syra.
 *
 * Emits static HTML under web/public/{tools,apis,vs,pricing}/ so Vercel
 * serves real files before the SPA rewrite in web/vercel.json.
 *
 * Run: node scripts/seo/generate.mjs
 * Wired as part of web/package.json prebuild.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_ORIGIN,
  DOCS_ORIGIN,
  API_ORIGIN,
  escapeHtml,
  renderSeoPage,
} from "./template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");
const PUBLIC_DIR = path.join(WEB_ROOT, "public");
const OUT_DATE = new Date().toISOString().slice(0, 10);

const CURATED_TOOLS_MD = path.join(
  REPO_ROOT,
  "mcp-server/docs/generated/curated-tools.md",
);
const OPENAPI_JSON = path.join(REPO_ROOT, "openapi.json");
const COMPETITORS_JSON = path.join(__dirname, "competitors.json");

/** Marketing SPA routes to include in sitemap (client-rendered; still listed). */
const SPA_ROUTES = [
  "/",
  "/marketplace",
  "/agent",
  "/articles",
  "/about",
  "/token",
  "/brand",
  "/analytics",
  "/leaderboard",
  "/privacy",
  "/terms",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(relDir, html) {
  const dir = path.join(PUBLIC_DIR, relDir);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "index";
}

function parseCuratedTools(md) {
  const tools = [];
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith("| `syra_")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    const name = cells[0].replace(/`/g, "");
    const toolId = cells[1].replace(/`/g, "");
    const pillar = cells[2].toLowerCase();
    const role = cells[3];
    if (!toolId || toolId === "toolId") continue;
    tools.push({ name, toolId, pillar, role });
  }
  return tools;
}

function parsePaidApis(openapi) {
  /** @type {Map<string, object>} */
  const byPath = new Map();
  for (const [apiPath, methods] of Object.entries(openapi.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== "object" || !op["x-payment-info"]) continue;
      const price = op["x-payment-info"]?.price;
      const entry = {
        path: apiPath,
        method: method.toUpperCase(),
        summary: op.summary || op.operationId || apiPath,
        description:
          typeof op.description === "string"
            ? op.description.replace(/\s+/g, " ").trim().slice(0, 500)
            : "",
        operationId: op.operationId || "",
        priceAmount: price?.amount ?? null,
        priceCurrency: price?.currency ?? "USD",
        tags: Array.isArray(op.tags) ? op.tags : [],
      };
      const existing = byPath.get(apiPath);
      // Prefer GET when both GET and POST exist for the same path.
      if (!existing || (entry.method === "GET" && existing.method !== "GET")) {
        byPath.set(apiPath, entry);
      }
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function mcpSnippet(toolName) {
  return `claude mcp add syra -- npx -y @syra-ai/mcp-server@latest

# Then ask your agent to call:
# ${toolName}`;
}

function sdkSnippet(apiPath, method) {
  return `import { createSyraPaidClient } from "@syra-ai/sdk";

const client = createSyraPaidClient({
  // funds USDC on Solana/Base; auto-pays HTTP 402
});

const res = await client.fetch("https://api.syraa.fun${apiPath}", {
  method: "${method}",
});
console.log(await res.json());`;
}

function priceLabel(amount, currency = "USD") {
  if (amount == null) return "See HTTP 402 accepts[] at runtime";
  return `$${amount} ${currency} per successful paid call (catalog hint; runtime 402 is authoritative)`;
}

function toolBody(tool, siblings) {
  const related = siblings
    .filter((t) => t.pillar === tool.pillar && t.toolId !== tool.toolId)
    .slice(0, 6);

  return `
    <div class="card">
      <span class="pill">Pillar: ${escapeHtml(tool.pillar)}</span>
      <span class="pill">MCP</span>
      <span class="pill">x402</span>
      <p style="margin-top:14px"><strong>${escapeHtml(tool.name)}</strong> — ${escapeHtml(tool.role)}</p>
      <p>Part of Syra <strong>Machine Money for Agents</strong>. Spend routes settle USDC via HTTP 402; install once via MCP and call tools without per-vendor API keys.</p>
    </div>

    <h2>What this tool does</h2>
    <p>${escapeHtml(tool.role)}. Agents invoke it as <code>${escapeHtml(tool.name)}</code> through <code>@syra-ai/mcp-server</code> (curated profile) or the escape hatch <code>syra_call_tool</code> with <code>toolId: "${escapeHtml(tool.toolId)}"</code>.</p>

    <h2>Install and call</h2>
    <pre>${escapeHtml(mcpSnippet(tool.name))}</pre>
    <p>Docs: <a href="${DOCS_ORIGIN}/docs/build/mcp">MCP install</a> · Marketplace: <a href="/marketplace">syraa.fun/marketplace</a> · Pricing: <a href="/pricing/">pay-per-call bands</a>.</p>

    <h2>Why pay-per-call</h2>
    <ul>
      <li><strong>One wallet</strong> — USDC payer covers news, on-chain intel, and partner routes.</li>
      <li><strong>Agent-native</strong> — HTTP 402 auto-pay mid-task; no human key pasting.</li>
      <li><strong>Transparent price</strong> — exact charge in the 402 <code>accepts[]</code> array.</li>
    </ul>

    ${
      related.length
        ? `<h2>More ${escapeHtml(tool.pillar)} tools</h2>
    <ul class="grid-list">
      ${related
        .map(
          (t) =>
            `<li><a href="/tools/${escapeHtml(t.toolId)}/">${escapeHtml(t.name)}</a><span class="meta">${escapeHtml(t.role)}</span></li>`,
        )
        .join("\n      ")}
    </ul>`
        : ""
    }
  `;
}

function apiBody(api, allApis) {
  const related = allApis
    .filter((a) => a.path !== api.path)
    .slice(0, 6);

  const desc =
    api.description ||
    `${api.summary}. Paid Syra gateway route over x402 (USDC on Solana/Base).`;

  return `
    <div class="card">
      <span class="pill">${escapeHtml(api.method)}</span>
      <span class="pill"><code>${escapeHtml(api.path)}</code></span>
      <span class="pill">x402</span>
      <p style="margin-top:14px"><strong>Price:</strong> ${escapeHtml(priceLabel(api.priceAmount, api.priceCurrency))}</p>
      <p>Base URL: <code>${API_ORIGIN}</code></p>
    </div>

    <h2>Overview</h2>
    <p>${escapeHtml(desc)}</p>
    <p>This is a <strong>pay-per-call</strong> route: unpaid requests return <code>HTTP 402</code> until you settle USDC and retry with <code>PAYMENT-SIGNATURE</code> or <code>X-PAYMENT</code>. See <a href="${DOCS_ORIGIN}/docs/api/x402-api-standard">x402 wire format</a>.</p>

    <h2>Call with the SDK</h2>
    <pre>${escapeHtml(sdkSnippet(api.path, api.method))}</pre>

    <h2>Discover</h2>
    <ul>
      <li>OpenAPI: <a href="${API_ORIGIN}/openapi.json">${API_ORIGIN}/openapi.json</a></li>
      <li>x402 catalog: <a href="${API_ORIGIN}/.well-known/x402">${API_ORIGIN}/.well-known/x402</a></li>
      <li>UI: <a href="/marketplace">Marketplace</a></li>
    </ul>

    ${
      related.length
        ? `<h2>Other paid APIs</h2>
    <ul class="grid-list">
      ${related
        .map(
          (a) =>
            `<li><a href="/apis/${escapeHtml(slugify(a.path))}/">${escapeHtml(a.method)} ${escapeHtml(a.path)}</a><span class="meta">${escapeHtml(a.summary)}</span></li>`,
        )
        .join("\n      ")}
    </ul>`
        : ""
    }
  `;
}

function vsBody(comp, toolIndex) {
  const relatedLinks = (comp.relatedTools || [])
    .map((id) => {
      const t = toolIndex.get(id);
      if (!t) return null;
      return `<li><a href="/tools/${escapeHtml(t.toolId)}/">${escapeHtml(t.name)}</a> — ${escapeHtml(t.role)}</li>`;
    })
    .filter(Boolean);

  return `
    <div class="card">
      <span class="pill">${escapeHtml(comp.category)}</span>
      <span class="pill">Comparison</span>
      <p style="margin-top:14px">${escapeHtml(comp.syraAngle)}</p>
    </div>

    <h2>How ${escapeHtml(comp.name)} typically works</h2>
    <p>${escapeHtml(comp.theirModel)}</p>

    <h2>How Syra is different</h2>
    <p>${escapeHtml(comp.syraAngle)}</p>
    <ul>
      <li><strong>When ${escapeHtml(comp.name)} wins:</strong> ${escapeHtml(comp.whenTheyWin)}</li>
      <li><strong>When Syra wins:</strong> ${escapeHtml(comp.whenSyraWins)}</li>
    </ul>

    <h2>Honest note</h2>
    <p>Direct upstream accounts can be cheaper on a single route. Syra wins when the agent loop needs <strong>many tools with one USDC payer</strong> and no vendor onboarding. We do not claim to replace every enterprise contract.</p>

    ${
      relatedLinks.length
        ? `<h2>Related Syra tools</h2>
    <ul>${relatedLinks.join("\n      ")}</ul>`
        : ""
    }

    <h2>Next step</h2>
    <p>${escapeHtml(comp.ctaNote)} See also <a href="/pricing/">pricing</a> and <a href="${DOCS_ORIGIN}/docs/build/pricing">Pricing vs DIY</a>.</p>
  `;
}

function hubBody(title, items) {
  return `
    <div class="card">
      <p>${escapeHtml(title)} Programmatic pages for search and agents. Each page includes install snippets and links into the live marketplace.</p>
    </div>
    <ul class="grid-list">
      ${items
        .map(
          (item) =>
            `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a><span class="meta">${escapeHtml(item.meta || "")}</span></li>`,
        )
        .join("\n      ")}
    </ul>
  `;
}

function pricingBody() {
  return `
    <div class="card">
      <span class="pill">x402</span>
      <span class="pill">USDC</span>
      <p style="margin-top:14px">You pay only for <strong>successful</strong> paid requests. Exact per-route amounts come from each endpoint’s <code>402</code> response <code>accepts[]</code> array.</p>
    </div>

    <h2>What you pay</h2>
    <ul>
      <li><strong>Partner passthrough</strong> (e.g. Birdeye, Nansen, TopLedger): upstream cost × ~<strong>1.2</strong> (~+20%).</li>
      <li><strong>OpenRouter</strong> chat / media / embeddings-style routes: upstream cost × ~<strong>1.4</strong> (~+40%), with floors.</li>
      <li><strong>First-party Syra tiers</strong>: typically <code>$0.001</code> / <code>$0.005</code> / <code>$0.02</code> / <code>$0.08</code> per successful paid call.</li>
    </ul>

    <h2>Why not call upstream DIY?</h2>
    <ul>
      <li><strong>One wallet, many tools</strong> — one USDC payer covers news, on-chain intel, and partner routes.</li>
      <li><strong>Agent-native install</strong> — curated MCP tools + auto-pay on HTTP 402.</li>
      <li><strong>Unified discovery</strong> — OpenAPI, marketplace, and <code>/.well-known/x402</code>.</li>
      <li><strong>Transparent per-call price</strong> — 402 <code>accepts[]</code> shows the exact USDC charge.</li>
    </ul>

    <h2>Where prices appear</h2>
    <ul>
      <li>Runtime: HTTP <code>402 Payment Required</code> body <code>accepts[]</code></li>
      <li>Discovery: <a href="${API_ORIGIN}/.well-known/x402">${API_ORIGIN}/.well-known/x402</a></li>
      <li>UI: <a href="/marketplace">syraa.fun/marketplace</a></li>
    </ul>
    <p>Optional token details are at <a href="/token">/token</a> — not required to make paid API calls. Full write-up: <a href="${DOCS_ORIGIN}/docs/build/pricing">docs pricing vs DIY</a>.</p>
  `;
}

function buildSitemap(urls) {
  const body = urls
    .map((u) => {
      const loc = u.startsWith("http") ? u : `${SITE_ORIGIN}${u.startsWith("/") ? u : `/${u}`}`;
      const normalized = loc.endsWith("/") || loc.split("/").pop().includes(".") ? loc : `${loc}/`;
      // Keep bare origin without forcing trailing semantics for home
      const finalLoc =
        loc === `${SITE_ORIGIN}/` || loc === SITE_ORIGIN
          ? `${SITE_ORIGIN}/`
          : normalized;
      return `  <url>
    <loc>${finalLoc}</loc>
    <lastmod>${OUT_DATE}</lastmod>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function main() {
  const toolsMd = fs.readFileSync(CURATED_TOOLS_MD, "utf8");
  const tools = parseCuratedTools(toolsMd);
  const openapi = JSON.parse(fs.readFileSync(OPENAPI_JSON, "utf8"));
  const apis = parsePaidApis(openapi);
  const competitors = JSON.parse(fs.readFileSync(COMPETITORS_JSON, "utf8"));
  const toolIndex = new Map(tools.map((t) => [t.toolId, t]));

  /** @type {string[]} */
  const sitemapUrls = [...SPA_ROUTES];

  // --- Tool pages ---
  for (const tool of tools) {
    const canonicalPath = `/tools/${tool.toolId}/`;
    const html = renderSeoPage({
      title: `${tool.name} - MCP tool for agents`,
      description: `${tool.role} Call ${tool.name} via Syra MCP with USDC x402 pay-per-call. No per-vendor API keys.`,
      canonicalPath,
      heading: tool.name,
      eyebrow: `MCP · ${tool.pillar}`,
      breadcrumbs: [
        { name: "Tools", url: "/tools/" },
        { name: tool.toolId, url: canonicalPath },
      ],
      bodyHtml: toolBody(tool, tools),
      jsonLdType: "SoftwareApplication",
      extraJsonLd: {
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          description: "Pay per successful x402 call",
        },
      },
      related: [
        { href: "/tools/", label: "All MCP tools" },
        { href: "/pricing/", label: "Pricing" },
        { href: "/apis/", label: "Paid APIs" },
      ],
      primaryCtaHref: "/marketplace",
      primaryCtaLabel: "Open marketplace",
      secondaryCtaHref: `${DOCS_ORIGIN}/docs/build/mcp`,
      secondaryCtaLabel: "Install MCP",
    });
    writePage(`tools/${tool.toolId}`, html);
    sitemapUrls.push(canonicalPath);
  }

  writePage(
    "tools",
    renderSeoPage({
      title: "Syra MCP tools for crypto agents",
      description:
        "Browse curated Syra MCP tools — news, smart money, DEX, oracles, and more. Pay per call with USDC over x402.",
      canonicalPath: "/tools/",
      heading: "MCP tools",
      eyebrow: "Programmatic SEO · Spend Live",
      breadcrumbs: [{ name: "Tools", url: "/tools/" }],
      bodyHtml: hubBody(
        "Curated tools from @syra-ai/mcp-server.",
        tools.map((t) => ({
          href: `/tools/${t.toolId}/`,
          label: t.name,
          meta: `${t.pillar} · ${t.role}`,
        })),
      ),
      related: [
        { href: "/apis/", label: "Paid APIs" },
        { href: "/vs/", label: "Comparisons" },
        { href: "/pricing/", label: "Pricing" },
      ],
    }),
  );
  sitemapUrls.push("/tools/");

  // --- API pages ---
  for (const api of apis) {
    const slug = slugify(api.path);
    const canonicalPath = `/apis/${slug}/`;
    const html = renderSeoPage({
      title: `${api.method} ${api.path} - x402 pay-per-call API`,
      description: `${api.summary}. Pay with USDC via HTTP 402. Syra machine money for agents.`,
      canonicalPath,
      heading: `${api.method} ${api.path}`,
      eyebrow: "x402 API",
      breadcrumbs: [
        { name: "APIs", url: "/apis/" },
        { name: api.path, url: canonicalPath },
      ],
      bodyHtml: apiBody(api, apis),
      jsonLdType: "TechArticle",
      related: [
        { href: "/apis/", label: "All paid APIs" },
        { href: "/tools/", label: "MCP tools" },
        { href: "/pricing/", label: "Pricing" },
      ],
      primaryCtaHref: "/marketplace",
      primaryCtaLabel: "Try in marketplace",
      secondaryCtaHref: `${DOCS_ORIGIN}/docs/build/sdk`,
      secondaryCtaLabel: "Install SDK",
    });
    writePage(`apis/${slug}`, html);
    sitemapUrls.push(canonicalPath);
  }

  writePage(
    "apis",
    renderSeoPage({
      title: "Syra x402 pay-per-call APIs",
      description:
        "Catalog of Syra paid API routes. Settle USDC on HTTP 402 — crypto intelligence for agents.",
      canonicalPath: "/apis/",
      heading: "Paid APIs",
      eyebrow: "OpenAPI · x402",
      breadcrumbs: [{ name: "APIs", url: "/apis/" }],
      bodyHtml: hubBody(
        "Paid operations from openapi.json (deduped by path).",
        apis.map((a) => ({
          href: `/apis/${slugify(a.path)}/`,
          label: `${a.method} ${a.path}`,
          meta: `${a.summary}${a.priceAmount != null ? ` · $${a.priceAmount}` : ""}`,
        })),
      ),
      related: [
        { href: "/tools/", label: "MCP tools" },
        { href: "/pricing/", label: "Pricing" },
      ],
      secondaryCtaHref: `${API_ORIGIN}/openapi.json`,
      secondaryCtaLabel: "OpenAPI JSON",
    }),
  );
  sitemapUrls.push("/apis/");

  // --- Comparison pages ---
  for (const comp of competitors) {
    const canonicalPath = `/vs/${comp.slug}/`;
    const html = renderSeoPage({
      title: `${comp.primaryKeyword} - pay-per-call alternative`,
      description: `${comp.syraAngle}`,
      canonicalPath,
      heading: `Syra vs ${comp.name}`,
      eyebrow: "Compare",
      breadcrumbs: [
        { name: "Compare", url: "/vs/" },
        { name: comp.name, url: canonicalPath },
      ],
      bodyHtml: vsBody(comp, toolIndex),
      jsonLdType: "TechArticle",
      related: [
        { href: "/vs/", label: "All comparisons" },
        { href: "/pricing/", label: "Pricing" },
        { href: "/tools/", label: "MCP tools" },
      ],
    });
    writePage(`vs/${comp.slug}`, html);
    sitemapUrls.push(canonicalPath);
  }

  writePage(
    "vs",
    renderSeoPage({
      title: "Syra vs alternatives - pay-per-call APIs for agents",
      description:
        "Honest comparisons: Syra vs Nansen, CoinGecko, DefiLlama, DexScreener, Messari, DIY x402, and per-vendor API keys.",
      canonicalPath: "/vs/",
      heading: "Syra vs alternatives",
      eyebrow: "Comparisons",
      breadcrumbs: [{ name: "Compare", url: "/vs/" }],
      bodyHtml: hubBody(
        "When a single upstream wins vs when one USDC payer for many tools wins.",
        competitors.map((c) => ({
          href: `/vs/${c.slug}/`,
          label: `Syra vs ${c.name}`,
          meta: c.category,
        })),
      ),
      related: [
        { href: "/pricing/", label: "Pricing" },
        { href: "/tools/", label: "MCP tools" },
      ],
    }),
  );
  sitemapUrls.push("/vs/");

  // --- Pricing ---
  writePage(
    "pricing",
    renderSeoPage({
      title: "Syra pricing - pay-per-call x402 APIs",
      description:
        "Honest margin bands for Syra pay-per-call APIs. Partner passthrough ~1.2x, media ~1.4x, first-party tiers from $0.001. USDC via HTTP 402.",
      canonicalPath: "/pricing/",
      heading: "Pricing",
      eyebrow: "Pay per call · USDC",
      breadcrumbs: [{ name: "Pricing", url: "/pricing/" }],
      bodyHtml: pricingBody(),
      jsonLdType: "WebPage",
      related: [
        { href: "/tools/", label: "MCP tools" },
        { href: "/apis/", label: "Paid APIs" },
        { href: "/vs/diy-x402/", label: "Syra vs DIY x402" },
      ],
      primaryCtaHref: "/marketplace",
      primaryCtaLabel: "Browse marketplace",
      secondaryCtaHref: `${DOCS_ORIGIN}/docs/build/pricing`,
      secondaryCtaLabel: "Full pricing docs",
    }),
  );
  sitemapUrls.push("/pricing/");

  // Deduplicate sitemap URLs
  const uniqueUrls = [...new Set(sitemapUrls)];
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), buildSitemap(uniqueUrls), "utf8");

  console.log(
    `[seo] Generated ${tools.length} tools, ${apis.length} apis, ${competitors.length} comparisons, hubs + pricing; sitemap ${uniqueUrls.length} URLs → ${PUBLIC_DIR}`,
  );
}

main();
