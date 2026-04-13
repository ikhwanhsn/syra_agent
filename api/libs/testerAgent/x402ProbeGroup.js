/**
 * Buckets x402 smoke/paid probes into the same groups as the API Playground
 * "Example flows" x402 tab (see getFlowGroup in api-playground useApiPlayground.ts).
 */

/**
 * @typedef {{ slug: string; name: string }} X402ProbeGroup
 */

/** Display order for grouped runs (matches Examples page). */
export const X402_PROBE_GROUP_ORDER = [
  "mpp-lane",
  "syra-core",
  "preview",
  "tokens-dex",
  "agent",
  "partner-gateway",
  "binance",
  "8004",
  "8004scan",
  "nansen",
  "x",
  "jupiter",
  "squid",
  "purch-vault",
  "heylol",
  "quicknode",
];

/**
 * @param {{ path: string; id?: string }} probe
 * @returns {X402ProbeGroup}
 */
export function getX402SmokeProbeGroup(probe) {
  const p = String(probe.path || "").toLowerCase();
  if (p.startsWith("/preview/")) return { slug: "preview", name: "Free preview" };
  if (p.startsWith("/mpp/v1/")) return { slug: "mpp-lane", name: "MPP v1 lane" };
  if (p.startsWith("/nansen/")) return { slug: "nansen", name: "Nansen" };
  if (p.startsWith("/quicknode/")) return { slug: "quicknode", name: "Quicknode" };
  if (p.startsWith("/heylol/")) return { slug: "heylol", name: "HeyLol" };
  if (p.startsWith("/8004scan/")) return { slug: "8004scan", name: "8004scan" };
  if (p.startsWith("/8004/")) return { slug: "8004", name: "8004" };
  if (p.startsWith("/x/")) return { slug: "x", name: "X (Twitter)" };
  if (p.startsWith("/squid/")) return { slug: "squid", name: "Squid" };
  if (p.startsWith("/jupiter/")) return { slug: "jupiter", name: "Jupiter" };
  if (p.startsWith("/token-god-mode")) return { slug: "tokens-dex", name: "Tokens & DEX" };
  if (p.startsWith("/bubblemaps/")) return { slug: "tokens-dex", name: "Tokens & DEX" };
  if (p.startsWith("/trending-jupiter")) return { slug: "tokens-dex", name: "Tokens & DEX" };
  if (p === "/binance" || p.startsWith("/binance/")) return { slug: "binance", name: "Binance" };
  if (p.startsWith("/bankr/")) return { slug: "purch-vault", name: "Purch Vault" };
  if (p.startsWith("/giza/") || p.startsWith("/neynar/") || p.startsWith("/siwa/")) {
    return { slug: "partner-gateway", name: "Partner (Syra gateway)" };
  }
  if (p.startsWith("/solana-agent")) return { slug: "agent", name: "Syra Agent" };
  return { slug: "syra-core", name: "Syra Core" };
}

/**
 * @template T
 * @param {T[]} probes
 * @param {(p: T) => X402ProbeGroup} getGroup
 * @returns {{ slug: string; name: string; probes: T[] }[]}
 */
export function bucketProbesByExampleGroup(probes, getGroup) {
  /** @type {Map<string, { name: string; probes: T[] }>} */
  const map = new Map();
  for (const pr of probes) {
    const { slug, name } = getGroup(pr);
    const cur = map.get(slug);
    if (!cur) map.set(slug, { name, probes: [pr] });
    else cur.probes.push(pr);
  }
  /** @type {{ slug: string; name: string; probes: T[] }[]} */
  const ordered = [];
  for (const slug of X402_PROBE_GROUP_ORDER) {
    const cur = map.get(slug);
    if (cur && cur.probes.length > 0) ordered.push({ slug, name: cur.name, probes: cur.probes });
  }
  for (const [slug, cur] of map.entries()) {
    if (!X402_PROBE_GROUP_ORDER.includes(slug) && cur.probes.length > 0) {
      ordered.push({ slug, name: cur.name, probes: cur.probes });
    }
  }
  return ordered;
}
