/**
 * Short, plain Telegram lines for the 15-slot internal team (dev bot).
 */

import { formatInternalTeamTelegram } from "../config/internalAgentTeamRoster.js";

/** @param {string} [s] @param {number} max */
function clip(s, max) {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * @param {{ baseUrls?: string[]; pageCount?: number; crawledAt?: string }} p
 */
export function formatSurfaceScoutTelegram(p) {
  const urls = Array.isArray(p.baseUrls) ? p.baseUrls.join(", ") : "—";
  const n = typeof p.pageCount === "number" ? p.pageCount : "—";
  const when = p.crawledAt || "—";
  return formatInternalTeamTelegram(1, "Surface Scout", [
    `When: ${when}`,
    `Pages saved: ${n}`,
    `Sites: ${clip(urls, 400)}`,
    "This was an automatic crawl of Syra marketing surfaces (no AI cost for this message).",
  ]);
}

/** @param {*} internal */
export function formatResearchLeadTelegram(internal) {
  const top = (internal.recommendations || []).slice(0, 3).map((r, i) => {
    const t = clip(r.title, 90);
    return `${i + 1}. ${t}`;
  });
  return formatInternalTeamTelegram(2, "Research Lead", [
    `When: ${internal.generatedAt || "—"}`,
    "",
    clip(internal.summary, 520),
    "",
    "Top ideas:",
    ...(top.length ? top : ["(none in this run)"]),
  ]);
}

/** @param {*} internal */
export function formatRiskOfficerTelegram(internal) {
  const risks = (internal.risks || []).slice(0, 5).map((r) => `- ${clip(r, 160)}`);
  return formatInternalTeamTelegram(3, "Risk Officer", [
    `When: ${internal.generatedAt || "—"}`,
    "",
    risks.length ? "Risks / gaps:" : "No risks listed this run.",
    ...risks,
  ]);
}

/** @param {*} business */
export function formatStrategyLeadTelegram(business) {
  return formatInternalTeamTelegram(4, "Strategy Lead", [
    `When: ${business.generatedAt || "—"}`,
    "",
    clip(business.marketPosition, 640),
  ]);
}

/** @param {*} business */
export function formatGtmSpecialistTelegram(business) {
  const lines = (business.gtmRecommendations || []).slice(0, 4).map((g, i) => {
    const t = clip(g.title, 100);
    return `${i + 1}. [${g.horizon}] ${t} — ${g.channel}`;
  });
  return formatInternalTeamTelegram(5, "GTM Specialist", [
    `When: ${business.generatedAt || "—"}`,
    "",
    ...(lines.length ? lines : ["No GTM rows this run."]),
  ]);
}

/** @param {*} business */
export function formatRevenueDesignerTelegram(business) {
  const lines = (business.monetizationIdeas || []).slice(0, 3).map((m, i) => {
    const t = clip(m.title, 100);
    const p = clip(m.pricingHypothesis, 80);
    return `${i + 1}. ${t} — ${p}`;
  });
  return formatInternalTeamTelegram(6, "Revenue Designer", [
    `When: ${business.generatedAt || "—"}`,
    "",
    ...(lines.length ? lines : ["No monetization rows this run."]),
  ]);
}

/** @param {*} out */
export function formatMarketPulseTelegram(out) {
  return formatInternalTeamTelegram(7, "Market Pulse", [
    `When: ${out.generatedAt}`,
    "",
    clip(out.summary, 480),
    "",
    `Liquidity: ${out.liquidityAssessment} · Volume: ${out.volumeAssessment}`,
    `North star: ${clip(out.oneLineNorthStar, 180)}`,
    "",
    "Next actions:",
    ...out.growthActions.slice(0, 4).map((a, i) => `${i + 1}. ${clip(a, 120)}`),
  ]);
}

/** @param {*} out */
export function formatLiquidityDeskTelegram(out) {
  const s = out.sourceStats;
  const bull = (out.bullSignals || []).slice(0, 3).map((x) => `+ ${clip(x, 100)}`);
  const risk = (out.riskSignals || []).slice(0, 3).map((x) => `- ${clip(x, 100)}`);
  return formatInternalTeamTelegram(8, "Liquidity Desk", [
    `When: ${out.generatedAt}`,
    `DEX pairs: ${s.dexPairCount} · Top liq ~$${s.bestLiquidityUsd ?? "—"} · Vol24h ~$${s.bestVolumeH24 ?? "—"} · FDV ~$${s.bestFdv ?? "—"}`,
    "",
    "Bull signals:",
    ...(bull.length ? bull : ["(none)"]),
    "",
    "Risk signals:",
    ...(risk.length ? risk : ["(none)"]),
  ]);
}

/** @param {*} out */
export function formatSocialPulseTelegram(out) {
  return formatInternalTeamTelegram(9, "Social Pulse", [
    `When: ${out.generatedAt} · Posts: ${out.tweetsSampled} · Mood: ${out.sentiment}`,
    "",
    clip(out.summary, 480),
    "",
    "Do next:",
    ...out.recommendedActions.slice(0, 4).map((a, i) => `${i + 1}. ${clip(a, 120)}`),
  ]);
}

/** @param {*} out */
export function formatCommunityLiaisonTelegram(out) {
  const themes = (out.topThemes || []).slice(0, 6).map((t) => `- ${clip(t, 100)}`);
  const sig = (out.communitySignals || []).slice(0, 4).map((t) => `• ${clip(t, 120)}`);
  return formatInternalTeamTelegram(10, "Community Liaison", [
    `When: ${out.generatedAt}`,
    "",
    "Themes:",
    ...(themes.length ? themes : ["(none)"]),
    "",
    "Signals:",
    ...(sig.length ? sig : ["(none)"]),
  ]);
}

/** @param {*} out */
export function formatSectorNarrativeTelegram(out) {
  const ideas = (out.positioningIdeasForSyra || []).slice(0, 5).map((a, i) => `${i + 1}. ${clip(a, 130)}`);
  const head = [`When: ${out.generatedAt} · Posts: ${out.tweetsSampled}`];
  if (out.macroHeadline) head.push(`Macro: ${clip(out.macroHeadline, 200)}`);
  return formatInternalTeamTelegram(11, "Sector Narrative", [
    ...head,
    "",
    clip(out.summary, 480),
    "",
    "Positioning ideas:",
    ...(ideas.length ? ideas : ["(none)"]),
  ]);
}

/** @param {*} out */
export function formatMacroSignalTelegram(out) {
  const tw = (out.tailwindThemes || []).slice(0, 5).map((t) => `▲ ${clip(t, 120)}`);
  const hw = (out.headwindThemes || []).slice(0, 5).map((t) => `▼ ${clip(t, 120)}`);
  return formatInternalTeamTelegram(12, "Macro Signal", [
    `When: ${out.generatedAt}`,
    "",
    "Tailwinds:",
    ...(tw.length ? tw : ["(none)"]),
    "",
    "Headwinds:",
    ...(hw.length ? hw : ["(none)"]),
  ]);
}

/** @param {*} out */
export function formatX402ScoutTelegram(out) {
  const bullets = (out.bullets || []).slice(0, 5).map((b, i) => {
    const d = clip(b.detail, 140);
    return `${i + 1}. ${clip(b.title, 80)} — ${d}`;
  });
  return formatInternalTeamTelegram(13, "x402 Scout", [
    `When: ${out.generatedAt} · Posts sampled: ${out.tweetsSampled}`,
    "",
    clip(out.summary, 420),
    "",
    "Trends:",
    ...bullets,
  ]);
}

/** @param {*} out */
export function formatEcosystemWatchTelegram(out) {
  const watch = (out.watchlist || []).slice(0, 6).map((w) => `- ${clip(w, 140)}`);
  const noise = (out.noiseOrCaveats || []).slice(0, 5).map((n) => `! ${clip(n, 140)}`);
  return formatInternalTeamTelegram(14, "Ecosystem Watch", [
    `When: ${out.generatedAt}`,
    "",
    "Watchlist:",
    ...(watch.length ? watch : ["(empty)"]),
    "",
    "Caveats:",
    ...(noise.length ? noise : ["(none)"]),
    "",
    "More: https://x.com/search?q=x402&f=live",
  ]);
}

/**
 * @param {{ generatedAt: string; coaching: string }} hr
 */
export function formatHrCoachTelegram(hr) {
  const lines = String(hr.coaching || "")
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);
  return formatInternalTeamTelegram(15, "HR · Team Coach", [
    `When: ${hr.generatedAt}`,
    "",
    ...(lines.length ? lines : ["(no coaching text)"]),
  ]);
}
