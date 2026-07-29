/**
 * Record a successful paid API call for KPI tracking.
 * Fire-and-forget: never throws; logs errors so response is not blocked.
 * @param {object} req - Express request (must have req.path)
 * @param {{ source?: string; promptId?: string; creatorAnonymousId?: string; amountMicroUsdc?: number }} [options]
 */
import PaidApiCall from '../models/PaidApiCall.js';
import { recordSkillAttribution } from '../libs/earnService.js';

const INBOUND_CLIENT_SOURCES = new Set(['mcp', 'mcp-server', 'sdk', 'api', 'agent']);

/** Prefer options.source; else X-Syra-Source header; else api. */
function resolvePaidCallSource(req, options = {}) {
  if (options.source) return String(options.source);
  const raw = req?.headers?.['x-syra-source'] ?? req?.headers?.['X-Syra-Source'];
  const value = String(Array.isArray(raw) ? raw[0] : raw || '')
    .trim()
    .toLowerCase();
  if (value && INBOUND_CLIENT_SOURCES.has(value)) return value;
  return 'api';
}

export async function recordPaidApiCall(req, options = {}) {
  if (!req?.path) return;
  const network =
    options.network ||
    req?.x402Payment?.accepted?.network ||
    req?.x402Payment?.network ||
    null;
  try {
    const doc = await PaidApiCall.create({
      path: req.path,
      source: resolvePaidCallSource(req, options),
      ...(network ? { network: String(network) } : {}),
    });

    if (options.promptId || options.creatorAnonymousId) {
      recordSkillAttribution({
        promptId: options.promptId,
        creatorAnonymousId: options.creatorAnonymousId,
        paidPath: req.path,
        amountMicroUsdc: options.amountMicroUsdc,
        paidApiCallId: doc._id,
      }).catch(() => {});
    }
  } catch {
    // Fire-and-forget: payment flow is never broken
  }
}
