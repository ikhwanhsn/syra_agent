/**
 * Agent team scheduler: runs on a fixed interval (default 24h) while the API process is up
 * → crawl → internal research → business strategy → Telegram → MongoDB.
 *
 * Enabled by default in code. Set AGENT_TEAM_ENABLED=0 in env to disable.
 * Optional {@link getMsUntilNextWibWallClock} remains for external cron / tests (WIB wall clock).
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

/** Default 24h between runs (after each pipeline completes). */
const DEFAULT_AGENT_TEAM_INTERVAL_MS = 86_400_000;
const MIN_AGENT_TEAM_INTERVAL_MS = 3_600_000;
const MAX_AGENT_TEAM_INTERVAL_MS = 7 * 86_400_000;

/**
 * Milliseconds between agent-team runs. Env AGENT_TEAM_INTERVAL_MS optional (min 1h, max 7d).
 * @returns {number}
 */
function getAgentTeamIntervalMs() {
  const n = Number.parseInt(String(process.env.AGENT_TEAM_INTERVAL_MS || "").trim(), 10);
  if (!Number.isFinite(n)) return DEFAULT_AGENT_TEAM_INTERVAL_MS;
  return Math.min(
    MAX_AGENT_TEAM_INTERVAL_MS,
    Math.max(MIN_AGENT_TEAM_INTERVAL_MS, n),
  );
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
 * Start in-process scheduler: first pipeline run shortly after startup, then every
 * {@link DEFAULT_AGENT_TEAM_INTERVAL_MS} (24h) after each run finishes. Safe to call once at startup.
 */
export function startAgentTeamScheduler() {
  if (String(process.env.AGENT_TEAM_ENABLED || "").trim() === "0") {
    console.log("[agent-team] disabled (AGENT_TEAM_ENABLED=0)");
    return;
  }

  const intervalMs = getAgentTeamIntervalMs();
  const intervalLabel =
    intervalMs % 3_600_000 === 0
      ? `${intervalMs / 3_600_000}h`
      : `${Math.round(intervalMs / 60_000)} min`;

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

  const scheduleAfter = (delayMs) => {
    if (nextTimer) clearTimeout(nextTimer);
    if (delayMs > 0) {
      const nextAt = new Date(Date.now() + delayMs).toISOString();
      console.log(
        `[agent-team] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; every ${intervalLabel} after completion)`,
      );
    } else {
      console.log("[agent-team] first pipeline run scheduled (startup)");
    }
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleAfter(intervalMs);
    }, delayMs);
  };

  scheduleAfter(0);

  if (!isDevTelegramConfigured()) {
    console.warn(
      "[agent-team] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID or digests are skipped",
    );
  }

  console.log(
    `[agent-team] enabled in code (opt-out: AGENT_TEAM_ENABLED=0); every ${intervalLabel}; Telegram: ${isDevTelegramConfigured() ? "on" : "off (set SYRA_DEV_BOT_*)"}`,
  );
  console.log(
    "[agent-team] hint: if this host sleeps or restarts often, use GitHub Actions (.github/workflows/agent-team-daily-wib.yml) + AGENT_TEAM_CRON_SECRET",
  );
}
