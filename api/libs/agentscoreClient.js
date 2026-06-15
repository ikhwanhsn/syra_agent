/**
 * AgentScore buyer-side client: discover gated merchants, probe 402/403, pay with Passport identity.
 * Modeled on payshClient.js; uses agent Solana wallet + optional X-Operator-Token.
 */
import { AgentScore } from '@agent-score/sdk';
import { getAgentKeypair } from './agentWallet.js';
import { pay402AndRetry } from './agentX402Client.js';
import { getAgentFetch } from './agentFetch.js';
import { getAgentscoreApiKey, getAgentscoreOperatorToken } from './agentscoreConfig.js';

/** @typedef {{ success: true; data: unknown } | { success: false; error: string; status?: number; identityRequired?: boolean; budgetExceeded?: boolean }} AgentscoreToolResult */

const KNOWN_MERCHANTS = Object.freeze([
  {
    name: 'Martin Estate',
    url: 'https://agents.martinestate.com',
    skill: 'https://agents.martinestate.com/skill.md',
    category: 'regulated-commerce',
    gates: ['kyc', 'age21', 'sanctions', 'us-only'],
    rails: ['x402-base', 'mpp-tempo', 'mpp-solana', 'stripe'],
  },
  {
    name: 'Sayer & Stone',
    url: 'https://agents.sayerandstone.com',
    skill: 'https://agents.sayerandstone.com/skill.md',
    category: 'general-commerce',
    gates: [],
    rails: ['x402-base', 'mpp-tempo', 'mpp-solana', 'stripe'],
  },
]);

function bazaarUrl() {
  return (process.env.AGENTSCORE_BAZAAR_URL || 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources').trim();
}

/**
 * @returns {AgentScore | null}
 */
function getSdkClient() {
  const apiKey = getAgentscoreApiKey();
  if (!apiKey) return null;
  return new AgentScore({
    apiKey,
    userAgent: 'syra-api/agentscore-client',
  });
}

/**
 * @param {Record<string, string>} params
 */
function parseMaxSpend(params) {
  const raw = params.maxSpend ?? params.max_spend ?? params.maxPrice ?? params.max_price;
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * @param {Record<string, string>} params
 * @returns {Promise<AgentscoreToolResult>}
 */
export async function runAgentscoreDiscover(params = {}) {
  const q = String(params.q || params.query || '').trim().toLowerCase();
  const chain = String(params.chain || '').trim().toLowerCase();
  const maxPrice = params.maxPrice != null ? Number(params.maxPrice) : undefined;
  const limitRaw = params.limit != null ? Number(params.limit) : 25;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 25;

  /** @type {Array<Record<string, unknown>>} */
  let items = [...KNOWN_MERCHANTS];

  try {
    const url = bazaarUrl();
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const body = await res.json();
      const resources = Array.isArray(body?.resources)
        ? body.resources
        : Array.isArray(body?.items)
          ? body.items
          : [];
      for (const r of resources) {
        const resourceUrl = typeof r === 'string' ? r : r?.url || r?.resource;
        if (typeof resourceUrl === 'string' && resourceUrl.startsWith('http')) {
          items.push({
            name: resourceUrl,
            url: resourceUrl.replace(/\/[^/]*$/, ''),
            skill: null,
            category: 'x402-bazaar',
            gates: [],
            rails: ['x402'],
          });
        }
      }
    }
  } catch (e) {
    console.warn('[agentscore] bazaar fetch skipped:', e?.message || e);
  }

  if (q) {
    items = items.filter((m) => {
      const hay = `${m.name} ${m.url} ${m.category} ${(m.gates || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (chain) {
    items = items.filter((m) => (m.rails || []).some((r) => String(r).includes(chain)));
  }
  if (Number.isFinite(maxPrice)) {
    items = items.filter((m) => m.min_price_usd == null || Number(m.min_price_usd) <= maxPrice);
  }

  return {
    success: true,
    data: {
      count: items.length,
      merchants: items.slice(0, limit),
      note: 'Use agentscore-check to probe a URL; agentscore-pay to purchase (Solana x402 + Passport). MPP/Base rails may require @agent-score/pay CLI.',
    },
  };
}

/**
 * @param {Record<string, string>} params
 * @returns {Promise<AgentscoreToolResult>}
 */
export async function runAgentscoreCheck(params = {}) {
  const url = String(params.url || '').trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return { success: false, error: 'url is required (https://...)', status: 400 };
  }

  const method = String(params.method || 'GET').trim().toUpperCase();
  const bodyRaw = params.body;
  /** @type {Record<string, unknown> | undefined} */
  let body;
  if (bodyRaw != null && String(bodyRaw).trim() !== '') {
    try {
      body = JSON.parse(String(bodyRaw));
    } catch {
      return { success: false, error: 'body must be valid JSON', status: 400 };
    }
  }

  const headers = { Accept: 'application/json' };
  if (body != null && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  const operatorToken = String(params.operatorToken || params.operator_token || getAgentscoreOperatorToken() || '').trim();
  if (operatorToken) headers['X-Operator-Token'] = operatorToken;

  const wallet = String(params.walletAddress || params.wallet || '').trim();
  if (wallet) headers['X-Wallet-Address'] = wallet;

  try {
    const res = await fetch(url, {
      method,
      headers,
      redirect: 'manual',
      ...(body != null && method !== 'GET' && method !== 'HEAD' ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 4000) };
    }

    return {
      success: true,
      data: {
        status: res.status,
        identityRequired: res.status === 403 && (parsed?.verify_url || parsed?.session_id),
        paymentRequired: res.status === 402,
        headers: {
          paymentRequired: res.headers.get('payment-required') || res.headers.get('Payment-Required') || null,
          wwwAuthenticate: res.headers.get('www-authenticate') || null,
        },
        body: parsed,
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e), status: 502 };
  }
}

/**
 * @param {Record<string, string>} params
 * @returns {Promise<AgentscoreToolResult>}
 */
export async function runAgentscorePassportStatus(params = {}) {
  const operatorToken = String(
    params.operatorToken || params.operator_token || getAgentscoreOperatorToken() || ''
  ).trim();

  if (!operatorToken) {
    return {
      success: true,
      data: {
        configured: false,
        message:
          'No operator token. Set AGENTSCORE_OPERATOR_TOKEN on the server or pass operatorToken after agentscore-pay passport login.',
      },
    };
  }

  const client = getSdkClient();
  if (!client) {
    return {
      success: true,
      data: {
        configured: true,
        operatorTokenPrefix: `${operatorToken.slice(0, 8)}…`,
        assessSkipped: true,
        message: 'AGENTSCORE_API_KEY not set — token present but live assess skipped.',
      },
    };
  }

  try {
    const assess = await client.assess(null, { operatorToken });
    return {
      success: true,
      data: {
        configured: true,
        operatorTokenPrefix: `${operatorToken.slice(0, 8)}…`,
        decision: assess.decision,
        decisionReasons: assess.decision_reasons,
        operatorVerification: assess.operator_verification,
        score: assess.score,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      status: 502,
    };
  }
}

/**
 * @param {'discover' | 'check' | 'passport-status' | 'pay'} kind
 * @param {Record<string, string>} params
 * @param {{ anonymousId: string; connectedWalletAddress?: string }} ctx
 * @returns {Promise<AgentscoreToolResult>}
 */
export async function runAgentscoreToolForAgent(kind, params, ctx) {
  if (kind === 'discover') return runAgentscoreDiscover(params);
  if (kind === 'check') return runAgentscoreCheck(params);
  if (kind === 'passport-status') return runAgentscorePassportStatus(params);

  if (kind === 'pay') {
    const url = String(params.url || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return { success: false, error: 'url is required (https://...)', status: 400 };
    }

    const method = String(params.method || 'POST').trim().toUpperCase();
    /** @type {Record<string, unknown> | undefined} */
    let body;
    if (params.body != null && String(params.body).trim() !== '') {
      try {
        body = JSON.parse(String(params.body));
      } catch {
        return { success: false, error: 'body must be valid JSON', status: 400 };
      }
    }

    const keypair = await getAgentKeypair(ctx.anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user', status: 404 };
    }

    const operatorToken = String(
      params.operatorToken || params.operator_token || getAgentscoreOperatorToken() || ''
    ).trim();

    /** @type {Record<string, string>} */
    const extraHeaders = {};
    if (operatorToken) extraHeaders['X-Operator-Token'] = operatorToken;
    if (ctx.connectedWalletAddress) {
      extraHeaders['X-Wallet-Address'] = ctx.connectedWalletAddress;
    }

    const probe = await runAgentscoreCheck({
      ...params,
      operatorToken,
      walletAddress: ctx.connectedWalletAddress || '',
    });
    if (probe.success && probe.data && typeof probe.data === 'object') {
      const d = /** @type {{ identityRequired?: boolean; body?: Record<string, unknown> }} */ (probe.data);
      if (d.identityRequired) {
        return {
          success: false,
          error: 'Identity verification required before payment',
          status: 403,
          identityRequired: true,
          data: d.body,
        };
      }
    }

    const fetchFn = await getAgentFetch(ctx.anonymousId);
    const result = await pay402AndRetry(
      keypair,
      {
        url,
        method,
        body,
        connectedWalletAddress: ctx.connectedWalletAddress,
        extraHeaders,
      },
      fetchFn
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Payment failed',
        status: result.budgetExceeded ? 402 : 502,
        ...(result.budgetExceeded ? { budgetExceeded: true } : {}),
      };
    }

    return {
      success: true,
      data: {
        url,
        method,
        response: result.data,
        maxSpend: parseMaxSpend(params),
      },
    };
  }

  return { success: false, error: `Unknown agentscore kind: ${kind}`, status: 400 };
}
