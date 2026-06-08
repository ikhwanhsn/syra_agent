/**
 * Syra Growth Scout pipeline — metrics + social → LLM → Telegram + MongoDB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { runSyraGrowthScoutAgent } from "../agents/syra-growth-scout-agent.js";
import { collectGrowthScoutSignals } from "./growthScoutSignals.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { formatSyraGrowthScoutTelegram } from "./syraGrowthScoutDigests.js";
import { SYRA_GROWTH_SCOUT_DB_ID } from "../config/syraGrowthScoutConfig.js";

export { SYRA_GROWTH_SCOUT_DB_ID };

/**
 * @returns {Promise<{ success: true; data: import("../agents/syra-growth-scout-agent.js").SyraGrowthScoutOutput }>}
 */
export async function runSyraGrowthScoutPipeline() {
  const signals = await collectGrowthScoutSignals();

  const data = await runSyraGrowthScoutAgent({
    metrics: signals.metrics,
    metricsNotes: signals.metricsNotes,
    lpOverview: signals.lpOverview,
    syraSocialTweets: signals.syraSocialTweets,
    sectorTweets: signals.sectorTweets,
    trendScoutSummary: signals.trendScoutSummary,
    model: null,
  });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatSyraGrowthScoutTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[syra-growth-scout] Telegram send failed");
  }

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: SYRA_GROWTH_SCOUT_DB_ID },
    { id: SYRA_GROWTH_SCOUT_DB_ID, payload: data, savedAt },
    { upsert: true, new: true },
  );

  return { success: true, data };
}
