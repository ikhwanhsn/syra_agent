/**
 * Settle x402 Exact EVM payments on Celo.
 *
 * Hackathon FAQ: x402_settlements / x402_volume_usd only count settlements submitted by
 * api.x402.celo.org (attributed to the registered payTo / agentWalletAddress). Self-settle
 * never appears in those columns — Labs Celo force-disables it; opt-in only via
 * CELO_SELF_SETTLE_FALLBACK / CELO_ALLOW_SELF_SETTLE for non-Labs debugging.
 *
 * @see https://celobuilders.xyz/hackathons/agentic-payments-defai/faqs
 * @see https://x402.celo.org/
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  recoverTypedDataAddress,
  hexToSignature,
  isAddressEqual,
  getAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import {
  BUILDER_CODE,
  BUILDER_CODE_PATTERN,
  encodeBuilderCodeSuffix,
} from '@x402/extensions/builder-code';
import {
  CELO_FACILITATOR_URL,
  CELO_MAINNET_CAIP2,
  CELO_USDC_MAINNET,
  getCeloFacilitatorApiKey,
  getCeloNetworkByCaip2,
  getCeloRpcUrl,
} from '../config/celoX402Networks.js';
import { getCeloBuilderCode, getCeloFacilitatorWalletCode } from '../config/celoBuilderCode.js';
import { appendCeloDataSuffix, getCeloDataSuffix } from './celoAttribution.js';
import {
  openCeloCreditCircuit,
  closeCeloCreditCircuit,
  isCeloCreditCircuitOpen,
  isCeloInsufficientCreditsReason,
  getCeloCreditCircuitStatus,
} from '../libs/celoFacilitatorCreditGate.js';

/** Cap Celo facilitator HTTP so settle never hangs indefinitely. Default 12s (was 6s). */
const CELO_FACILITATOR_TIMEOUT_MS = Number.parseInt(
  process.env.CELO_FACILITATOR_TIMEOUT_MS || '12000',
  10,
);

/** Bounded retries on timeout / transient network / 5xx facilitator errors. Default 2. */
const CELO_FACILITATOR_SETTLE_RETRIES = Math.max(
  0,
  Number.parseInt(process.env.CELO_FACILITATOR_SETTLE_RETRIES || '2', 10) || 0,
);

/**
 * HTTP statuses that are safe to retry (facilitator flake / overload).
 * Do not retry 401/402/403/400 — those are auth/credits/business failures.
 * @param {number} status
 */
function isTransientCeloHttpStatus(status) {
  const n = Number(status);
  return n === 408 || n === 425 || n === 429 || n === 500 || n === 502 || n === 503 || n === 504;
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
async function fetchCeloFacilitator(url, init = {}) {
  const timeoutMs =
    Number.isFinite(CELO_FACILITATOR_TIMEOUT_MS) && CELO_FACILITATOR_TIMEOUT_MS > 0
      ? CELO_FACILITATOR_TIMEOUT_MS
      : 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal || controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isTransientCeloFacilitatorError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('abort') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket')
  );
}

/**
 * @param {unknown} extensions
 * @returns {{ a?: string; w?: string; s?: string | string[] } | null}
 */
function extractBuilderCodeInfo(extensions) {
  if (!extensions || typeof extensions !== 'object') return null;
  const raw = /** @type {Record<string, unknown>} */ (extensions)[BUILDER_CODE];
  if (!raw || typeof raw !== 'object') return null;
  const info =
    /** @type {Record<string, unknown>} */ (raw).info &&
    typeof /** @type {Record<string, unknown>} */ (raw).info === 'object'
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (raw).info)
      : /** @type {Record<string, unknown>} */ (raw);
  return /** @type {{ a?: string; w?: string; s?: string | string[] }} */ (info);
}

/**
 * Build ERC-8021 Schema 2 settlement suffix: `a` from payload/requirements (fallback env),
 * `w` from CELO_FACILITATOR_WALLET_CODE, `s` from client payload when present.
 * @param {object} payload
 * @param {object} accepted
 * @returns {`0x${string}` | null}
 */
function buildCeloSettlementDataSuffix(payload, accepted) {
  const fromPayload = extractBuilderCodeInfo(payload?.extensions);
  const fromAccepted = extractBuilderCodeInfo(accepted?.extensions);

  const aCandidate =
    (typeof fromPayload?.a === 'string' && BUILDER_CODE_PATTERN.test(fromPayload.a)
      ? fromPayload.a
      : null) ||
    (typeof fromAccepted?.a === 'string' && BUILDER_CODE_PATTERN.test(fromAccepted.a)
      ? fromAccepted.a
      : null) ||
    getCeloBuilderCode();

  const w = getCeloFacilitatorWalletCode();

  const sRaw = fromPayload?.s ?? fromAccepted?.s;
  const sCandidates = typeof sRaw === 'string' ? [sRaw] : Array.isArray(sRaw) ? sRaw : [];
  const s = sCandidates.filter((c) => typeof c === 'string' && BUILDER_CODE_PATTERN.test(c));

  if (!aCandidate && !w && s.length === 0) {
    return getCeloDataSuffix();
  }

  try {
    return /** @type {`0x${string}`} */ (
      encodeBuilderCodeSuffix({
        ...(aCandidate ? { a: aCandidate } : {}),
        ...(w ? { w } : {}),
        ...(s.length > 0 ? { s } : {}),
      })
    );
  } catch (e) {
    console.warn('[celoX402Settle] encode Schema 2 suffix failed:', e?.message || e);
    return getCeloDataSuffix();
  }
}

/**
 * Default ON — hackathon x402_* metrics only count facilitator-submitted settlements.
 * Set CELO_SETTLE_VIA_FACILITATOR=false to force self-settle only.
 */
function shouldSettleViaCeloFacilitator() {
  const v = String(process.env.CELO_SETTLE_VIA_FACILITATOR || 'true')
    .trim()
    .toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no';
}

/**
 * Explicit self-settle allow — OFF by default for hackathon Track 2.
 * Only settlements submitted by api.x402.celo.org count toward x402_settlements /
 * x402_volume_usd. Set CELO_ALLOW_SELF_SETTLE=true for local debugging or to force
 * self-settle even when CELO_SELF_SETTLE_FALLBACK is disabled.
 * @see https://celobuilders.xyz/hackathons/agentic-payments-defai/faqs
 */
function allowCeloSelfSettle() {
  const v = String(process.env.CELO_ALLOW_SELF_SETTLE || 'false')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Auto-fallback to self-settle when the Celo facilitator /settle fails
 * (e.g. relayer out of CELO gas). Default OFF — Track 2 x402_* only counts
 * facilitator settlements. Set CELO_SELF_SETTLE_FALLBACK=true to opt into
 * self-settle after facilitator failure (Track 1 tags preserved; x402_* not counted).
 * Requires CELO_SETTLER_PRIVATE_KEY (wallet must hold CELO for gas).
 */
function shouldSelfSettleFallback() {
  const v = String(process.env.CELO_SELF_SETTLE_FALLBACK || 'false')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * True when CELO_SETTLER_PRIVATE_KEY is present and looks like a valid 32-byte hex key.
 * Does not throw — used to decide whether self-settle fallback can run.
 * @returns {boolean}
 */
function hasCeloSettlerKey() {
  let hex = String(process.env.CELO_SETTLER_PRIVATE_KEY || '').trim();
  if (!hex) return false;
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hex);
}

/**
 * Whether self-settle may run after a facilitator failure (or when facilitator is disabled).
 * @returns {boolean}
 */
function canUseCeloSelfSettle() {
  return (allowCeloSelfSettle() || shouldSelfSettleFallback()) && hasCeloSettlerKey();
}

/**
 * Gate for self-settle on a specific settle call.
 * Labs Celo passes `forceFacilitatorOnly: true` so runs never silently self-settle
 * (non-counting Track 2 volume).
 *
 * @param {{ forceFacilitatorOnly?: boolean }} [opts]
 * @returns {boolean}
 */
export function canUseCeloSelfSettleForRequest(opts = {}) {
  if (opts.forceFacilitatorOnly) return false;
  return canUseCeloSelfSettle();
}

/** @returns {boolean} exported for unit tests */
export function isCeloSelfSettleFallbackEnabled() {
  return shouldSelfSettleFallback();
}

/**
 * @returns {Record<string, string>}
 */
function celoFacilitatorHeaders() {
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const apiKey = getCeloFacilitatorApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;
  return headers;
}

const TRANSFER_WITH_AUTHORIZATION_ABI = [
  {
    type: 'function',
    name: 'transferWithAuthorization',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
];

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

/**
 * @returns {import('viem').Account}
 */
function getSettlerAccount() {
  let hex = String(process.env.CELO_SETTLER_PRIVATE_KEY || '').trim();
  if (!hex) {
    throw new Error('CELO_SETTLER_PRIVATE_KEY is required for Celo x402 self-settlement');
  }
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('CELO_SETTLER_PRIVATE_KEY must be a 32-byte hex private key');
  }
  return privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
}

/**
 * Extract EIP-3009 authorization + signature from an x402 payment payload.
 * @param {object} payload
 * @param {object} accepted
 * @returns {{
 *   from: `0x${string}`;
 *   to: `0x${string}`;
 *   value: bigint;
 *   validAfter: bigint;
 *   validBefore: bigint;
 *   nonce: `0x${string}`;
 *   v: number;
 *   r: `0x${string}`;
 *   s: `0x${string}`;
 *   asset: `0x${string}`;
 *   network: string;
 * } | null}
 */
function extractAuthorization(payload, accepted) {
  const auth =
    payload?.payload?.authorization ||
    payload?.authorization ||
    payload?.payload?.auth ||
    null;
  const sigRaw =
    payload?.payload?.signature ||
    payload?.signature ||
    payload?.payload?.sig ||
    null;

  if (!auth || !sigRaw) return null;

  const from = getAddress(String(auth.from));
  const to = getAddress(String(auth.to));
  const value = BigInt(String(auth.value));
  const validAfter = BigInt(String(auth.validAfter ?? 0));
  const validBefore = BigInt(String(auth.validBefore));
  const nonce = /** @type {`0x${string}`} */ (String(auth.nonce));

  let v;
  let r;
  let s;
  if (typeof sigRaw === 'object' && sigRaw !== null) {
    v = Number(sigRaw.v);
    r = /** @type {`0x${string}`} */ (sigRaw.r);
    s = /** @type {`0x${string}`} */ (sigRaw.s);
  } else {
    const parsed = hexToSignature(/** @type {`0x${string}`} */ (String(sigRaw)));
    v = Number(parsed.v);
    r = parsed.r;
    s = parsed.s;
  }

  const network = String(accepted?.network || payload?.network || CELO_MAINNET_CAIP2);
  const asset = getAddress(String(accepted?.asset || CELO_USDC_MAINNET));

  return { from, to, value, validAfter, validBefore, nonce, v, r, s, asset, network };
}

/**
 * Local EIP-712 recovery check (does not replace facilitator verify when available).
 * @param {ReturnType<typeof extractAuthorization>} auth
 */
/**
 * @param {ReturnType<typeof extractAuthorization>} auth
 * @param {object} [accepted] - payment requirements (may carry extra.name/version used at sign time)
 */
async function verifyAuthorizationLocally(auth, accepted) {
  if (!auth) return false;
  try {
    const net = getCeloNetworkByCaip2(auth.network) || getCeloNetworkByCaip2(CELO_MAINNET_CAIP2);
    const extra = accepted?.extra && typeof accepted.extra === 'object' ? accepted.extra : {};
    const extraEip712 = extra.eip712 && typeof extra.eip712 === 'object' ? extra.eip712 : {};
    // Prefer on-chain Celo USDC domain; fall back to accept.extra only if it matches known Celo values.
    const domainName = net?.eip712?.name || extraEip712.name || extra.name || 'USDC';
    const domainVersion = net?.eip712?.version || extraEip712.version || extra.version || '2';
    const domain = {
      name: domainName,
      version: domainVersion,
      chainId: CELO_MAINNET_CHAIN_ID_SAFE(),
      verifyingContract: auth.asset,
    };
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    };
    const message = {
      from: auth.from,
      to: auth.to,
      value: auth.value,
      validAfter: auth.validAfter,
      validBefore: auth.validBefore,
      nonce: auth.nonce,
    };
    const sig = { v: auth.v, r: auth.r, s: auth.s };
    const recovered = await recoverTypedDataAddress({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
      signature: sig,
    });
    return isAddressEqual(recovered, auth.from);
  } catch (e) {
    console.warn('[celoX402Settle] local EIP-712 verify failed:', e?.message || e);
    return false;
  }
}

function CELO_MAINNET_CHAIN_ID_SAFE() {
  return 42220;
}

/**
 * Optional remote verify via Celo facilitator.
 * @param {object} payload
 * @param {object} accepted
 * @returns {Promise<boolean>}
 */
async function verifyViaCeloFacilitator(payload, accepted) {
  try {
    const res = await fetchCeloFacilitator(`${CELO_FACILITATOR_URL.replace(/\/+$/, '')}/verify`, {
      method: 'POST',
      headers: celoFacilitatorHeaders(),
      body: JSON.stringify({
        x402Version: payload?.x402Version ?? 2,
        paymentPayload: payload,
        paymentRequirements: accepted,
      }),
    });
    if (!res.ok) return false;
    const body = await res.json().catch(() => ({}));
    return Boolean(body?.isValid ?? body?.valid ?? body?.success);
  } catch (e) {
    console.warn('[celoX402Settle] facilitator verify failed:', e?.message || e);
    return false;
  }
}

/**
 * Settle via recognized Celo facilitator (tx.from = 0x0d74…FB48).
 * These are the only settlements counted as x402_* on the hackathon Dune board.
 * @param {object} payload
 * @param {object} accepted
 * @returns {Promise<{ success: boolean; payer?: string; transaction?: string; network?: string; settledVia?: 'facilitator' | 'self'; error?: string; errorReason?: string }>}
 */
async function settleViaCeloFacilitator(payload, accepted) {
  const apiKey = getCeloFacilitatorApiKey();
  if (!apiKey) {
    console.warn(
      '[celoX402Settle] CELO_FACILITATOR_API_KEY missing — /settle requires X-API-Key from https://x402.celo.org',
    );
    return {
      success: false,
      errorReason: 'CELO_FACILITATOR_API_KEY required for Celo facilitator settle',
      error: 'CELO_FACILITATOR_API_KEY required for Celo facilitator settle',
    };
  }

  const settleUrl = `${CELO_FACILITATOR_URL.replace(/\/+$/, '')}/settle`;
  const body = JSON.stringify({
    x402Version: payload?.x402Version ?? 2,
    paymentPayload: payload,
    paymentRequirements: accepted,
  });

  let lastFailure = null;
  const maxAttempts = 1 + CELO_FACILITATOR_SETTLE_RETRIES;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchCeloFacilitator(settleUrl, {
        method: 'POST',
        headers: celoFacilitatorHeaders(),
        body,
      });
      const resBody = await res.json().catch(() => ({}));
      const tx =
        resBody.transaction || resBody.txHash || resBody.hash || resBody?.settlement?.transaction;
      if (!res.ok || !(resBody?.success || resBody?.settled || tx)) {
        const reason =
          resBody?.errorMessage ||
          resBody?.errorReason ||
          resBody?.error ||
          resBody?.message ||
          (res.status === 401
            ? 'unauthorized — check CELO_FACILITATOR_API_KEY / credits'
            : `HTTP ${res.status}`);
        lastFailure = {
          success: false,
          errorReason: reason,
          error: reason,
          retries: attempt - 1,
        };
        // Retry transient HTTP (5xx / 429) with backoff; never retry auth/credits/4xx business failures
        if (attempt < maxAttempts && isTransientCeloHttpStatus(res.status)) {
          console.warn(
            `[celoX402Settle] facilitator settle transient HTTP ${res.status} (attempt ${attempt}/${maxAttempts}), retrying:`,
            reason,
          );
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        console.warn(
          `[celoX402Settle] facilitator settle failed (attempt ${attempt}/${maxAttempts}):`,
          reason,
        );
        return lastFailure;
      }
      return {
        success: true,
        payer: resBody.payer || resBody.payerAddress || undefined,
        transaction: tx,
        network: resBody.network || CELO_MAINNET_CAIP2,
        settledVia: 'facilitator',
      };
    } catch (e) {
      const msg = e?.message || String(e);
      lastFailure = {
        success: false,
        errorReason: msg,
        error: msg,
      };
      console.warn(
        `[celoX402Settle] facilitator settle error (attempt ${attempt}/${maxAttempts}):`,
        msg,
      );
      if (attempt < maxAttempts && isTransientCeloFacilitatorError(e)) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      lastFailure.retries = attempt - 1;
      return lastFailure;
    }
  }

  return (
    lastFailure || {
      success: false,
      errorReason: 'Celo facilitator settle failed',
      error: 'Celo facilitator settle failed',
    }
  );
}

/**
 * Settle an Exact EVM x402 payment on Celo with ERC-8021 Schema 2 builder-code in calldata.
 * @param {object} payload - req.x402Payment.payload
 * @param {object} accepted - req.x402Payment.accepted
 * @param {{ forceFacilitatorOnly?: boolean }} [opts]
 *   When `forceFacilitatorOnly` is true (Labs Celo), never self-settle — fail if facilitator cannot settle.
 * @returns {Promise<{ success: boolean; payer?: string; transaction?: string; network?: string; settledVia?: 'facilitator' | 'self'; error?: string; errorReason?: string }>}
 */
export async function settleCeloX402Payment(payload, accepted, opts = {}) {
  const forceFacilitatorOnly = Boolean(opts.forceFacilitatorOnly);
  const network = String(accepted?.network || payload?.network || '');
  if (network && network !== CELO_MAINNET_CAIP2 && !network.includes('42220')) {
    return {
      success: false,
      errorReason: `Unsupported Celo network: ${network}`,
      error: `Unsupported Celo network: ${network}`,
    };
  }

  // Hard stop when prepaid credits are empty — avoid verify→settle_failed loops.
  if (isCeloCreditCircuitOpen() && forceFacilitatorOnly) {
    const st = getCeloCreditCircuitStatus();
    return {
      success: false,
      errorReason: `celo_credits_circuit_open: ${st?.reason || 'insufficient_credits'}. Top up at https://x402.celo.org (openUntil=${st?.openUntil || 'n/a'}).`,
      error: 'Celo facilitator credits depleted — circuit open',
      circuitOpen: true,
    };
  }

  const auth = extractAuthorization(payload, accepted);
  if (!auth) {
    return {
      success: false,
      errorReason: 'Missing EIP-3009 authorization in payment payload',
      error: 'Missing EIP-3009 authorization in payment payload',
    };
  }

  // Verify already ran in requirePayment middleware — skip redundant remote /verify
  // round-trip on settle. Keep local EIP-712 recovery as the offline guard.
  const localOk = await verifyAuthorizationLocally(auth, accepted);
  if (!localOk) {
    return {
      success: false,
      errorReason: 'Celo payment authorization verification failed',
      error: 'Celo payment authorization verification failed',
    };
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now < auth.validAfter) {
    return {
      success: false,
      errorReason: 'Authorization not yet valid',
      error: 'Authorization not yet valid',
    };
  }
  if (now > auth.validBefore) {
    return {
      success: false,
      errorReason: 'Authorization expired',
      error: 'Authorization expired',
    };
  }

  /** @type {string | undefined} */
  let facilitatorErrorReason;
  if (shouldSettleViaCeloFacilitator()) {
    const facilitated = await settleViaCeloFacilitator(payload, accepted);
    if (facilitated?.success && facilitated.transaction) {
      closeCeloCreditCircuit();
      return facilitated;
    }
    facilitatorErrorReason =
      facilitated?.errorReason ||
      facilitated?.error ||
      'Celo facilitator settle failed';

    if (isCeloInsufficientCreditsReason(facilitatorErrorReason)) {
      openCeloCreditCircuit(facilitatorErrorReason);
    }

    if (!canUseCeloSelfSettleForRequest({ forceFacilitatorOnly })) {
      if (forceFacilitatorOnly) {
        return {
          success: false,
          errorReason: `${facilitatorErrorReason}. Labs Celo is facilitator-only (Track 2) — check CELO_FACILITATOR_API_KEY/credits and facilitator relayer CELO gas (0x0d74…FB48). Self-settle is disabled so runs count toward x402_*.`,
          error: `${facilitatorErrorReason} — facilitator-only (Labs Celo)`,
          payer: auth.from,
        };
      }
      const needsKey = !hasCeloSettlerKey() && (allowCeloSelfSettle() || shouldSelfSettleFallback());
      return {
        success: false,
        errorReason: needsKey
          ? `${facilitatorErrorReason}. Self-settle fallback needs CELO_SETTLER_PRIVATE_KEY (EOA with CELO gas).`
          : `${facilitatorErrorReason}. Track 2 only counts api.x402.celo.org settlements — check CELO_FACILITATOR_API_KEY/credits and facilitator relayer CELO gas (0x0d74…FB48). Set CELO_SELF_SETTLE_FALLBACK=true + CELO_SETTLER_PRIVATE_KEY to auto-fallback.`,
        error: needsKey
          ? `${facilitatorErrorReason} — self-settle needs CELO_SETTLER_PRIVATE_KEY`
          : `${facilitatorErrorReason} — self-settle fallback disabled`,
        payer: auth.from,
      };
    }
    console.warn(
      '[celoX402Settle] facilitator settle unavailable — falling back to self-settle (will NOT count for x402_settlements / x402_volume_usd):',
      facilitatorErrorReason,
    );
  } else if (!canUseCeloSelfSettleForRequest({ forceFacilitatorOnly })) {
    return {
      success: false,
      errorReason: forceFacilitatorOnly
        ? 'Labs Celo requires facilitator settle (CELO_SETTLE_VIA_FACILITATOR must be enabled) — self-settle is disabled for Track 2.'
        : 'Celo facilitator settle disabled (CELO_SETTLE_VIA_FACILITATOR=false) and self-settle unavailable — set CELO_SETTLER_PRIVATE_KEY (and CELO_ALLOW_SELF_SETTLE or CELO_SELF_SETTLE_FALLBACK).',
      error: forceFacilitatorOnly
        ? 'Labs Celo facilitator-only — facilitator settle disabled'
        : 'Celo self-settle unavailable — missing CELO_SETTLER_PRIVATE_KEY or fallback disabled',
      payer: auth.from,
    };
  }

  try {
    const settler = getSettlerAccount();
    const rpcUrl = getCeloRpcUrl();
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(rpcUrl),
    });
    const walletClient = createWalletClient({
      account: settler,
      chain: celo,
      transport: http(rpcUrl),
    });

    const encoded = encodeFunctionData({
      abi: TRANSFER_WITH_AUTHORIZATION_ABI,
      functionName: 'transferWithAuthorization',
      args: [
        auth.from,
        auth.to,
        auth.value,
        auth.validAfter,
        auth.validBefore,
        auth.nonce,
        auth.v,
        auth.r,
        auth.s,
      ],
    });

    const dataSuffix = buildCeloSettlementDataSuffix(payload, accepted);
    const data = appendCeloDataSuffix(encoded, dataSuffix);

    const hash = await walletClient.sendTransaction({
      to: auth.asset,
      data,
      account: settler,
      chain: celo,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return {
      success: true,
      payer: auth.from,
      transaction: hash,
      network: CELO_MAINNET_CAIP2,
      settledVia: 'self',
    };
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('[celoX402Settle] self-settle failed:', msg);
    return {
      success: false,
      errorReason: facilitatorErrorReason ? `${facilitatorErrorReason}; self-settle: ${msg}` : msg,
      error: msg,
      payer: auth.from,
    };
  }
}

/**
 * Local-only verify (for requirePayment fallback when facilitator is unavailable).
 * @param {object} payload
 * @param {object} accepted
 * @returns {Promise<{ isValid: boolean; invalidReason?: string; payer?: string }>}
 */
export async function verifyCeloPaymentLocally(payload, accepted) {
  try {
    if (!isCeloX402Network(accepted?.network) && accepted?.network) {
      return { isValid: false, invalidReason: `Not a Celo network: ${accepted.network}` };
    }
    const auth = extractAuthorization(payload, accepted);
    if (!auth) {
      return { isValid: false, invalidReason: 'Missing EIP-3009 authorization' };
    }
    const ok = await verifyAuthorizationLocally(auth, accepted);
    if (!ok) {
      return { isValid: false, invalidReason: 'Invalid EIP-3009 signature' };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < auth.validAfter) {
      return { isValid: false, invalidReason: 'Authorization not yet valid' };
    }
    if (now > auth.validBefore) {
      return { isValid: false, invalidReason: 'Authorization expired' };
    }
    return { isValid: true, payer: auth.from };
  } catch (e) {
    return { isValid: false, invalidReason: e?.message || 'Celo local verify failed' };
  }
}

/**
 * @param {string} network
 * @returns {boolean}
 */
export function isCeloX402Network(network) {
  const n = String(network || '').trim();
  return n === CELO_MAINNET_CAIP2 || n === 'celo' || n.endsWith(':42220');
}

/**
 * Tagged ERC-20 USDC transfer on Celo (used by Labs refund loop).
 * @param {import('viem').Account} fromAccount
 * @param {`0x${string}`} to
 * @param {bigint} amountRaw
 * @returns {Promise<`0x${string}`>}
 */
export async function sendTaggedCeloUsdcTransfer(fromAccount, to, amountRaw) {
  const rpcUrl = getCeloRpcUrl();
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account: fromAccount,
    chain: celo,
    transport: http(rpcUrl),
  });

  const transferAbi = [
    {
      type: 'function',
      name: 'transfer',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
  ];

  const encoded = encodeFunctionData({
    abi: transferAbi,
    functionName: 'transfer',
    args: [to, amountRaw],
  });
  const data = appendCeloDataSuffix(encoded, getCeloDataSuffix());
  const hash = await walletClient.sendTransaction({
    to: /** @type {`0x${string}`} */ (CELO_USDC_MAINNET),
    data,
    account: fromAccount,
    chain: celo,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export { ERC20_BALANCE_ABI, TRANSFER_WITH_AUTHORIZATION_ABI };
