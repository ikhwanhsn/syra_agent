/**
 * Agent team scheduler → crawl → internal research → business strategy → short Telegram digests → MongoDB.
 * Fifteen-slot roster: slots 1–6 here (surface scout, research lead, risk officer, strategy lead, GTM, revenue);
 * slots 7–14 live in growth + x402 schedulers; slot 15 (HR) runs in `internalHrCoachScheduler.js`.
 *
 * Schedule: once per calendar day at the WIB anchor in `./wibDailyWallClock.js` (default 06:00). No run on boot.
 *
 * External cron (optional): .github/workflows/agent-team-daily-wib.yml + POST /internal/agent-team/run.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { crawlSyraSurfaces } from "./agentTeamCrawl.js";
import { runInternalResearchAgent } from "../agents/internal-research-agent.js";
import { runBusinessStrategyAgent } from "../agents/business-strategy-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";
import { resolveInternalPipelineModel } from "../config/internalPipelineAgents.js";
import {
  formatSurfaceScoutTelegram,
  formatResearchLeadTelegram,
  formatRiskOfficerTelegram,
  formatStrategyLeadTelegram,
  formatGtmSpecialistTelegram,
  formatRevenueDesignerTelegram,
} from "./internalTeamDailyDigests.js";

/** Mongo document id for latest agent-team run. */
export const AGENT_TEAM_DB_ID = "agent-team-latest";

/** Re-export for callers that imported from this module. */
export { getMsUntilNextWibWallClock };

/**
 * @typedef {import("../agents/internal-research-agent.js").InternalResearchOutput} InternalResearchOutput
 */

/**
 * @typedef {import("../agents/business-strategy-agent.js").BusinessStrategyOutput} BusinessStrategyOutput
 */

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function sendTeamDigest(text) {
  if (!isDevTelegramConfigured()) return false;
  return sendDevTelegram(text, { disableWebPagePreview: true });
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
  const model = resolveInternalPipelineModel(null);
  const crawlOut = await crawlSyraSurfaces({});
  const { snapshot, generatedAt, baseUrls } = crawlOut;

  const scoutOk = await sendTeamDigest(
    formatSurfaceScoutTelegram({
      baseUrls,
      pageCount: snapshot.length,
      crawledAt: generatedAt,
    }),
  );
  if (!scoutOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (surface scout)");
  }

  const internal = await runInternalResearchAgent({ snapshot, model });

  const rOk = await sendTeamDigest(formatResearchLeadTelegram(internal));
  if (!rOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (research lead)");
  }
  const riskOk = await sendTeamDigest(formatRiskOfficerTelegram(internal));
  if (!riskOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (risk officer)");
  }

  const business = await runBusinessStrategyAgent({
    snapshot,
    internalResearch: internal,
    model,
  });

  const sOk = await sendTeamDigest(formatStrategyLeadTelegram(business));
  if (!sOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (strategy lead)");
  }
  const gtmOk = await sendTeamDigest(formatGtmSpecialistTelegram(business));
  if (!gtmOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (GTM specialist)");
  }
  const revOk = await sendTeamDigest(formatRevenueDesignerTelegram(business));
  if (!revOk && isDevTelegramConfigured()) {
    console.warn("[agent-team] Telegram send failed (revenue designer)");
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

/** Start in-process scheduler: next run at WIB anchor, then same wall clock daily. */
export function startAgentTeamScheduler() {
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

  const scheduleNextWibAnchor = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(
      new Date(),
      INTERNAL_AGENT_PIPELINES_WIB_HOUR,
      INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[agent-team] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(INTERNAL_AGENT_PIPELINES_WIB_HOUR).padStart(2, "0")}:${String(INTERNAL_AGENT_PIPELINES_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNextWibAnchor();
    }, delayMs);
  };

  scheduleNextWibAnchor();

  if (!isDevTelegramConfigured()) {
    console.warn(
      "[agent-team] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID or digests are skipped",
    );
  }

  console.log(
    `[agent-team] enabled; WIB daily ${String(INTERNAL_AGENT_PIPELINES_WIB_HOUR).padStart(2, "0")}:${String(INTERNAL_AGENT_PIPELINES_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta; Telegram: ${isDevTelegramConfigured() ? "on" : "off (set SYRA_DEV_BOT_*)"}`,
  );
  console.log(
    "[agent-team] dual-trigger OK: GitHub Actions (.github/workflows/agent-team-daily-wib.yml) can POST /internal/agent-team/run without changing this schedule",
  );
}
