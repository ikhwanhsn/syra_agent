/**
 * Outcome job scheduler: cron ticks for managed outcome products.
 */
import { runOutcomeJobsForProduct } from "./outcomeJobRuntime.js";
import { OUTCOME_PRODUCT_ORDER } from "../config/outcomeProducts.js";

/**
 * Run scheduled ticks for all active outcome products.
 */
export async function runOutcomeSchedulerTick() {
  const results = {};

  for (const productId of ["treasury_autopilot", "yield_autopilot"]) {
    try {
      results[productId] = await runOutcomeJobsForProduct(productId);
    } catch (err) {
      results[productId] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { tickAt: new Date().toISOString(), products: OUTCOME_PRODUCT_ORDER, results };
}

/**
 * Run a single product tick (for cron routes).
 * @param {string} productId
 */
export async function runOutcomeProductTick(productId) {
  return runOutcomeJobsForProduct(productId);
}
