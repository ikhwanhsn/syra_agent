/**
 * One-time helper: extract POST /agent/tools/call handler into agentToolExecutor.js
 * Run: node scripts/extract-agent-tool-executor.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const src = readFileSync(path.join(repoRoot, 'api/routes/agent/tools.js'), 'utf8');
const start = src.indexOf("router.post('/call'");
const handlerStart = src.indexOf('async (req, res) => {', start);
const handlerEnd = src.lastIndexOf('});', src.indexOf('export async function createAgentToolsRouter'));
let body = src.slice(handlerStart + 'async (req, res) => {'.length, handlerEnd);

const header = `/**
 * Shared agent tool execution — used by POST /agent/tools/call and POST /mcp/tools/call.
 */
import { getAgentTool, normalizeJupiterSwapParams } from '../config/agentTools.js';
import { X402_PAYSH_FLOOR_USD, PASSTHROUGH_MARGIN } from '../config/x402Pricing.js';
import { getEffectiveAgentToolPriceUsd } from './pactPricing.js';
import {
  callX402V2WithAgent,
  signAndSubmitSerializedTransaction,
  signAndSubmitSwapTransaction,
} from './agentX402Client.js';
import {
  enrichPumpfunToolParams,
  omitParamsKeys,
  substituteAgentToolPath,
  PUMPFUN_TX_TOOL_IDS,
} from './agentPumpfunTools.js';
import { pickSignalToolQueryParams } from './agentSignalToolQuery.js';
import { getAgentToolParamGateMessage } from './agentToolParamGate.js';
import { enrichGmgnToolParams } from './gmgnToolParams.js';
import { callNansenWithAgent } from './agentNansenClient.js';
import { callZerionWithAgent } from './agentZerionClient.js';
import { callBirdeyeWithAgent } from './agentBirdeyeClient.js';
import { callStablecryptoWithAgent } from './agentStablecryptoClient.js';
import { callStablesocialWithAgent } from './agentStablesocialClient.js';
import { callStableenrichWithAgent } from './agentStableenrichClient.js';
import {
  purchVaultSearch,
  purchVaultBuy,
  purchVaultDownload,
} from './agentPurchVaultClient.js';
import {
  getAgentUsdcBalance,
  getAgentAddress,
  getConnectedWalletAddress,
  getTempoPayoutRecipientAddress,
  ensureSwapToolsAllowed,
} from './agentWallet.js';
import { sendTempoPayout } from './tempoPayout.js';
import { TEMPO_PUBLIC_REFERENCE, fetchTempoTokenList } from './tempoPublic.js';
import { runAgentPartnerDirectTool } from './agentPartnerDirectTools.js';
import { chargeAgentForInternalTool } from './agentInternalToolCharge.js';
import {
  runPayshToolForAgent,
  fetchCatalog,
  findProvider,
  parsePayshForceRefresh,
} from './payshClient.js';
import { runAgentscoreToolForAgent } from './agentscoreClient.js';
import { resolveAgentBaseUrl } from '../routes/agent/utils.js';

/** @param {number} status @param {Record<string, unknown>} body */
function respond(status, body) {
  return { status, body };
}

/**
 * @param {{
 *   anonymousId: string;
 *   toolId: string;
 *   params?: Record<string, unknown>;
 *   ctx?: {
 *     host?: string;
 *     user?: { guest?: boolean; sessionId?: string };
 *     ip?: string;
 *     userAgent?: string;
 *     skipGuestTxBlock?: boolean;
 *   };
 * }} input
 */
export async function executeAgentToolCall(input) {
  const { anonymousId, toolId, params: rawParams = {}, ctx = {} } = input;
  try {
`;

body = body
  .replace(/const \{ anonymousId, toolId, params: rawParams = \{\} \} = req\.body \|\| \{\};/, '')
  .replace(/return res\.status\((\d+)\)\.json\(/g, 'return respond($1, ')
  .replace(/return res\.status\(([^)]+)\)\.json\(/g, 'return respond($1, ')
  .replace(/return res\.json\(/g, 'return respond(200, ')
  .replace(/req\.get\('host'\)/g, 'ctx.host')
  .replace(/req\.user\?\./g, 'ctx.user?.')
  .replace(/req\.ip/g, 'ctx.ip')
  .replace(/req\.get\('user-agent'\)/g, 'ctx.userAgent')
  .replace(/resolveAgentBaseUrl\(req\)/g, 'resolveAgentBaseUrl()')
  .replace(
    /if \(requiresTxSign && ctx\.user\?\.guest\)/,
    'if (requiresTxSign && ctx.user?.guest && !ctx.skipGuestTxBlock)',
  );

const footer = `  } catch (error) {
    return respond(500, {
      success: false,
      error: error.message || 'Tool call failed',
    });
  }
}
`;

writeFileSync(path.join(repoRoot, 'api/libs/agentToolExecutor.js'), header + body + footer, 'utf8');
console.log('Wrote api/libs/agentToolExecutor.js');
