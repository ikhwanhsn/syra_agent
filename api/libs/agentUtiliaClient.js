/**
 * Utilia Solana transaction intelligence (x402).
 * @see https://api.utilia.ink/guides/priority-fees
 */
import { callExternalX402WithAgent } from './agentExternalX402Client.js';

const UTILIA_BASE = (process.env.UTILIA_API_BASE_URL || 'https://api.utilia.ink').replace(
  /\/$/,
  ''
);

/**
 * Buy the current Solana priority-fee quantiles with the agent's Solana wallet.
 *
 * @param {string} anonymousId
 * @param {Record<string, string>} params
 */
export async function callUtiliaPriorityFeesWithAgent(anonymousId, params = {}) {
  return callExternalX402WithAgent({
    anonymousId,
    baseUrl: UTILIA_BASE,
    pathTemplate: '/v1/fees/priority',
    method: 'GET',
    params,
    partnerLabel: 'Utilia',
    preferSolana: true,
  });
}

export const utiliaConfig = {
  baseUrl: UTILIA_BASE,
};
