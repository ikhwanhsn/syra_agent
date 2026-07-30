/**
 * Yield.xyz AgentKit MCP client (read-only discovery/diligence).
 *
 * Speaks MCP Streamable HTTP as JSON-RPC POST to mcp.yield.xyz (same wire
 * format as StreamableHTTPClientTransport request/response). Upstream x402
 * (when free allowance is exhausted) is paid by Syra's Base/EVM treasury
 * wallet via ExactEvmScheme; agents are re-charged via agentDirect USDC charge.
 *
 * @see https://docs.yield.xyz/docs/agents-overview
 * @see https://mcp.yield.xyz/health
 */
import {
  registerRequiredExtensionsHook,
  registerBuilderCodeClientExtension,
} from './agentX402Client.js';

const DEFAULT_MCP_URL = 'https://mcp.yield.xyz/mcp';
const CLIENT_NAME = 'syra-yield-bridge';
const CLIENT_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';
const REQUEST_TIMEOUT_MS = Math.max(
  10_000,
  Number.parseInt(process.env.YIELD_MCP_TIMEOUT_MS || '45000', 10) || 45_000,
);

/** @type {typeof globalThis.fetch | null} */
let cachedPaymentFetch = null;
/** @type {string | null} */
let sessionId = null;
let initialized = false;
let rpcId = 1;
/** @type {Promise<void> | null} */
let initPromise = null;

/**
 * @returns {string}
 */
export function getYieldMcpUrl() {
  return String(process.env.YIELD_MCP_URL || DEFAULT_MCP_URL).trim().replace(/\/+$/, '') || DEFAULT_MCP_URL;
}

/**
 * Yield MCP needs no API key (wallet is the credential). Always available unless explicitly disabled.
 * @returns {boolean}
 */
export function hasYieldConfig() {
  if (String(process.env.YIELD_MCP_ENABLED || 'true').trim().toLowerCase() === 'false') {
    return false;
  }
  return true;
}

export const yieldConfig = {
  get configured() {
    return hasYieldConfig();
  },
  get mcpUrl() {
    return getYieldMcpUrl();
  },
};

/**
 * Resolve Base/EVM private key for upstream Yield x402 (CDP facilitator on Base).
 * @returns {string | null} 64-char hex without 0x, or null
 */
function resolveEvmPayerHex() {
  const raw = String(
    process.env.SYRA_EVM_PAYER_PRIVATE_KEY ||
      process.env.BASE_PAYER_PRIVATE_KEY ||
      process.env.CMC_PAYER_PRIVATE_KEY ||
      process.env.EVM_PRIVATE_KEY ||
      '',
  ).trim();
  if (!raw) return null;
  let hex = raw;
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex;
}

/**
 * Base (eip155) x402-paying fetch for Yield MCP. Falls back to raw fetch when no EVM key
 * (free allowance path). When a 402 arrives without a key, the call fails with a clear error.
 * @returns {Promise<typeof globalThis.fetch>}
 */
async function getYieldPaymentFetch() {
  if (cachedPaymentFetch) return cachedPaymentFetch;

  const hex = resolveEvmPayerHex();
  if (!hex) {
    cachedPaymentFetch = globalThis.fetch.bind(globalThis);
    return cachedPaymentFetch;
  }

  const { privateKeyToAccount } = await import('viem/accounts');
  const { wrapFetchWithPayment } = await import('@x402/fetch');
  const { x402Client } = await import('@x402/core/client');
  const { ExactEvmScheme } = await import('@x402/evm/exact/client');

  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
  const scheme = new ExactEvmScheme(account);
  const client = x402Client.fromConfig({
    schemes: [{ network: 'eip155:*', client: scheme }],
  });
  registerRequiredExtensionsHook(client);
  await registerBuilderCodeClientExtension(client);
  cachedPaymentFetch = wrapFetchWithPayment(globalThis.fetch.bind(globalThis), client);
  return cachedPaymentFetch;
}

/**
 * @param {unknown} value
 * @returns {string[] | undefined}
 */
function toStringArray(value) {
  if (value == null || value === '') return undefined;
  if (Array.isArray(value)) {
    const out = value.map((v) => String(v).trim()).filter(Boolean);
    return out.length ? out : undefined;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return toStringArray(parsed);
    } catch {
      // fall through to CSV split
    }
  }
  return s.split(/[,|]/).map((p) => p.trim()).filter(Boolean);
}

/**
 * @param {Record<string, unknown>} params
 * @returns {Record<string, unknown>}
 */
function normalizeArgs(params = {}) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null || v === '') continue;
    if (
      k === 'networks' ||
      k === 'types' ||
      k === 'yieldIds' ||
      k === 'inputTokens' ||
      k === 'providers' ||
      k === 'statuses'
    ) {
      const arr = toStringArray(v);
      if (arr) out[k] = arr;
      continue;
    }
    if (k === 'limit' || k === 'offset') {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = Math.trunc(n);
      continue;
    }
    if (k === 'hasCooldownPeriod' || k === 'hasWarmupPeriod') {
      if (typeof v === 'boolean') out[k] = v;
      else if (typeof v === 'string') out[k] = ['1', 'true', 'yes'].includes(v.trim().toLowerCase());
      continue;
    }
    out[k] = v;
  }
  return out;
}

/**
 * @param {unknown} content
 * @returns {unknown}
 */
function parseMcpContent(content) {
  if (content == null) return null;
  if (!Array.isArray(content)) return content;
  const texts = content
    .filter((c) => c && (c.type === 'text' || typeof c.text === 'string'))
    .map((c) => String(c.text || ''));
  if (!texts.length) return content;
  const joined = texts.join('\n').trim();
  if (!joined) return null;
  try {
    return JSON.parse(joined);
  } catch {
    return { text: joined };
  }
}

/**
 * Parse SSE or plain JSON MCP HTTP response bodies.
 * @param {string} raw
 * @returns {any}
 */
function parseMcpHttpBody(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (text.startsWith('{') || text.startsWith('[')) {
    return JSON.parse(text);
  }
  // text/event-stream: take last data: JSON line
  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  if (!dataLines.length) {
    throw new Error('Yield MCP response was not JSON or SSE data');
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

function resetSession() {
  sessionId = null;
  initialized = false;
  initPromise = null;
}

/**
 * @param {object} payload
 * @param {{ notification?: boolean }} [opts]
 */
async function mcpRequest(payload, opts = {}) {
  const fetchFn = await getYieldPaymentFetch();
  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': PROTOCOL_VERSION,
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchFn(getYieldMcpUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'manual',
    });

    const nextSession =
      res.headers.get('mcp-session-id') ||
      res.headers.get('Mcp-Session-Id') ||
      res.headers.get('MCP-Session-Id');
    if (nextSession) sessionId = nextSession;

    if (opts.notification) {
      if (!res.ok && res.status !== 202 && res.status !== 204) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(`Yield MCP notification failed: HTTP ${res.status} ${bodyText.slice(0, 200)}`);
      }
      return null;
    }

    const bodyText = await res.text();
    if (res.status === 402) {
      const needsPayer = !resolveEvmPayerHex();
      throw new Error(
        needsPayer
          ? `Yield.xyz HTTP 402 Payment Required; set SYRA_EVM_PAYER_PRIVATE_KEY (or BASE_PAYER_PRIVATE_KEY / CMC_PAYER_PRIVATE_KEY) for Base USDC. Body: ${bodyText.slice(0, 300)}`
          : `Yield.xyz HTTP 402 Payment Required after payment attempt. Body: ${bodyText.slice(0, 300)}`,
      );
    }
    if (!res.ok) {
      throw new Error(`Yield MCP HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
    }

    const parsed = parseMcpHttpBody(bodyText);
    if (parsed?.error) {
      const msg =
        typeof parsed.error === 'string'
          ? parsed.error
          : parsed.error.message || JSON.stringify(parsed.error);
      throw new Error(msg);
    }
    return parsed?.result ?? parsed;
  } finally {
    clearTimeout(timer);
  }
}

async function ensureInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await mcpRequest({
      jsonrpc: '2.0',
      id: rpcId++,
      method: 'initialize',
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: CLIENT_NAME, version: CLIENT_VERSION },
      },
    });
    await mcpRequest(
      {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      },
      { notification: true },
    );
    initialized = true;
  })().catch((err) => {
    resetSession();
    throw err;
  });

  return initPromise;
}

/**
 * @param {string} toolName
 * @param {Record<string, unknown>} [params]
 * @returns {Promise<{ ok: true; data: unknown } | { ok: false; error: string; status: number }>}
 */
export async function yieldCallTool(toolName, params = {}) {
  if (!hasYieldConfig()) {
    return {
      ok: false,
      error: 'Yield.xyz MCP is disabled (YIELD_MCP_ENABLED=false).',
      status: 503,
    };
  }

  const name = String(toolName || '').trim();
  if (!name) {
    return { ok: false, error: 'toolName is required', status: 400 };
  }

  const args = normalizeArgs(params);
  const started = Date.now();

  try {
    await ensureInitialized();
    const result = await mcpRequest({
      jsonrpc: '2.0',
      id: rpcId++,
      method: 'tools/call',
      params: { name, arguments: args },
    });

    if (result?.isError) {
      const parsed = parseMcpContent(result.content);
      const msg =
        (parsed && typeof parsed === 'object' && typeof /** @type {any} */ (parsed).error === 'string'
          ? /** @type {any} */ (parsed).error
          : null) ||
        (parsed && typeof parsed === 'object' && typeof /** @type {any} */ (parsed).text === 'string'
          ? /** @type {any} */ (parsed).text
          : null) ||
        `Yield MCP tool ${name} returned an error`;
      return { ok: false, error: msg, status: 502 };
    }

    const data = parseMcpContent(result?.content);
    return {
      ok: true,
      data: {
        tool: name,
        result: data,
        fetchedAt: new Date().toISOString(),
        latencyMs: Date.now() - started,
        source: 'yield.xyz',
      },
    };
  } catch (err) {
    resetSession();
    const msg = err instanceof Error ? err.message : String(err);
    const aborted = /aborted|timeout/i.test(msg);
    const needsPayer = /\b402\b|payment required|PAYMENT-REQUIRED|x402/i.test(msg) && !resolveEvmPayerHex();
    return {
      ok: false,
      error: needsPayer
        ? `Yield.xyz requires Base USDC x402 payment; set SYRA_EVM_PAYER_PRIVATE_KEY (or BASE_PAYER_PRIVATE_KEY / CMC_PAYER_PRIVATE_KEY). Upstream: ${msg}`
        : msg,
      status: needsPayer ? 402 : aborted ? 504 : 502,
    };
  }
}

/**
 * @returns {Promise<{ ok: true; data: unknown } | { ok: false; error: string; status: number }>}
 */
export async function yieldListTools() {
  if (!hasYieldConfig()) {
    return {
      ok: false,
      error: 'Yield.xyz MCP is disabled (YIELD_MCP_ENABLED=false).',
      status: 503,
    };
  }
  try {
    await ensureInitialized();
    const listed = await mcpRequest({
      jsonrpc: '2.0',
      id: rpcId++,
      method: 'tools/list',
      params: {},
    });
    return {
      ok: true,
      data: {
        tools: listed?.tools || [],
        mcpUrl: getYieldMcpUrl(),
        fetchedAt: new Date().toISOString(),
        source: 'yield.xyz',
      },
    };
  } catch (err) {
    resetSession();
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      status: 502,
    };
  }
}

/** Discovery: search/filter yields */
export function yieldFind(params = {}) {
  return yieldCallTool('yields_get_all', params);
}

/** Diligence: full metadata for one yield */
export function yieldOpportunity(params = {}) {
  return yieldCallTool('yields_get', params);
}

/** Discovery: supported networks */
export function yieldNetworks(params = {}) {
  return yieldCallTool('networks_get_all', params);
}

/** Discovery: protocols / providers */
export function yieldProviders(params = {}) {
  return yieldCallTool('providers_get_all', params);
}

/** Diligence: risk rating */
export function yieldRisk(params = {}) {
  return yieldCallTool('yields_get_risk', params);
}

/** Diligence: historical reward rate / APY */
export function yieldRewardHistory(params = {}) {
  return yieldCallTool('yields_get_reward_rate_history', params);
}

/** Diligence: historical TVL */
export function yieldTvlHistory(params = {}) {
  return yieldCallTool('yields_get_tvl_history', params);
}

/** Tracking: wallet balances / pending actions / claimable rewards */
export function yieldBalances(params = {}) {
  return yieldCallTool('yields_get_balances', params);
}

/**
 * Map Syra tool id → Yield MCP tool name.
 * @type {Record<string, string>}
 */
export const YIELD_TOOL_MCP_NAMES = Object.freeze({
  'yield-find': 'yields_get_all',
  'yield-get': 'yields_get',
  'yield-networks': 'networks_get_all',
  'yield-providers': 'providers_get_all',
  'yield-risk': 'yields_get_risk',
  'yield-reward-history': 'yields_get_reward_rate_history',
  'yield-tvl-history': 'yields_get_tvl_history',
  'yield-balances': 'yields_get_balances',
});

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} params
 */
export async function runYieldAgentTool(toolId, params = {}) {
  const mcpName = YIELD_TOOL_MCP_NAMES[toolId];
  if (!mcpName) {
    return { ok: false, error: `Unknown Yield tool: ${toolId}`, status: 400 };
  }
  return yieldCallTool(mcpName, params);
}

/** Close / reset session state (no persistent sockets). */
export async function closeYieldMcpClient() {
  resetSession();
}

/** Test helper — clear cached client/fetch. */
export function __resetYieldMcpClientForTests() {
  resetSession();
  cachedPaymentFetch = null;
  rpcId = 1;
}
