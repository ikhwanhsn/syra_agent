/**
 * Up Only Fund — internal dev agent team (Telegram-only; not exposed on uponly.fund).
 * Slots 1–14: engineering intelligence; slot 15: HR coach.
 */

/** Crawl seeds (comma-separated URLs) or default production fund site. */
export function getUponlyFundCrawlBaseUrls() {
  const raw =
    typeof process.env.UPONLY_FUND_DEV_CRAWL_BASE_URLS === "string"
      ? process.env.UPONLY_FUND_DEV_CRAWL_BASE_URLS.trim()
      : "";
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return ["https://uponly.fund"];
}

/**
 * Daily wall clock for the in-process scheduler (Asia/Jakarta), staggered after Syra’s 06:00 batch.
 */
export const UPONLY_FUND_DEV_TEAM_WIB_HOUR = 6;
export const UPONLY_FUND_DEV_TEAM_WIB_MINUTE = 55;

/** @type {readonly { slot: number; id: string; title: string }[]} */
export const UPONLY_FUND_DEV_TEAM_ROSTER = Object.freeze([
  { slot: 1, id: "surface-scout", title: "Surface Scout" },
  { slot: 2, id: "product-platform-research", title: "Product & Platform Research" },
  { slot: 3, id: "technical-risk-integrity", title: "Technical Risk & Data Integrity" },
  { slot: 4, id: "monorepo-api-architecture", title: "Monorepo & API Architecture" },
  { slot: 5, id: "dashboard-rise-ui", title: "Dashboard & RISE UI Engineering" },
  { slot: 6, id: "market-data-terminal", title: "Market Data & Terminal / Charts" },
  { slot: 7, id: "performance-assets", title: "Performance & Asset Strategy" },
  { slot: 8, id: "security-secrets", title: "Security & Secrets Hygiene" },
  { slot: 9, id: "observability-reliability", title: "Observability & Reliability" },
  { slot: 10, id: "qa-types-ci", title: "QA, Types & CI" },
  { slot: 11, id: "i18n-trust-copy", title: "i18n & Trust / Compliance Copy" },
  { slot: 12, id: "wallet-trading-flows", title: "Wallet Flows & Trading CTAs" },
  { slot: 13, id: "allocator-transparency", title: "Allocator Transparency & Reporting" },
  { slot: 14, id: "prioritized-backlog", title: "Prioritized Delivery Backlog" },
  { slot: 15, id: "hr-coach", title: "HR · Dev Team Coach" },
]);

/**
 * @param {number} slot 1–15
 * @returns {{ slot: number; id: string; title: string } | undefined}
 */
export function getUponlyFundDevTeamRole(slot) {
  return UPONLY_FUND_DEV_TEAM_ROSTER.find((r) => r.slot === slot);
}
