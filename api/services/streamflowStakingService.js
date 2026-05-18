import StreamflowLock from '../models/StreamflowLock.js';
import StreamflowStakingWallet from '../models/StreamflowStakingWallet.js';
import { SYRA_TOKEN_MINT } from '../libs/syraToken.js';

export const DEFAULT_STAKING_MINT =
  process.env.STAKING_MINT || process.env.STAKING_TOKEN_MINT || SYRA_TOKEN_MINT;

export const DEFAULT_STAKING_DECIMALS = Number(process.env.STAKING_DECIMALS || '6');

/** Human-readable SYRA amount required for premium utilities (e.g. trading agent). */
export const DEFAULT_MIN_ACTIVE_STAKE_AMOUNT = Number(
  process.env.STAKING_UTILITY_MIN_ACTIVE_AMOUNT || '1000000'
);

export function getDefaultStakingNetwork() {
  const cluster = process.env.STAKING_NETWORK || process.env.SOLANA_CLUSTER || 'mainnet-beta';
  return cluster === 'devnet' ? 'devnet' : 'mainnet';
}

export function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

export function parseRawAmount(value) {
  try {
    const n = BigInt(String(value ?? '0').trim() || '0');
    return n >= 0n ? n : 0n;
  } catch {
    return 0n;
  }
}

export function formatRawAmount(raw, decimals) {
  const scale = 10n ** BigInt(Math.max(0, decimals));
  const whole = raw / scale;
  const frac = raw % scale;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

export function humanToRawAmount(humanAmount, decimals = DEFAULT_STAKING_DECIMALS) {
  const s = String(humanAmount ?? '').trim();
  if (!s || !Number.isFinite(Number(s)) || Number(s) < 0) return null;
  const [wholePart, fracPart = ''] = s.split('.');
  const fracPadded = fracPart.padEnd(decimals, '0').slice(0, decimals);
  const combined = `${wholePart}${fracPadded}`.replace(/^0+/, '') || '0';
  try {
    return BigInt(combined);
  } catch {
    return null;
  }
}

/**
 * Remaining locked tokens for utility checks (deposited minus withdrawn).
 */
export function computeRemainingAmountRaw(lock) {
  const deposited = parseRawAmount(lock.amountRaw);
  const withdrawn = parseRawAmount(lock.withdrawnRaw);
  const remaining = deposited > withdrawn ? deposited - withdrawn : 0n;
  return remaining.toString();
}

/**
 * Derive lock status from chain/db fields and unlock time.
 */
export function resolveLockStatus(lock, atUnix = nowUnix()) {
  if (lock.closed) return 'closed';
  if (Number(lock.unlockAtUnix) <= atUnix) return 'expired';
  return 'active';
}

export function isLockActive(lock, atUnix = nowUnix()) {
  return resolveLockStatus(lock, atUnix) === 'active';
}

export function normalizeLockPayload(payload, atUnix = nowUnix()) {
  const p = payload || {};
  const streamId = String(p.streamId || '').trim();
  const txId = String(p.txId || '').trim();
  const wallet = String(p.wallet || '').trim();
  const mint = String(p.mint || '').trim();
  const tokenSymbol = String(p.tokenSymbol || 'SYRA').trim() || 'SYRA';
  const decimals = Number(p.decimals ?? DEFAULT_STAKING_DECIMALS);
  const amountRaw = String(p.amountRaw || '').trim();
  const amountFormatted = String(p.amountFormatted || '').trim();
  const unlockedRaw = String(p.unlockedRaw || '0').trim();
  const unlockedFormatted = String(p.unlockedFormatted || '0').trim();
  const withdrawnRaw = String(p.withdrawnRaw || '0').trim();
  const withdrawnFormatted = String(p.withdrawnFormatted || '0').trim();
  const unlockAtUnix = Number(p.unlockAtUnix);
  const unlockAtIso =
    String(p.unlockAtIso || '').trim() ||
    (Number.isFinite(unlockAtUnix) ? new Date(unlockAtUnix * 1000).toISOString() : '');
  const network = p.network === 'devnet' ? 'devnet' : 'mainnet';
  const source = p.source === 'onchain_sync' ? 'onchain_sync' : 'app';
  const lockDurationSeconds =
    p.lockDurationSeconds != null && Number.isFinite(Number(p.lockDurationSeconds))
      ? Number(p.lockDurationSeconds)
      : null;

  if (!streamId || !txId || !wallet || !mint || !amountRaw || !amountFormatted) {
    throw new Error('Missing required fields');
  }
  if (!Number.isFinite(decimals) || decimals < 0) {
    throw new Error('Invalid decimals');
  }
  if (!Number.isFinite(unlockAtUnix) || unlockAtUnix <= 0 || !unlockAtIso) {
    throw new Error('Invalid unlockAt values');
  }

  const closed = Boolean(p.closed);
  const draft = {
    streamId,
    txId,
    wallet,
    sender: p.sender ? String(p.sender).trim() : null,
    recipient: p.recipient ? String(p.recipient).trim() : null,
    mint,
    tokenSymbol,
    decimals,
    amountRaw,
    amountFormatted,
    unlockedRaw,
    unlockedFormatted,
    withdrawnRaw,
    withdrawnFormatted,
    unlockAtUnix,
    unlockAtIso,
    lockDurationSeconds,
    network,
    source,
    closed,
    metadata: p.metadata && typeof p.metadata === 'object' ? p.metadata : null,
  };

  draft.remainingAmountRaw = computeRemainingAmountRaw(draft);
  draft.status = resolveLockStatus(draft, atUnix);
  draft.closed = draft.status !== 'active';
  draft.lastSyncedAt = new Date();

  return draft;
}

/**
 * Recompute wallet snapshot from all locks in DB (source of truth after sync).
 */
export async function recomputeWalletSnapshot(wallet, mint, network, atUnix = nowUnix()) {
  const locks = await StreamflowLock.find({ wallet, mint, network }).lean();
  let activeStaked = 0n;
  let activeCount = 0;
  let nextUnlock = null;
  let decimals = DEFAULT_STAKING_DECIMALS;
  let tokenSymbol = 'SYRA';

  for (const lock of locks) {
    decimals = lock.decimals ?? decimals;
    tokenSymbol = lock.tokenSymbol ?? tokenSymbol;
    if (!isLockActive(lock, atUnix)) continue;
    const remaining = parseRawAmount(computeRemainingAmountRaw(lock));
    if (remaining <= 0n) continue;
    activeStaked += remaining;
    activeCount += 1;
    const unlock = Number(lock.unlockAtUnix);
    if (Number.isFinite(unlock) && (nextUnlock == null || unlock < nextUnlock)) {
      nextUnlock = unlock;
    }
  }

  const activeStakedAmountRaw = activeStaked.toString();
  const activeStakedAmountFormatted = formatRawAmount(activeStaked, decimals);

  const snapshot = await StreamflowStakingWallet.findOneAndUpdate(
    { wallet, mint, network },
    {
      $set: {
        wallet,
        mint,
        network,
        tokenSymbol,
        decimals,
        activeStakedAmountRaw,
        activeStakedAmountFormatted,
        activeLockCount: activeCount,
        nextUnlockAtUnix: nextUnlock,
        lastSyncedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).lean();

  return snapshot;
}

export async function upsertStreamflowLock(payload) {
  const normalized = normalizeLockPayload(payload);
  const doc = await StreamflowLock.findOneAndUpdate(
    { streamId: normalized.streamId },
    { $set: normalized },
    { upsert: true, new: true }
  ).lean();

  const snapshot = await recomputeWalletSnapshot(
    normalized.wallet,
    normalized.mint,
    normalized.network
  );

  return { lock: doc, snapshot };
}

export async function bulkUpsertStreamflowLocks(items) {
  const walletsToRecompute = new Set();
  const normalizedList = items.map((item) => normalizeLockPayload(item));

  const ops = normalizedList.map((normalized) => {
    walletsToRecompute.add(`${normalized.wallet}|${normalized.mint}|${normalized.network}`);
    return {
      updateOne: {
        filter: { streamId: normalized.streamId },
        update: { $set: normalized },
        upsert: true,
      },
    };
  });

  const result = await StreamflowLock.bulkWrite(ops, { ordered: false });

  const snapshots = [];
  for (const key of walletsToRecompute) {
    const [wallet, mint, network] = key.split('|');
    snapshots.push(await recomputeWalletSnapshot(wallet, mint, network));
  }

  return { bulkResult: result, snapshots };
}

export async function getWalletStakingSummary(wallet, options = {}) {
  const mint = String(options.mint || DEFAULT_STAKING_MINT).trim();
  const network = options.network === 'devnet' ? 'devnet' : options.network || getDefaultStakingNetwork();
  const atUnix = options.atUnix ?? nowUnix();
  const minAmountRaw =
    options.minAmountRaw != null
      ? parseRawAmount(options.minAmountRaw)
      : humanToRawAmount(
          options.minAmountFormatted ?? DEFAULT_MIN_ACTIVE_STAKE_AMOUNT,
          options.decimals ?? DEFAULT_STAKING_DECIMALS
        ) ?? 0n;

  let snapshot = await StreamflowStakingWallet.findOne({ wallet, mint, network }).lean();

  const locks = await StreamflowLock.find({ wallet, mint, network })
    .sort({ unlockAtUnix: 1 })
    .lean();

  const activeLocks = locks.filter((l) => isLockActive(l, atUnix));
  let activeStaked = 0n;
  for (const lock of activeLocks) {
    activeStaked += parseRawAmount(computeRemainingAmountRaw(lock));
  }

  const activeStakedAmountRaw = activeStaked.toString();
  const decimals = snapshot?.decimals ?? locks[0]?.decimals ?? DEFAULT_STAKING_DECIMALS;
  const activeStakedAmountFormatted = formatRawAmount(activeStaked, decimals);
  const meetsMinimum = activeStaked >= minAmountRaw;

  if (
    !snapshot ||
    snapshot.activeStakedAmountRaw !== activeStakedAmountRaw ||
    snapshot.activeLockCount !== activeLocks.length
  ) {
    snapshot = await recomputeWalletSnapshot(wallet, mint, network, atUnix);
  }

  return {
    wallet,
    mint,
    network,
    tokenSymbol: snapshot?.tokenSymbol ?? 'SYRA',
    decimals,
    activeStakedAmountRaw,
    activeStakedAmountFormatted,
    activeLockCount: activeLocks.length,
    nextUnlockAtUnix: snapshot?.nextUnlockAtUnix ?? null,
    minAmountRaw: minAmountRaw.toString(),
    minAmountFormatted: formatRawAmount(minAmountRaw, decimals),
    meetsMinimum,
    activeLocks: activeLocks.map((l) => ({
      streamId: l.streamId,
      amountFormatted: l.amountFormatted,
      remainingAmountRaw: l.remainingAmountRaw ?? computeRemainingAmountRaw(l),
      unlockAtUnix: l.unlockAtUnix,
      unlockAtIso: l.unlockAtIso,
      status: l.status ?? resolveLockStatus(l, atUnix),
    })),
    lastSyncedAt: snapshot?.lastSyncedAt ?? null,
  };
}

export async function checkStakingEligibility(wallet, options = {}) {
  const summary = await getWalletStakingSummary(wallet, options);
  return {
    eligible: summary.meetsMinimum,
    reason: summary.meetsMinimum
      ? null
      : `Requires at least ${summary.minAmountFormatted} ${summary.tokenSymbol} in active staking locks`,
    ...summary,
  };
}

/**
 * Mark expired locks and refresh wallet snapshots (cron or operator).
 */
export async function reconcileStreamflowLocks(options = {}) {
  const mint = options.mint ? String(options.mint).trim() : null;
  const network = options.network === 'devnet' ? 'devnet' : options.network || null;
  const atUnix = nowUnix();

  const filter = {
    status: 'active',
    unlockAtUnix: { $lte: atUnix },
  };
  if (mint) filter.mint = mint;
  if (network) filter.network = network;

  const expired = await StreamflowLock.find(filter).select('wallet mint network streamId').lean();

  if (expired.length > 0) {
    await StreamflowLock.updateMany(filter, {
      $set: { status: 'expired', closed: true, lastSyncedAt: new Date() },
    });
  }

  const wallets = new Set(expired.map((e) => `${e.wallet}|${e.mint}|${e.network}`));
  for (const key of wallets) {
    const [wallet, m, net] = key.split('|');
    await recomputeWalletSnapshot(wallet, m, net, atUnix);
  }

  return { expiredCount: expired.length, walletsUpdated: wallets.size };
}

export async function findActiveStakersAbove(minAmountRaw, options = {}) {
  const mint = String(options.mint || DEFAULT_STAKING_MINT).trim();
  const network = options.network === 'devnet' ? 'devnet' : options.network || getDefaultStakingNetwork();
  const minRaw = parseRawAmount(minAmountRaw);

  const snapshots = await StreamflowStakingWallet.find({
    mint,
    network,
    activeLockCount: { $gt: 0 },
  }).lean();

  return snapshots.filter((s) => parseRawAmount(s.activeStakedAmountRaw) >= minRaw);
}
