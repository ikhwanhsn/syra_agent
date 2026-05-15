/**
 * Up Only Fund — internal **development** agent team (15 Telegram digests: scout + 13 specialists + HR).
 * Not mounted on uponly.fund; uses Syra dev Telegram bot (SYRA_DEV_BOT_*).
 *
 * Schedule: daily WIB wall clock from {@link UPONLY_FUND_DEV_TEAM_WIB_HOUR} / {@link UPONLY_FUND_DEV_TEAM_WIB_MINUTE}.
 * Cron: POST /internal/uponly-fund-dev-team/run with optional x-uponly-fund-dev-team-cron-secret.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { crawlUponlyFundSurfaces } from "./agentTeamUponlyCrawl.js";
import { runUponlyFundDevSpecialistsAgent } from "../agents/uponly-fund-dev-specialists-agent.js";
import { runUponlyFundHrCoachAgent } from "../agents/uponly-fund-hr-coach-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import {
  getMsUntilNextWibWallClock,
} from "./wibDailyWallClock.js";
import { resolveInternalPipelineModel } from "../config/internalPipelineAgents.js";
import {
  UPONLY_FUND_DEV_TEAM_WIB_HOUR,
  UPONLY_FUND_DEV_TEAM_WIB_MINUTE,
  getUponlyFundDevTeamRole,
} from "../config/uponlyFundDevTeamConfig.js";
import {
  formatUponlyFundSurfaceScoutTelegram,
  formatUponlyFundSpecialistTelegram,
  formatUponlyFundHrCoachTelegram,
} from "./uponlyFundDevTeamDigests.js";

/** Mongo document id for latest run (GET /internal/uponly-fund-dev-team/latest). */
export const UPONLY_FUND_DEV_TEAM_DB_ID = "uponly-fund-dev-team-latest";

/**
 * @param {import("../agents/uponly-fund-dev-specialists-agent.js").UponlyDevSpecialistsOutput} specialists
 * @returns {string}
 */
function buildHrBriefFromSpecialists(specialists) {
  const lines = [];
  for (const s of specialists.specialists || []) {
    const first = Array.isArray(s.bullets) && s.bullets[0] ? String(s.bullets[0]).trim() : "";
    const one = first.replace(/\s+/g, " ");
    const clipped = one.length > 200 ? `${one.slice(0, 199)}…` : one;
    lines.push(`Slot ${s.slot}: ${clipped || "(empty)"}`);
  }
  return `Up Only Fund dev team digest context (slots 2–14 first bullets):\n${lines.join("\n")}`;
}

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function sendDigest(text) {
  if (!isDevTelegramConfigured()) return false;
  return sendDevTelegram(text, { disableWebPagePreview: true });
}

/**
 * @returns {Promise<{ success: true; data: Record<string, unknown> }>}
 */
export async function runUponlyFundDevAgentTeamPipeline() {
  const model = resolveInternalPipelineModel(null);
  const crawlOut = await crawlUponlyFundSurfaces({});
  const { snapshot, generatedAt, baseUrls } = crawlOut;

  const scoutOk = await sendDigest(
    formatUponlyFundSurfaceScoutTelegram({
      baseUrls,
      pageCount: snapshot.length,
      crawledAt: generatedAt,
    }),
  );
  if (!scoutOk && isDevTelegramConfigured()) {
    console.warn("[uponly-fund-dev-team] Telegram send failed (surface scout)");
  }

  const specialists = await runUponlyFundDevSpecialistsAgent({ snapshot, model });

  for (const row of specialists.specialists) {
    const meta = getUponlyFundDevTeamRole(row.slot);
    const title = meta?.title || `Slot ${row.slot}`;
    const msg = formatUponlyFundSpecialistTelegram(
      row.slot,
      title,
      specialists.generatedAt,
      row.bullets,
    );
    const ok = await sendDigest(msg);
    if (!ok && isDevTelegramConfigured()) {
      console.warn(`[uponly-fund-dev-team] Telegram send failed (slot ${row.slot})`);
    }
  }

  const brief = buildHrBriefFromSpecialists(specialists);
  const hr = await runUponlyFundHrCoachAgent({ model, brief });

  const hrOk = await sendDigest(formatUponlyFundHrCoachTelegram(hr));
  if (!hrOk && isDevTelegramConfigured()) {
    console.warn("[uponly-fund-dev-team] Telegram send failed (HR coach)");
  }

  const savedAt = new Date();
  const payload = {
    crawl: {
      baseUrls,
      crawledAt: generatedAt,
      pageCount: snapshot.length,
      surfaces: snapshot.map((s) => s.url),
    },
    specialists,
    hr,
    model,
    savedAt: savedAt.toISOString(),
  };

  await DashboardResearch.findOneAndUpdate(
    { id: UPONLY_FUND_DEV_TEAM_DB_ID },
    {
      id: UPONLY_FUND_DEV_TEAM_DB_ID,
      payload,
      savedAt,
    },
    { upsert: true, new: true },
  );

  return {
    success: true,
    data: payload,
  };
}

/** Start in-process scheduler at WIB anchor (staggered minute vs Syra 06:00). */
export function startUponlyFundDevAgentScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[uponly-fund-dev-team] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runUponlyFundDevAgentTeamPipeline();
      console.log("[uponly-fund-dev-team] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[uponly-fund-dev-team] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Up Only Fund · Dev Internal — run failed\n${msg.slice(0, 3500)}`,
          { disableWebPagePreview: true },
        );
      }
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(
      new Date(),
      UPONLY_FUND_DEV_TEAM_WIB_HOUR,
      UPONLY_FUND_DEV_TEAM_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[uponly-fund-dev-team] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(UPONLY_FUND_DEV_TEAM_WIB_HOUR).padStart(2, "0")}:${String(UPONLY_FUND_DEV_TEAM_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();

  if (!isDevTelegramConfigured()) {
    console.warn(
      "[uponly-fund-dev-team] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID or digests are skipped",
    );
  }

  console.log(
    `[uponly-fund-dev-team] enabled; WIB daily ${String(UPONLY_FUND_DEV_TEAM_WIB_HOUR).padStart(2, "0")}:${String(UPONLY_FUND_DEV_TEAM_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta; Telegram: ${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
