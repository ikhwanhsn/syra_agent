/**
 * HR coach scheduler — runs once per day shortly after the WIB anchor so other pipelines
 * have usually persisted to Mongo; one small OpenRouter call + Telegram + DB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { runInternalHrCoachAgent } from "../agents/internal-hr-coach-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";
import { formatHrCoachTelegram } from "./internalTeamDailyDigests.js";
import { AGENT_TEAM_DB_ID } from "./agentTeamScheduler.js";
import { X402_X_TRENDS_DB_ID } from "./x402XTrendsScheduler.js";
import {
  GROWTH_SYRA_MARKET_DB_ID,
  GROWTH_SYRA_SOCIAL_DB_ID,
  GROWTH_SECTOR_NARRATIVE_DB_ID,
} from "./growthInternalAgentsScheduler.js";

/** Latest HR coaching document (GET /internal/hr-coach/latest). */
export const INTERNAL_HR_COACH_DB_ID = "internal-hr-coach-latest";

/** Extra delay after WIB anchor so agent-team / x402 / growth runs can finish writing Mongo. */
const HR_COACH_DELAY_AFTER_WIB_MS = 15 * 60 * 1000;

/**
 * @param {string} [s]
 * @param {number} max
 */
function oneLine(s, max) {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Compact text for HR only (token-cheap).
 * @returns {Promise<string>}
 */
export async function buildInternalTeamBriefForHr() {
  const ids = [
    AGENT_TEAM_DB_ID,
    GROWTH_SYRA_MARKET_DB_ID,
    GROWTH_SYRA_SOCIAL_DB_ID,
    GROWTH_SECTOR_NARRATIVE_DB_ID,
    X402_X_TRENDS_DB_ID,
  ];
  const docs = await DashboardResearch.find({ id: { $in: ids } }).lean();
  const byId = new Map(docs.map((d) => [d.id, d.payload]));

  /** @type {string[]} */
  const lines = [];

  const team = byId.get(AGENT_TEAM_DB_ID);
  if (team?.internal?.summary) {
    lines.push(`Research summary: ${oneLine(team.internal.summary, 260)}`);
  }
  if (team?.internal?.risks?.length) {
    lines.push(`Risks count: ${team.internal.risks.length} (top: ${oneLine(team.internal.risks[0], 120)})`);
  }
  if (team?.business?.marketPosition) {
    lines.push(`Strategy: ${oneLine(team.business.marketPosition, 260)}`);
  }
  if (team?.business?.gtmRecommendations?.length) {
    const g0 = team.business.gtmRecommendations[0];
    const t = g0 && typeof g0.title === "string" ? g0.title : "";
    if (t) lines.push(`GTM sample: ${oneLine(t, 160)}`);
  }

  const mkt = byId.get(GROWTH_SYRA_MARKET_DB_ID);
  if (mkt?.summary) lines.push(`Market: ${oneLine(mkt.summary, 240)}`);
  if (mkt?.oneLineNorthStar) lines.push(`North star: ${oneLine(mkt.oneLineNorthStar, 160)}`);

  const soc = byId.get(GROWTH_SYRA_SOCIAL_DB_ID);
  if (soc?.summary) lines.push(`Social: ${oneLine(soc.summary, 240)}`);
  if (soc?.sentiment) lines.push(`Social mood: ${String(soc.sentiment)}`);

  const sec = byId.get(GROWTH_SECTOR_NARRATIVE_DB_ID);
  if (sec?.summary) lines.push(`Sector: ${oneLine(sec.summary, 240)}`);
  if (sec?.macroHeadline) lines.push(`Macro: ${oneLine(sec.macroHeadline, 160)}`);

  const x4 = byId.get(X402_X_TRENDS_DB_ID);
  if (x4?.summary) lines.push(`x402: ${oneLine(x4.summary, 240)}`);

  if (lines.length === 0) {
    return "No persisted internal payloads yet — run the other pipelines first.";
  }
  return `Context: Syra + Up Only — 15-slot internal team; optimize signal per token and cost.\n\n${lines.join("\n")}`;
}

/**
 * @returns {Promise<{ success: true; data: { coaching: string; generatedAt: string } }>}
 */
export async function runInternalHrCoachPipeline() {
  const brief = await buildInternalTeamBriefForHr();
  const data = await runInternalHrCoachAgent({ model: null, brief });

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: INTERNAL_HR_COACH_DB_ID },
    {
      id: INTERNAL_HR_COACH_DB_ID,
      payload: data,
      savedAt,
    },
    { upsert: true, new: true },
  );

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatHrCoachTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[internal-hr-coach] Telegram send failed");
  }

  return { success: true, data };
}

/** Start scheduler: WIB anchor + {@link HR_COACH_DELAY_AFTER_WIB_MS}, then daily same offset. */
export function startInternalHrCoachScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[internal-hr-coach] skipped tick: still running");
      return;
    }
    running = true;
    try {
      await runInternalHrCoachPipeline();
      console.log("[internal-hr-coach] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[internal-hr-coach] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra · Internal Team 15/15 — HR · Team Coach\n\nRun failed:\n${msg.slice(0, 800)}`,
          { disableWebPagePreview: true },
        );
      }
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs =
      getMsUntilNextWibWallClock(
        new Date(),
        INTERNAL_AGENT_PIPELINES_WIB_HOUR,
        INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
      ) + HR_COACH_DELAY_AFTER_WIB_MS;
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[internal-hr-coach] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; WIB + ${Math.round(HR_COACH_DELAY_AFTER_WIB_MS / 60000)}m)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();

  console.log(
    `[internal-hr-coach] enabled; WIB + ${Math.round(HR_COACH_DELAY_AFTER_WIB_MS / 60000)}m; Telegram: ${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
