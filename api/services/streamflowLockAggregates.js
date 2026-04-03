import StreamflowLock from '../models/StreamflowLock.js';

export function sumAmountRaw(docs) {
  let total = BigInt(0);
  for (const d of docs) {
    try {
      total += BigInt(String(d.amountRaw || '0'));
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
  const openDocs = await StreamflowLock.find({ mint, network, closed: false }).lean();
  const closedLockCount = await StreamflowLock.countDocuments({ mint, network, closed: true });
  const wallets = new Set(openDocs.map((d) => d.wallet));
  const recent = await StreamflowLock.find({ mint, network })
    .sort({ updatedAt: -1 })
    .limit(25)
    .select('streamId wallet amountFormatted unlockAtIso closed source')
    .lean();

  /** One row per wallet with at least one open lock (active staking). */
  const byWallet = new Map();
  for (const d of openDocs) {
    const w = d.wallet;
    if (!byWallet.has(w)) {
      byWallet.set(w, { openLockCount: 0, totalAmountRaw: BigInt(0) });
    }
    const row = byWallet.get(w);
    row.openLockCount += 1;
    try {
      row.totalAmountRaw += BigInt(String(d.amountRaw || '0'));
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
      source: r.source,
    })),
  };
}
