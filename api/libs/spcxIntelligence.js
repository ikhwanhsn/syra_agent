/**
 * SPCX Intelligence — SpaceX IPO launch module (thin wrapper over equityIntelligence).
 */

import { buildEquityIntelligence, getEquityCatalogMeta } from "./equityIntelligence.js";

/**
 * Build SPCX-specific intelligence report (all venues + Nasdaq spread).
 * @returns {Promise<import('./equityIntelligence.js').EquityIntelligenceReport>}
 */
export async function buildSpcxIntelligence() {
  return buildEquityIntelligence({ symbol: "SPCXx" });
}

export { getEquityCatalogMeta };
