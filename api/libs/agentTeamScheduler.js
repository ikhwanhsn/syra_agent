/**
 * Agent team scheduler → crawl → internal research → business strategy → Telegram → MongoDB.
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
