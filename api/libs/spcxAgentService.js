/**
 * SpaceX IPO Agent — public feed service.
 * Stores agent decisions in-memory ring buffer; optional tick via cron or on-demand.
 */

import { buildSpcxIntelligence } from "./spcxIntelligence.js";

const MAX_FEED_ENTRIES = 100;
const TICK_COOLDOWN_MS = 25_000;

/** @type {import('./equityIntelligence.js').EquityIntelligenceReport[]} */
let feed = [];

/** @type {import('./equityIntelligence.js').EquityIntelligenceReport | null} */
let latest = null;

let lastTickAt = 0;

/**
 * Run intelligence tick and append to feed.
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<import('./equityIntelligence.js').EquityIntelligenceReport>}
 */
export async function tickSpcxAgent(opts = {}) {
  const now = Date.now();
  if (!opts.force && now - lastTickAt < TICK_COOLDOWN_MS && latest) {
    return latest;
  }

  const report = await buildSpcxIntelligence();
  latest = report;
  lastTickAt = now;

  feed.unshift({
    ...report,
    id: `spcx-${now}`,
    tickAt: new Date(now).toISOString(),
  });
  if (feed.length > MAX_FEED_ENTRIES) {
    feed = feed.slice(0, MAX_FEED_ENTRIES);
  }

  return report;
}

/**
 * @returns {import('./equityIntelligence.js').EquityIntelligenceReport | null}
 */
export function getLatestSpcxReport() {
  return latest;
}

/**
 * @param {{ limit?: number }} [opts]
 * @returns {Array<import('./equityIntelligence.js').EquityIntelligenceReport & { id?: string; tickAt?: string }>}
 */
export function getSpcxFeed(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), MAX_FEED_ENTRIES);
  return feed.slice(0, limit);
}

/**
 * Format report for Telegram / X posting.
 * @param {import('./equityIntelligence.js').EquityIntelligenceReport} report
 * @returns {string}
 */
export function formatSpcxTelegramMessage(report) {
  const lines = [
    "🚀 *Syra SpaceX IPO Agent* — $SPCX on Solana",
    "",
  ];

  if (report.nasdaqPriceUsd != null) {
    lines.push(`📊 Nasdaq ${report.nasdaqTicker}: $${report.nasdaqPriceUsd.toFixed(2)}`);
  }

  for (const v of report.venues) {
    if (v.priceUsd == null) continue;
    const spread =
      v.spreadPct != null
        ? ` (${v.spreadPct >= 0 ? "+" : ""}${v.spreadPct.toFixed(2)}% ${v.spreadLabel})`
        : "";
    lines.push(`⛓ ${v.symbol} [${v.venue}]: $${v.priceUsd.toFixed(2)}${spread}`);
  }

  lines.push("");
  lines.push(`🤖 ${report.agentTake}`);
  lines.push("");
  lines.push("🔗 agent.syraa.fun/spcx");
  lines.push("_Not investment advice. Probabilistic intel only._");

  return lines.join("\n");
}
