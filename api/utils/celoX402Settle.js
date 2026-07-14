/**
 * Self-settle x402 Exact EVM payments on Celo with ERC-8021 Schema 2 builder-code attribution.
 * Verifies optionally via x402.celo.org; submits transferWithAuthorization locally with
 * Schema 2 CBOR suffix (`a`/`w`/`s`) so Dune x402 volume columns credit Syra.
 * Optional CELO_SETTLE_VIA_FACILITATOR=true tries the recognized Celo facilitator first.
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
  getCeloNetworkByCaip2,
  getCeloRpcUrl,
} from '../config/celoX402Networks.js';
import { getCeloBuilderCode, getCeloFacilitatorWalletCode } from '../config/celoBuilderCode.js';
import { appendCeloDataSuffix, getCeloDataSuffix } from './celoAttribution.js';

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

function shouldSettleViaCeloFacilitator() {
  const v = String(process.env.CELO_SETTLE_VIA_FACILITATOR || '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
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
    const res = await fetch(`${CELO_FACILITATOR_URL.replace(/\/+$/, '')}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
 * Optional settle via recognized Celo facilitator (tx sender = facilitator EOA).
 * Only used when CELO_SETTLE_VIA_FACILITATOR=true; falls back to local self-settle on failure.
 * @param {object} payload
 * @param {object} accepted
 * @returns {Promise<{ success: boolean; payer?: string; transaction?: string; network?: string; error?: string; errorReason?: string } | null>}
 */
async function settleViaCeloFacilitator(payload, accepted) {
  try {
    const res = await fetch(`${CELO_FACILITATOR_URL.replace(/\/+$/, '')}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        x402Version: payload?.x402Version ?? 2,
        paymentPayload: payload,
        paymentRequirements: accepted,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !(body?.success ?? body?.transaction)) {
      console.warn(
        '[celoX402Settle] facilitator settle failed:',
        body?.errorReason || body?.error || `HTTP ${res.status}`,
      );
      return null;
    }
    return {
      success: true,
      payer: body.payer || body.payerAddress || undefined,
      transaction: body.transaction || body.txHash || body.hash,
      network: body.network || CELO_MAINNET_CAIP2,
    };
  } catch (e) {
    console.warn('[celoX402Settle] facilitator settle error:', e?.message || e);
    return null;
  }
}

/**
 * Settle an Exact EVM x402 payment on Celo with ERC-8021 Schema 2 builder-code in calldata.
 * @param {object} payload - req.x402Payment.payload
 * @param {object} accepted - req.x402Payment.accepted
 * @returns {Promise<{ success: boolean; payer?: string; transaction?: string; network?: string; error?: string; errorReason?: string }>}
 */
export async function settleCeloX402Payment(payload, accepted) {
  const network = String(accepted?.network || payload?.network || '');
  if (network && network !== CELO_MAINNET_CAIP2 && !network.includes('42220')) {
    return {
      success: false,
      errorReason: `Unsupported Celo network: ${network}`,
      error: `Unsupported Celo network: ${network}`,
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

  const remoteOk = await verifyViaCeloFacilitator(payload, accepted);
  if (!remoteOk) {
    const localOk = await verifyAuthorizationLocally(auth, accepted);
    if (!localOk) {
      return {
        success: false,
        errorReason: 'Celo payment authorization verification failed',
        error: 'Celo payment authorization verification failed',
      };
    }
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

  if (shouldSettleViaCeloFacilitator()) {
    const facilitated = await settleViaCeloFacilitator(payload, accepted);
    if (facilitated?.success && facilitated.transaction) {
      return facilitated;
    }
    console.warn(
      '[celoX402Settle] facilitator settle unavailable — falling back to self-settle with Schema 2 suffix',
    );
  }

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

  try {
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
    };
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('[celoX402Settle] settlement failed:', msg);
    return {
      success: false,
      errorReason: msg,
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
