/**
 * Agent team scheduler: daily at a fixed wall-clock in Asia/Jakarta (WIB, UTC+7, no DST)
 * → crawl → internal research → business strategy → Telegram → MongoDB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { crawlSyraSurfaces } from "./agentTeamCrawl.js";
import { runInternalResearchAgent } from "../agents/internal-research-agent.js";
import { runBusinessStrategyAgent } from "../agents/business-strategy-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";

/** Mongo document id for latest agent-team run. */
export const AGENT_TEAM_DB_ID = "agent-team-latest";

/** IANA zone for WIB (Western Indonesian Time). */
const AGENT_TEAM_TIMEZONE = "Asia/Jakarta";

/**
 * Calendar + clock parts for `date` in {@link AGENT_TEAM_TIMEZONE}.
 * @param {Date} date
 * @returns {{ year: number; month: number; day: number; hour: number; minute: number; second: number }}
 */
function getTimeZoneCalendarParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENT_TEAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const m = /** @type {Record<string, string>} */ ({});
  for (const p of parts) {
    if (p.type !== "literal") m[p.type] = p.value;
  }
  return {
    year: Number(m.year),
    month: Number(m.month),
    day: Number(m.day),
    hour: Number(m.hour),
    minute: Number(m.minute),
    second: Number(m.second),
  };
}

/**
 * UTC instant when the Jakarta wall clock reads `hour:minute:00` on the given calendar day.
 * Jakarta is always UTC+7 (no DST).
 * @param {number} year
 * @param {number} month 1–12
 * @param {number} day 1–31
 * @param {number} hour 0–23
 * @param {number} minute 0–59
 * @returns {number} epoch ms
 */
function jakartaWallClockToUtcMs(year, month, day, hour, minute) {
  return Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0);
}

/**
 * Milliseconds from `now` until the next occurrence of `targetHour:targetMinute` in Asia/Jakarta.
 * If `now` is exactly at or after that instant today, schedules tomorrow’s occurrence.
 *
 * @param {Date} [now]
 * @param {number} [targetHour] default 6 (06:00 WIB)
 * @param {number} [targetMinute] default 0
 * @returns {number}
 */
export function getMsUntilNextWibWallClock(now = new Date(), targetHour = 6, targetMinute = 0) {
  const { year, month, day } = getTimeZoneCalendarParts(now);
  let targetUtc = jakartaWallClockToUtcMs(year, month, day, targetHour, targetMinute);
  if (targetUtc <= now.getTime()) {
    targetUtc += 86_400_000;
  }
  return Math.max(0, targetUtc - now.getTime());
}

/**
 * @param {string} raw
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function parseBoundedInt(raw, fallback, min, max) {
  const n = Number.parseInt(String(raw || "").trim(), 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

/**
 * @typedef {import("../agents/internal-research-agent.js").InternalResearchOutput} InternalResearchOutput
 */

/**
 * @typedef {import("../agents/business-strategy-agent.js").BusinessStrategyOutput} BusinessStrategyOutput
 */

/**
 * @param {InternalResearchOutput} internal
 * @returns {string}
 */
export function formatInternalForTelegram(internal) {
  const recLines = internal.recommendations.slice(0, 5).map((r, i) => {
    const why =
      r.why.length > 220 ? `${r.why.slice(0, 220)}…` : r.why;
    return `${i + 1}. [${r.surface} / ${r.category}] ${r.title}\n   ${why}`;
  });
  const riskLines = internal.risks.slice(0, 5).map((r) => `- ${r}`);
  const parts = [
    "Syra Agent Team — Internal Research",
    `Generated: ${internal.generatedAt}`,
    "",
    "Summary:",
    internal.summary,
    "",
    "Top 5 recommendations:",
    ...recLines,
  ];
  if (riskLines.length) {
    parts.push("", "Risks:", ...riskLines);
  }
  parts.push("", "Full report: https://syraa.fun/internal-dashboard");
  return parts.join("\n");
}

/**
 * @param {BusinessStrategyOutput} business
 * @returns {string}
 */
export function formatBusinessForTelegram(business) {
  const gtm = business.gtmRecommendations.slice(0, 5).map((g, i) => {
    const rat =
      g.rationale.length > 200 ? `${g.rationale.slice(0, 200)}…` : g.rationale;
    return `${i + 1}. [${g.horizon}] ${g.title} (${g.channel})\n   ${rat}`;
  });
  const mon = business.monetizationIdeas.slice(0, 4).map((m, i) => {
    const rat =
      m.rationale.length > 180 ? `${m.rationale.slice(0, 180)}…` : m.rationale;
    return `${i + 1}. ${m.title}\n   ${rat}\n   Pricing hypothesis: ${m.pricingHypothesis}`;
  });
  const comp = business.competitiveRisks.slice(0, 5).map((c) => `- ${c}`);
  const parts = [
    "Syra Agent Team — Business Strategy",
    `Generated: ${business.generatedAt}`,
    "",
    "Market position:",
    business.marketPosition,
    "",
    "Top GTM moves:",
    ...gtm,
    "",
    "Monetization ideas:",
    ...mon,
  ];
  if (comp.length) {
    parts.push("", "Competitive / market risks:", ...comp);
  }
  parts.push("", "Full report: https://syraa.fun/internal-dashboard");
  return parts.join("\n");
}

/**
 * Resolve OpenRouter model from env (empty → agent uses default).
 * @returns {string | null}
 */
function modelFromEnv() {
  const m = String(process.env.AGENT_TEAM_MODEL || "").trim();
  return m || null;
}

/**
 * Run full chained pipeline once (crawl → research → business → persist; Telegram best-effort).
 * @returns {Promise<{
 *   success: true;
 *   data: {
 *     internal: InternalResearchOutput;
 *     business: BusinessStrategyOutput;
 *     crawledAt: string;
 *     baseUrls: string[];
 *     pageCount: number;
 *   };
 * }>}
 */
export async function runAgentTeamPipeline() {
  const model = modelFromEnv();
  const crawlOut = await crawlSyraSurfaces({});
  const { snapshot, generatedAt, baseUrls } = crawlOut;

  const internal = await runInternalResearchAgent({ snapshot, model });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatInternalForTelegram(internal), {
      disableWebPagePreview: true,
    });
    if (!sent) {
      console.warn("[agent-team] Telegram send failed (internal research digest)");
    }
  }

  const business = await runBusinessStrategyAgent({
    snapshot,
    internalResearch: internal,
    model,
  });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatBusinessForTelegram(business), {
      disableWebPagePreview: true,
    });
    if (!sent) {
      console.warn("[agent-team] Telegram send failed (business strategy digest)");
    }
  }

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: AGENT_TEAM_DB_ID },
    {
      id: AGENT_TEAM_DB_ID,
      payload: {
        internal,
        business,
        surfaces: snapshot.map((s) => s.url),
        baseUrls,
        crawledAt: generatedAt,
        savedAt: savedAt.toISOString(),
      },
      savedAt,
    },
    { upsert: true, new: true },
  );

  return {
    success: true,
    data: {
      internal,
      business,
      crawledAt: generatedAt,
      baseUrls,
      pageCount: snapshot.length,
    },
  };
}

/**
 * Start in-process scheduler: one run per day at {@link AGENT_TEAM_TIMEZONE} wall clock
 * (default 06:00 WIB). Uses recursive `setTimeout` so the server does not drift from local morning time.
 * Safe to call once at startup.
 */
export function startAgentTeamScheduler() {
  if (String(process.env.AGENT_TEAM_ENABLED || "").trim() !== "1") {
    console.log("[agent-team] disabled (set AGENT_TEAM_ENABLED=1 to enable)");
    return;
  }

  const wibHour = parseBoundedInt(process.env.AGENT_TEAM_WIB_HOUR, 6, 0, 23);
  const wibMinute = parseBoundedInt(process.env.AGENT_TEAM_WIB_MINUTE, 0, 0, 59);

  const runOnStart = String(process.env.AGENT_TEAM_RUN_ON_START || "").trim() === "1";

  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[agent-team] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runAgentTeamPipeline();
      console.log("[agent-team] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[agent-team] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra Agent Team — run failed\n${msg.slice(0, 3500)}`,
          { disableWebPagePreview: true },
        );
      }
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    const delay = getMsUntilNextWibWallClock(new Date(), wibHour, wibMinute);
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delay);
    const nextAt = new Date(Date.now() + delay).toISOString();
    console.log(
      `[agent-team] next run in ${Math.round(delay / 1000)}s (at ~${nextAt} UTC; local ${String(wibHour).padStart(2, "0")}:${String(wibMinute).padStart(2, "0")} ${AGENT_TEAM_TIMEZONE})`,
    );
  };

  if (runOnStart) {
    void tick().finally(() => {
      scheduleNext();
    });
  } else {
    scheduleNext();
  }

  console.log(
    `[agent-team] enabled: daily at ${String(wibHour).padStart(2, "0")}:${String(wibMinute).padStart(2, "0")} ${AGENT_TEAM_TIMEZONE} (WIB); Telegram: ${isDevTelegramConfigured() ? "on" : "off (set SYRA_DEV_BOT_*)"}; runOnStart=${runOnStart}`,
  );
}
