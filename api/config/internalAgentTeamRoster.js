/**
 * Internal “agent team” roster: 14 specialists + 1 HR coach (15 total).
 * Slots map to daily Telegram digests (dev bot) and HR reads the same payloads for coaching.
 */

/** @typedef {{ slot: number; id: string; title: string; mission: string }} InternalTeamAgentDef */

/** @type {readonly InternalTeamAgentDef[]} */
export const INTERNAL_AGENT_TEAM_ROSTER = Object.freeze([
  {
    slot: 1,
    id: "surface-scout",
    title: "Surface Scout",
    mission: "Track what we crawled from Syra surfaces.",
  },
  {
    slot: 2,
    id: "research-lead",
    title: "Research Lead",
    mission: "Turn crawled pages into clear product insights.",
  },
  {
    slot: 3,
    id: "risk-officer",
    title: "Risk Officer",
    mission: "Call out risks and gaps from research.",
  },
  {
    slot: 4,
    id: "strategy-lead",
    title: "Strategy Lead",
    mission: "Summarize market position and direction.",
  },
  {
    slot: 5,
    id: "gtm-specialist",
    title: "GTM Specialist",
    mission: "Top go-to-market moves.",
  },
  {
    slot: 6,
    id: "revenue-designer",
    title: "Revenue Designer",
    mission: "Monetization hypotheses.",
  },
  {
    slot: 7,
    id: "market-pulse",
    title: "Market Pulse",
    mission: "SYRA liquidity and trading context.",
  },
  {
    slot: 8,
    id: "liquidity-desk",
    title: "Liquidity Desk",
    mission: "Hard numbers from DEX / stats.",
  },
  {
    slot: 9,
    id: "social-pulse",
    title: "Social Pulse",
    mission: "X sentiment and narrative for SYRA.",
  },
  {
    slot: 10,
    id: "community-liaison",
    title: "Community Liaison",
    mission: "Themes and community signals.",
  },
  {
    slot: 11,
    id: "sector-narrative",
    title: "Sector Narrative",
    mission: "Sector + macro story for positioning.",
  },
  {
    slot: 12,
    id: "macro-signal",
    title: "Macro Signal",
    mission: "Tailwinds / headwinds snapshot.",
  },
  {
    slot: 13,
    id: "x402-scout",
    title: "x402 Scout",
    mission: "x402 ecosystem pulse on X.",
  },
  {
    slot: 14,
    id: "ecosystem-watch",
    title: "Ecosystem Watch",
    mission: "Watchlist and caveats for x402.",
  },
  {
    slot: 15,
    id: "hr-coach",
    title: "HR · Team Coach",
    mission: "Daily skill improvements so the team gets sharper.",
  },
]);

export const INTERNAL_AGENT_TEAM_SIZE = INTERNAL_AGENT_TEAM_ROSTER.length;

/**
 * @param {number} slot 1–15
 * @param {string} title
 * @param {string[]} bodyLines
 * @returns {string}
 */
export function formatInternalTeamTelegram(slot, title, bodyLines) {
  const safeSlot = Math.min(15, Math.max(1, slot));
  const head = `Syra · Internal Team ${safeSlot}/15 — ${title}`;
  const body = (bodyLines || []).filter((l) => l != null && String(l).trim().length > 0);
  return [head, "", ...body.map((l) => String(l))].join("\n");
}

/**
 * @param {string} id
 * @returns {InternalTeamAgentDef | undefined}
 */
export function getInternalTeamAgentById(id) {
  return INTERNAL_AGENT_TEAM_ROSTER.find((a) => a.id === id);
}
