/**
 * Blocksize Agentic Market Data (x402 / credits).
 * @see https://mcp.blocksize.info/
 */
import { callExternalX402WithAgent, callExternalX402WithTreasury } from './agentExternalX402Client.js';
import { randomUUID } from 'node:crypto';

const BLOCKSIZE_BASE = (
  process.env.BLOCKSIZE_API_BASE_URL || 'https://mcp.blocksize.info'
).replace(/\/$/, '');

function agentIdHeader(anonymousId) {
  const prefix = (process.env.BLOCKSIZE_AGENT_ID_PREFIX || 'syra').trim() || 'syra';
  const id = String(anonymousId || '').trim().slice(0, 48) || randomUUID().slice(0, 12);
  return `${prefix}-${id}`.slice(0, 64);
}

/**
 * @param {string} anonymousId
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 */
export async function callBlocksizeWithAgent(anonymousId, pathTemplate, method, params) {
  return callExternalX402WithAgent({
    anonymousId,
    baseUrl: BLOCKSIZE_BASE,
    pathTemplate,
    method: method || 'GET',
    params: params || {},
    extraHeaders: { 'X-AGENT-ID': agentIdHeader(anonymousId) },
    partnerLabel: 'Blocksize',
  });
}

/**
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 */
export async function callBlocksizeWithTreasury(pathTemplate, method, params) {
  return callExternalX402WithTreasury({
    baseUrl: BLOCKSIZE_BASE,
    pathTemplate,
    method: method || 'GET',
    params: params || {},
    extraHeaders: { 'X-AGENT-ID': agentIdHeader('treasury') },
    partnerLabel: 'Blocksize',
  });
}

export const blocksizeConfig = {
  baseUrl: BLOCKSIZE_BASE,
};
