import StreamflowLock from '../models/StreamflowLock.js';
import { isLockActive, nowUnix, parseRawAmount, computeRemainingAmountRaw } from './streamflowStakingService.js';

export function sumAmountRaw(docs) {
  let total = BigInt(0);
  for (const d of docs) {
    try {
      total += parseRawAmount(d.remainingAmountRaw ?? d.amountRaw);
    } catch {
      // skip invalid
    }
  }
  return total.toString();
}

/**
 * Operator registry analytics for a mint + network (requires Mongo connected).
 */
export async function computeOperatorStats(mint, network) {
  const atUnix = nowUnix();
  const allOpenDocs = await StreamflowLock.find({ mint, network, closed: false }).lean();
  const openDocs = allOpenDocs.filter((d) => isLockActive(d, atUnix));
  const closedLockCount = await StreamflowLock.countDocuments({
    mint,
    network,
    $or: [{ closed: true }, { status: { $in: ['closed', 'expired'] } }],
  });
  const wallets = new Set(openDocs.map((d) => d.wallet));
  const recent = await StreamflowLock.find({ mint, network })
    .sort({ updatedAt: -1 })
    .limit(25)
    .select('streamId wallet amountFormatted unlockAtIso closed status source')
    .lean();

  /** One row per wallet with at least one active lock. */
  const byWallet = new Map();
  for (const d of openDocs) {
    const w = d.wallet;
    if (!byWallet.has(w)) {
      byWallet.set(w, { openLockCount: 0, totalAmountRaw: 0n });
    }
    const row = byWallet.get(w);
    row.openLockCount += 1;
    try {
      row.totalAmountRaw += parseRawAmount(computeRemainingAmountRaw(d));
    } catch {
      // skip bad amountRaw
    }
  }
  const stakers = Array.from(byWallet.entries())
    .map(([wallet, { openLockCount, totalAmountRaw }]) => ({
      wallet,
      openLockCount,
      totalAmountRaw: totalAmountRaw.toString(),
    }))
    .sort((a, b) => {
      const ba = BigInt(a.totalAmountRaw);
      const bb = BigInt(b.totalAmountRaw);
      if (bb > ba) return 1;
      if (bb < ba) return -1;
      return a.wallet.localeCompare(b.wallet);
    });

  return {
    network,
    mint,
    openLockCount: openDocs.length,
    closedLockCount,
    uniqueWallets: wallets.size,
    totalAmountRawOpen: sumAmountRaw(openDocs),
    stakers,
    recentActivity: recent.map((r) => ({
      streamId: r.streamId,
      wallet: r.wallet,
      amountFormatted: r.amountFormatted,
      unlockAtIso: r.unlockAtIso,
      closed: Boolean(r.closed),
      status: r.status,
      source: r.source,
    })),
  };
}
