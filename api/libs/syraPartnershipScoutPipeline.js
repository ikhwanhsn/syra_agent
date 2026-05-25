/**
 * Syra Partnership Scout — on-chain signals → LLM → Telegram + MongoDB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { runSyraPartnershipScoutAgent } from "../agents/syra-partnership-scout-agent.js";
import { collectOnchainPartnershipSignals } from "./onchainPartnershipSignals.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { formatSyraPartnershipScoutTelegram } from "./syraPartnershipScoutDigests.js";
import { SYRA_PARTNERSHIP_SCOUT_DB_ID } from "../config/syraPartnershipScoutConfig.js";

export { SYRA_PARTNERSHIP_SCOUT_DB_ID };

/**
 * @returns {Promise<{ success: true; data: import("../agents/syra-partnership-scout-agent.js").SyraPartnershipScoutOutput }>}
 */
export async function runSyraPartnershipScoutPipeline() {
  const { candidates, sourceStats, ecosystemNotes } = await collectOnchainPartnershipSignals();

  const data = await runSyraPartnershipScoutAgent({
    candidates,
    ecosystemNotes,
    sourceStats,
    model: null,
  });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatSyraPartnershipScoutTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[syra-partnership-scout] Telegram send failed");
  }

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: SYRA_PARTNERSHIP_SCOUT_DB_ID },
    { id: SYRA_PARTNERSHIP_SCOUT_DB_ID, payload: data, savedAt },
    { upsert: true, new: true },
  );

  return { success: true, data };
}
