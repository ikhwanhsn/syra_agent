/**
 * Skip paid agent tool calls when required params are missing (chat + POST /agent/tools/call).
 * Params are normalized string key-values; pump.fun `user` may be injected by enrichPumpfunToolParams.
 * Also validates path placeholders (:mint, :jobId), Zerion `{address}`, and Birdeye gates from AGENT_TOOLS.
 */

import { getAgentTool } from '../config/agentTools.js';
import { getBirdeyeGateMissing } from '../config/birdeyeAgentTools.js';

/**
 * @param {unknown} v
 * @returns {boolean}
 */
export function hasTrimmedString(v) {
  return v != null && String(v).trim() !== '';
}

/**
 * @param {Record<string, unknown>} p
 * @returns {unknown[] | null}
 */
function shareholdersFromParams(p) {
  const sh = p.shareholders;
  if (sh == null || sh === '') return null;
  if (Array.isArray(sh) && sh.length > 0) return sh;
  if (typeof sh === 'string') {
    try {
      const j = JSON.parse(sh);
      return Array.isArray(j) && j.length > 0 ? j : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function colonPathParamNames(path) {
  if (typeof path !== 'string') return [];
  const out = [];
  const re = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let m;
  while ((m = re.exec(path))) out.push(m[1]);
  return out;
}

/**
 * @param {string} template
 * @returns {string[]}
 */
function bracePathParamNames(template) {
  if (typeof template !== 'string') return [];
  const out = [];
  const re = /\{([a-zA-Z0-9_]+)\}/g;
  let m;
  while ((m = re.exec(template))) out.push(m[1]);
  return out;
}

function skipMsg(toolName, missing) {
  return `[Paid tool "${toolName}" was not run — no charge. Missing: ${missing.join(', ')}. Ask the user for these values. Do not invent data.]`;
}

/** Path placeholder :jobId may be sent as job_id in agent params. */
function paramPresent(p, name) {
  if (name === 'jobId') return hasTrimmedString(p.jobId) || hasTrimmedString(p.job_id);
  return hasTrimmedString(p[name]);
}

/** @type {Record<string, string[]>} — every listed key must be non-empty after trim. */
const REQUIRE_ALL_KEYS = {
  'exa-search': ['query'],
  'website-crawl': ['url'],
  '8004scan-agents-search': ['q'],
  '8004scan-agent': ['chainId', 'tokenId'],
  '8004scan-account-agents': ['address'],
  'quicknode-balance': ['chain', 'address'],
  'quicknode-rpc': ['chain', 'method'],
  'bubblemaps-maps': ['address'],
  'binance-orderbook': ['symbol'],
  'binance-spot-order': ['symbol'],
  'heylol-search': ['q'],
  'heylol-create-post': ['content'],
  'bankr-prompt': ['prompt'],
  'bankr-job': ['jobId'],
  'neynar-search': ['q'],
  'siwa-nonce': ['address', 'agentId'],
  'siwa-verify': ['message', 'signature'],
  'giza-protocols': ['token'],
  'giza-agent': ['owner'],
  'giza-portfolio': ['owner'],
  'giza-apr': ['owner'],
  'giza-performance': ['owner'],
  'giza-run': ['owner'],
  'giza-withdraw': ['owner'],
  'giza-top-up': ['owner', 'txHash'],
  'squid-route': ['fromAddress', 'fromChain', 'fromToken', 'fromAmount', 'toChain', 'toToken', 'toAddress'],
  'squid-status': ['transactionId', 'requestId', 'fromChainId', 'toChainId'],
  'nansen-token-screener': ['chain'],
};

const NANSEN_ADDRESS_TOOLS = new Set([
  'nansen-address-current-balance',
  'nansen-address-historical-balances',
  'nansen-profiler-counterparties',
]);

const NANSEN_TGM_TOOLS = new Set([
  'nansen-tgm-holders',
  'nansen-tgm-flow-intelligence',
  'nansen-tgm-flows',
  'nansen-tgm-dex-trades',
  'nansen-tgm-pnl-leaderboard',
]);

const NANSEN_SMART_MONEY_TOOLS = new Set([
  'nansen-smart-money-netflow',
  'nansen-smart-money-holdings',
  'nansen-smart-money-dex-trades',
]);

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
function firstSpecialMissing(toolId, p) {
  if (toolId === 'neynar-user') {
    if (!hasTrimmedString(p.username) && !hasTrimmedString(p.fids)) {
      return ['username or fids'];
    }
    return null;
  }
  if (toolId === 'neynar-cast') {
    if (!hasTrimmedString(p.identifier) && !hasTrimmedString(p.hash)) {
      return ['identifier or hash'];
    }
    return null;
  }
  if (toolId === 'quicknode-transaction') {
    if (!hasTrimmedString(p.chain)) return ['chain'];
    const c = String(p.chain).trim().toLowerCase();
    if (c === 'solana' && !hasTrimmedString(p.signature)) return ['signature (required when chain=solana)'];
    if (c === 'base' && !hasTrimmedString(p.txHash)) return ['txHash (required when chain=base)'];
    return null;
  }
  if (toolId === 'binance-spot-order-cancel') {
    const missing = [];
    if (!hasTrimmedString(p.symbol)) missing.push('symbol');
    if (!hasTrimmedString(p.orderId) && !hasTrimmedString(p.origClientOrderId)) {
      missing.push('orderId or origClientOrderId');
    }
    return missing.length ? missing : null;
  }
  if (toolId === 'giza-activate') {
    const missing = [];
    if (!hasTrimmedString(p.owner)) missing.push('owner');
    if (!hasTrimmedString(p.token)) missing.push('token');
    if (!hasTrimmedString(p.txHash)) missing.push('txHash');
    if (!hasTrimmedString(p.protocols)) missing.push('protocols');
    return missing.length ? missing : null;
  }
  if (toolId === 'giza-update-protocols') {
    const missing = [];
    if (!hasTrimmedString(p.owner)) missing.push('owner');
    if (!hasTrimmedString(p.protocols)) missing.push('protocols');
    return missing.length ? missing : null;
  }
  if (toolId === 'tempo-send-payout') {
    const raw = p.amountUsd ?? p.amount_usd;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return ['amountUsd (positive number)'];
    return null;
  }
  return null;
}

/**
 * @param {string} toolId
 * @param {string} method
 * @param {Record<string, unknown>} params
 * @returns {string | null}
 */
export function getAgentToolParamGateMessage(toolId, method, params) {
  const tool = getAgentTool(toolId);
  const id = tool?.id || toolId;
  const toolName = tool?.name || toolId;
  const m = (method || 'GET').toUpperCase();
  const p = params && typeof params === 'object' ? params : {};

  if (id === 'pumpfun-agents-create-coin' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.name)) missing.push('name');
    if (!hasTrimmedString(p.symbol)) missing.push('symbol');
    if (!hasTrimmedString(p.uri)) missing.push('uri');
    if (p.solLamports == null || String(p.solLamports).trim() === '') missing.push('solLamports');
    if (!hasTrimmedString(p.user)) missing.push('user (Solana wallet; defaults to agent wallet when linked)');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (id === 'pumpfun-agents-swap' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.inputMint)) missing.push('inputMint');
    if (!hasTrimmedString(p.outputMint)) missing.push('outputMint');
    if (p.amount == null || String(p.amount).trim() === '') missing.push('amount');
    if (!hasTrimmedString(p.user)) missing.push('user (defaults to agent wallet when linked)');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (id === 'pumpfun-collect-fees' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.mint)) missing.push('mint');
    if (!hasTrimmedString(p.user)) missing.push('user (defaults to agent wallet when linked)');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (id === 'pumpfun-sharing-config' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.mint)) missing.push('mint');
    if (!hasTrimmedString(p.user)) missing.push('user (defaults to agent wallet when linked)');
    if (!shareholdersFromParams(p)) missing.push('shareholders (non-empty JSON array of { address, bps })');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (id === 'pumpfun-agent-payments-build' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.agentMint)) missing.push('agentMint');
    if (!hasTrimmedString(p.currencyMint)) missing.push('currencyMint');
    if (!hasTrimmedString(p.user)) missing.push('user (defaults to agent wallet when linked)');
    if (p.amount == null || String(p.amount).trim() === '') missing.push('amount');
    if (p.memo == null || String(p.memo).trim() === '') missing.push('memo');
    if (p.startTime == null || String(p.startTime).trim() === '') missing.push('startTime');
    if (p.endTime == null || String(p.endTime).trim() === '') missing.push('endTime');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (id === 'pumpfun-agent-payments-verify' && m === 'POST') {
    const missing = [];
    if (!hasTrimmedString(p.agentMint)) missing.push('agentMint');
    if (!hasTrimmedString(p.currencyMint)) missing.push('currencyMint');
    if (!hasTrimmedString(p.user)) missing.push('user (defaults to agent wallet when linked)');
    for (const k of ['amount', 'memo', 'startTime', 'endTime']) {
      if (p[k] == null || String(p[k]).trim() === '') missing.push(k);
    }
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if ((id === 'pumpfun-coin-query' || id === 'pumpfun-coin') && m === 'GET') {
    if (!hasTrimmedString(p.mint)) return skipMsg(toolName, ['mint']);
    return null;
  }

  if (id === 'purch-vault-buy' && m === 'POST') {
    if (!hasTrimmedString(p.slug)) return skipMsg(toolName, ['slug']);
    return null;
  }

  if (NANSEN_ADDRESS_TOOLS.has(id)) {
    const missing = [];
    if (!hasTrimmedString(p.chain)) missing.push('chain');
    if (!hasTrimmedString(p.address)) missing.push('address');
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (NANSEN_TGM_TOOLS.has(id)) {
    const missing = [];
    if (!hasTrimmedString(p.chain)) missing.push('chain');
    if (!hasTrimmedString(p.token_address) && !hasTrimmedString(p.tokenAddress)) {
      missing.push('token_address');
    }
    if (missing.length) return skipMsg(toolName, missing);
    return null;
  }

  if (NANSEN_SMART_MONEY_TOOLS.has(id)) {
    if (!hasTrimmedString(p.chains)) return skipMsg(toolName, ['chains (e.g. JSON string ["solana"])']);
    return null;
  }

  const spec = firstSpecialMissing(id, p);
  if (spec && spec.length) return skipMsg(toolName, spec);

  const birdeyeMissing = getBirdeyeGateMissing(id, p);
  if (birdeyeMissing?.length) return skipMsg(toolName, birdeyeMissing);

  const allKeys = REQUIRE_ALL_KEYS[id];
  if (allKeys) {
    const missing = [];
    for (const k of allKeys) {
      if (k === 'jobId') {
        if (!hasTrimmedString(p.jobId) && !hasTrimmedString(p.job_id)) missing.push('jobId');
      } else if (!hasTrimmedString(p[k])) {
        missing.push(k);
      }
    }
    if (missing.length) return skipMsg(toolName, missing);
  }

  if (tool?.path) {
    const missing = [];
    for (const k of colonPathParamNames(tool.path)) {
      if (!paramPresent(p, k)) missing.push(k);
    }
    if (missing.length) return skipMsg(toolName, missing);
  }

  if (tool?.zerionPath) {
    const missing = [];
    for (const k of bracePathParamNames(tool.zerionPath)) {
      if (!hasTrimmedString(p[k])) missing.push(k);
    }
    if (missing.length) return skipMsg(toolName, missing);
  }

  if (tool?.birdeyePath) {
    const missing = [];
    for (const k of bracePathParamNames(tool.birdeyePath)) {
      if (!hasTrimmedString(p[k])) missing.push(k);
    }
    if (missing.length) return skipMsg(toolName, missing);
  }

  return null;
}
