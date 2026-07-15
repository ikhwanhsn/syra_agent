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
const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || 'https://frontend-api-v3.pump.fun').replace(
  /\/$/,
  '',
);

/** Appended to every earn-pillar pump.fun token display name. */
export const SYRA_TOKEN_NAME_SUFFIX = ' by Syra';

/**
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function normalizeTokenMediaUrl(url) {
  const t = String(url || '').trim();
  if (!t) return null;
  if (t.startsWith('ipfs://')) {
    const path = t.slice('ipfs://'.length).replace(/^ipfs\//i, '');
    return path ? `https://ipfs.io/ipfs/${path}` : null;
  }
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('Qm') || t.startsWith('bafy')) return `https://ipfs.io/ipfs/${t}`;
  return null;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function pickImageUriFromObject(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const nested = o.metadata && typeof o.metadata === 'object' ? /** @type {Record<string, unknown>} */ (o.metadata) : null;
  const candidates = [o.image, o.imageUri, o.image_uri, nested?.image, nested?.imageUri, nested?.image_uri];
  for (const c of candidates) {
    const n = normalizeTokenMediaUrl(typeof c === 'string' ? c : null);
    if (n) return n;
  }
  return null;
}

/**
 * @param {string} metadataUri
 * @returns {Promise<{ imageUri: string | null; description: string | null }>}
 */
async function fetchFieldsFromMetadataUri(metadataUri) {
  const url = normalizeTokenMediaUrl(metadataUri);
  if (!url) return { imageUri: null, description: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return { imageUri: null, description: null };
    const data = await res.json().catch(() => null);
    const imageUri = pickImageUriFromObject(data);
    const description =
      data && typeof data === 'object' && typeof data.description === 'string' ? data.description.trim() || null : null;
    return { imageUri, description };
  } catch {
    return { imageUri: null, description: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} mint
 * @returns {Promise<{ imageUri: string | null; description: string | null; name?: string; symbol?: string }>}
 */
async function fetchFieldsFromPumpfunCoin(mint) {
  const m = String(mint || '').trim();
  if (!m) return { imageUri: null, description: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(`${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(m)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return { imageUri: null, description: null };
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return { imageUri: null, description: null };
    const imageUri = normalizeTokenMediaUrl(
      typeof data.image_uri === 'string'
        ? data.image_uri
        : typeof data.imageUri === 'string'
          ? data.imageUri
          : typeof data.image === 'string'
            ? data.image
            : null,
    );
    const description = typeof data.description === 'string' ? data.description.trim() || null : null;
    return {
      imageUri,
      description,
      name: typeof data.name === 'string' ? data.name.trim() : undefined,
      symbol: typeof data.symbol === 'string' ? data.symbol.trim() : undefined,
    };
  } catch {
    return { imageUri: null, description: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fill missing image/description and persist once found.
 * @param {Record<string, unknown>} row
 */
async function enrichLaunchMedia(row) {
  if (!row) return row;
  let imageUri = normalizeTokenMediaUrl(typeof row.imageUri === 'string' ? row.imageUri : null);
  let description = typeof row.description === 'string' && row.description.trim() ? row.description.trim() : null;

  if (!imageUri || !description) {
    const fromMeta = await fetchFieldsFromMetadataUri(String(row.metadataUri || ''));
    imageUri = imageUri || fromMeta.imageUri;
    description = description || fromMeta.description;
  }
  if (!imageUri || !description) {
    const fromCoin = await fetchFieldsFromPumpfunCoin(String(row.mint || ''));
    imageUri = imageUri || fromCoin.imageUri;
    description = description || fromCoin.description;
  }

  const patch = {};
  if (imageUri && imageUri !== row.imageUri) patch.imageUri = imageUri;
  if (description && description !== row.description) patch.description = description;
  if (Object.keys(patch).length && isMongooseConnected() && row._id) {
    await EarnPumpfunLaunch.updateOne({ _id: row._id }, { $set: patch }).catch(() => {});
  }
  return { ...row, imageUri: imageUri || row.imageUri || null, description: description || row.description || null };
}

/**
 * Ensure token name ends with " by Syra" (idempotent, case-insensitive).
 * @param {string} rawName
 * @returns {string}
 */
export function withSyraTokenNameSuffix(rawName) {
  const base = String(rawName || '').trim();
  if (!base) return '';
  if (/\s+by\s+syra$/i.test(base)) {
    return base.replace(/\s+by\s+syra$/i, SYRA_TOKEN_NAME_SUFFIX);
  }
  return `${base}${SYRA_TOKEN_NAME_SUFFIX}`;
}

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

function serializeEarnPumpfunLaunch(r) {
  return {
    id: String(r._id),
    earnAnonymousId: r.earnAnonymousId,
    earnAgentAddress: r.earnAgentAddress,
    mint: r.mint,
    name: r.name,
    symbol: r.symbol,
    metadataUri: r.metadataUri,
    imageUri: normalizeTokenMediaUrl(r.imageUri) || null,
    description: typeof r.description === 'string' && r.description.trim() ? r.description.trim() : null,
    launchSignature: r.launchSignature,
    initialBuyLamports: r.initialBuyLamports,
    lastFeeCollectSignature: r.lastFeeCollectSignature,
    lastFeeCollectedAt: r.lastFeeCollectedAt,
    createdAt: r.createdAt,
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
  const enriched = await Promise.all(
    rows.map(async (row) => (row.imageUri ? row : enrichLaunchMedia(row))),
  );
  return enriched.map(serializeEarnPumpfunLaunch);
}

/**
 * Marketplace discovery — recent launches from all creators.
 * @param {{ limit?: number, skip?: number }} [opts]
 */
export async function listMarketplaceEarnPumpfunLaunches(opts = {}) {
  if (!isMongooseConnected()) return [];
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const skip = Math.max(Number(opts.skip) || 0, 0);
  const rows = await EarnPumpfunLaunch.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  // Enrich only rows missing logos (persist after resolve) so marketplace cards show images.
  const enriched = await Promise.all(
    rows.map(async (row) => (row.imageUri ? row : enrichLaunchMedia(row))),
  );
  return enriched.map(serializeEarnPumpfunLaunch);
}

/**
 * Public token detail by mint.
 * @param {string} mint
 */
export async function getEarnPumpfunLaunchByMint(mint) {
  if (!isMongooseConnected()) return null;
  const mintTrim = String(mint || '').trim();
  if (!mintTrim) return null;
  const row = await EarnPumpfunLaunch.findOne({ mint: mintTrim }).lean();
  if (!row) return null;
  const enriched = await enrichLaunchMedia(row);
  return serializeEarnPumpfunLaunch(enriched);
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
    let imageUri = pickImageUriFromObject(data);
    let description =
      data && typeof data === 'object' && typeof data.description === 'string'
        ? data.description.trim() || null
        : null;
    if (!imageUri || !description) {
      const fromMeta = await fetchFieldsFromMetadataUri(uri.trim());
      imageUri = imageUri || fromMeta.imageUri;
      description = description || fromMeta.description;
    }
    return {
      metadataUri: uri.trim(),
      imageUri: imageUri || null,
      description: description || null,
      raw: data,
    };
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
 *   imageUri?: string | null;
 *   description?: string | null;
 *   ctx: import('./agentToolExecutor.js').AgentToolCallContext;
 * }} input
 */
export async function launchEarnPumpfunToken(input) {
  const { earnAnonymousId, earnAgentAddress, name, symbol, uri, solLamports, ctx } = input;
  let imageUri = normalizeTokenMediaUrl(input.imageUri);
  let description =
    typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null;
  const brandedName = withSyraTokenNameSuffix(name);

  const result = await executeAgentToolCall({
    anonymousId: earnAnonymousId,
    toolId: 'pumpfun-agents-create-coin',
    // Earn launches: user pays pump.fun create + initial buy in SOL only (no Syra USDC fee).
    skipUsdcCharge: true,
    params: {
      user: earnAgentAddress,
      name: brandedName,
      symbol: symbol.trim().toUpperCase(),
      uri: uri.trim(),
      solLamports: String(solLamports),
      encoding: 'base64',
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

  if (mint) {
    if (!imageUri || !description) {
      const fromMeta = await fetchFieldsFromMetadataUri(uri.trim());
      imageUri = imageUri || fromMeta.imageUri;
      description = description || fromMeta.description;
    }
    if (!imageUri) {
      const fromCoin = await fetchFieldsFromPumpfunCoin(mint);
      imageUri = imageUri || fromCoin.imageUri;
      description = description || fromCoin.description;
    }
  }

  if (mint && isMongooseConnected()) {
    await EarnPumpfunLaunch.findOneAndUpdate(
      { mint },
      {
        $set: {
          earnAnonymousId,
          earnAgentAddress,
          mint,
          name: brandedName,
          symbol: symbol.trim().toUpperCase(),
          metadataUri: uri.trim(),
          ...(imageUri ? { imageUri } : {}),
          ...(description ? { description } : {}),
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
    imageUri: imageUri || null,
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
