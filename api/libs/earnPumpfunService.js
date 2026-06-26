/**
 * Earn pillar — pump.fun token launch + creator fee collection via earn agent wallet.
 */
import AgentWallet from '../models/agent/AgentWallet.js';
import EarnPumpfunLaunch from '../models/agent/EarnPumpfunLaunch.js';
import { isMongooseConnected } from '../config/mongoose.js';
import { executeAgentToolCall } from './agentToolExecutor.js';
import {
  baseAnonymousIdFrom,
  siblingAnonymousId,
} from './agentWalletPurpose.js';
import { ensureAgentWalletSet } from './agentWalletProvision.js';

const PUMPFUN_EARN_TOOLS = Object.freeze([
  'pumpfun-agents-create-coin',
  'pumpfun-collect-fees',
]);

const PUMP_IPFS_URL = (process.env.PUMP_FUN_IPFS_URL || 'https://pump.fun/api/ipfs').replace(/\/$/, '');

/**
 * Ensure earn wallet can sign pump.fun transactions (idempotent).
 * @param {string} earnAnonymousId
 */
export async function ensureEarnPumpfunTools(earnAnonymousId) {
  if (!isMongooseConnected()) return;
  await AgentWallet.updateOne(
    { anonymousId: earnAnonymousId },
    { $addToSet: { allowedTools: { $each: [...PUMPFUN_EARN_TOOLS] } } },
  );
}

/**
 * @param {string | null | undefined} sessionAnonymousId
 * @param {string | null | undefined} walletAddress
 */
export async function resolveEarnWalletForSession(sessionAnonymousId, walletAddress) {
  if (!isMongooseConnected()) {
    throw new Error('Database not connected');
  }

  const base =
    baseAnonymousIdFrom(sessionAnonymousId) ||
    (walletAddress?.trim() ? `wallet:${walletAddress.trim()}` : null);
  if (!base) throw new Error('earn_wallet_context_required');

  const earnId = siblingAnonymousId(base, 'earn');
  if (!earnId) throw new Error('earn_wallet_id_invalid');

  let wallet = await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean();
  if (!wallet?.agentAddress) {
    await ensureAgentWalletSet({
      baseAnonymousId: base,
      walletAddress: walletAddress?.trim() || undefined,
      provisionedVia: 'connect',
    });
    wallet = await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean();
  }

  if (!wallet?.agentAddress) {
    throw new Error('earn_wallet_not_provisioned');
  }

  await ensureEarnPumpfunTools(earnId);

  return {
    baseAnonymousId: base,
    earnAnonymousId: earnId,
    earnAgentAddress: wallet.agentAddress.trim(),
  };
}

/**
 * @param {string} earnAnonymousId
 */
export async function listEarnPumpfunLaunches(earnAnonymousId) {
  if (!isMongooseConnected()) return [];
  const rows = await EarnPumpfunLaunch.find({ earnAnonymousId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    mint: r.mint,
    name: r.name,
    symbol: r.symbol,
    metadataUri: r.metadataUri,
    launchSignature: r.launchSignature,
    initialBuyLamports: r.initialBuyLamports,
    lastFeeCollectSignature: r.lastFeeCollectSignature,
    lastFeeCollectedAt: r.lastFeeCollectedAt,
    createdAt: r.createdAt,
  }));
}

/**
 * Upload token image + metadata to pump.fun IPFS (server-side proxy).
 * @param {Record<string, string>} fields
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} filename
 */
export async function uploadPumpfunMetadata(fields, imageBuffer, mimeType, filename) {
  const form = new FormData();
  form.append('file', new Blob([imageBuffer], { type: mimeType || 'image/png' }), filename || 'token.png');
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && String(value).trim()) {
      form.append(key, String(value).trim());
    }
  }
  if (!fields.showName) form.append('showName', 'true');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(PUMP_IPFS_URL, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `IPFS upload failed (HTTP ${res.status})`;
      throw new Error(String(msg));
    }
    const uri =
      (data && typeof data === 'object' && (data.metadataUri || data.metadata_uri || data.uri)) ||
      null;
    if (!uri || typeof uri !== 'string') {
      throw new Error('IPFS upload succeeded but no metadata URI was returned');
    }
    return { metadataUri: uri.trim(), raw: data };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{
 *   earnAnonymousId: string;
 *   earnAgentAddress: string;
 *   name: string;
 *   symbol: string;
 *   uri: string;
 *   solLamports: string;
 *   ctx: import('./agentToolExecutor.js').AgentToolCallContext;
 * }} input
 */
export async function launchEarnPumpfunToken(input) {
  const { earnAnonymousId, earnAgentAddress, name, symbol, uri, solLamports, ctx } = input;

  const result = await executeAgentToolCall({
    anonymousId: earnAnonymousId,
    toolId: 'pumpfun-agents-create-coin',
    params: {
      user: earnAgentAddress,
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      uri: uri.trim(),
      solLamports: String(solLamports),
      encoding: 'base64',
      cashback: 'false',
    },
    ctx,
  });

  if (result.status !== 200 || !result.body?.success) {
    return {
      success: false,
      error: result.body?.error || result.body?.message || 'launch_failed',
      insufficientBalance: result.body?.insufficientBalance,
      usdcBalance: result.body?.usdcBalance,
      requiredUsdc: result.body?.requiredUsdc,
    };
  }

  const data = result.body.data && typeof result.body.data === 'object' ? result.body.data : {};
  const mint =
    (typeof data.mintPublicKey === 'string' && data.mintPublicKey.trim()) ||
    (typeof data.mint === 'string' && data.mint.trim()) ||
    null;
  const signature =
    (typeof data.submittedSignature === 'string' && data.submittedSignature.trim()) ||
    (typeof data.signature === 'string' && data.signature.trim()) ||
    null;

  if (mint && isMongooseConnected()) {
    await EarnPumpfunLaunch.findOneAndUpdate(
      { mint },
      {
        $set: {
          earnAnonymousId,
          earnAgentAddress,
          mint,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          metadataUri: uri.trim(),
          launchSignature: signature,
          initialBuyLamports: String(solLamports),
        },
      },
      { upsert: true, new: true },
    );
  }

  return {
    success: true,
    mint,
    signature,
    submittedOnChain: data.submittedOnChain === true,
    submitError: typeof data.submitError === 'string' ? data.submitError : undefined,
    confirmationRequired: data.confirmationRequired === true,
    intentId: typeof data.intentId === 'string' ? data.intentId : undefined,
    data,
  };
}

/**
 * @param {{
 *   earnAnonymousId: string;
 *   earnAgentAddress: string;
 *   mint: string;
 *   ctx: import('./agentToolExecutor.js').AgentToolCallContext;
 * }} input
 */
export async function collectEarnPumpfunFees(input) {
  const { earnAnonymousId, earnAgentAddress, mint, ctx } = input;
  const mintTrim = String(mint || '').trim();
  if (!mintTrim) return { success: false, error: 'mint_required' };

  const result = await executeAgentToolCall({
    anonymousId: earnAnonymousId,
    toolId: 'pumpfun-collect-fees',
    params: {
      mint: mintTrim,
      user: earnAgentAddress,
      encoding: 'base64',
      frontRunningProtection: 'false',
    },
    ctx,
  });

  if (result.status !== 200 || !result.body?.success) {
    return {
      success: false,
      error: result.body?.error || result.body?.message || 'collect_failed',
    };
  }

  const data = result.body.data && typeof result.body.data === 'object' ? result.body.data : {};
  const signature =
    (typeof data.submittedSignature === 'string' && data.submittedSignature.trim()) ||
    (typeof data.signature === 'string' && data.signature.trim()) ||
    null;

  if (isMongooseConnected()) {
    await EarnPumpfunLaunch.updateOne(
      { mint: mintTrim, earnAnonymousId },
      {
        $set: {
          lastFeeCollectSignature: signature,
          lastFeeCollectedAt: new Date(),
        },
      },
    );
  }

  return {
    success: true,
    signature,
    submittedOnChain: data.submittedOnChain === true,
    submitError: typeof data.submitError === 'string' ? data.submitError : undefined,
    confirmationRequired: data.confirmationRequired === true,
    intentId: typeof data.intentId === 'string' ? data.intentId : undefined,
    data,
  };
}
