import AgentWallet from '../models/agent/AgentWallet.js';
import { fetchAgentWalletBalances } from './agentWalletBalance.js';
import {
  baseAnonymousIdFrom,
  normalizeAgentWalletPurpose,
  PILLAR_WALLET_PURPOSES,
  siblingAnonymousId,
} from './agentWalletPurpose.js';
import { ensureAgentWalletSet, walletSetResponseFields } from './agentWalletProvision.js';

/**
 * Load or provision the five pillar wallets for a base anonymousId.
 * @param {{
 *   baseAnonymousId: string;
 *   walletAddress?: string | null;
 *   chain?: 'solana' | 'base' | 'bsc';
 *   provisionedVia?: 'guest' | 'connect' | 'signin' | 'x402' | 'migration';
 *   payerAddress?: string | null;
 *   includeLp?: boolean;
 *   includeBalances?: boolean;
 * }} params
 */
export async function getAgentWalletSet(params) {
  const set = await ensureAgentWalletSet(params);
  const fields = walletSetResponseFields(set);

  if (!params.includeBalances) {
    return { ...fields, balances: null };
  }

  const purposes = [...PILLAR_WALLET_PURPOSES, ...(params.includeLp ? ['lp'] : [])];
  const balanceRows = await Promise.all(
    purposes.map(async (purpose) => {
      const row = set.wallets[purpose];
      if (!row?.agentAddress) return null;
      const bal = await fetchAgentWalletBalances(row.agentAddress);
      return bal ? [purpose, bal] : null;
    }),
  );
  const balances = {};
  for (const row of balanceRows) {
    if (!row) continue;
    balances[row[0]] = row[1];
  }

  return { ...fields, balances };
}

/**
 * Admin: list all agent wallet sets grouped by base anonymousId.
 * @param {{ limit?: number; offset?: number; q?: string }} [options]
 */
export async function listAgentWalletSetsForAdmin(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const q = typeof options.q === 'string' ? options.q.trim() : '';

  const match = { status: { $ne: 'retired' } };
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ walletAddress: re }, { agentAddress: re }, { anonymousId: re }, { payerAddress: re }];
  }

  const spendFilter = {
    ...match,
    $or: [{ purpose: 'spend' }, { purpose: 'chat' }, { purpose: { $exists: false } }, { purpose: null }],
  };

  const [total, primaryRows] = await Promise.all([
    AgentWallet.countDocuments(spendFilter),
    AgentWallet.find(spendFilter)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('anonymousId walletAddress chain provisionedVia payerAddress createdAt updatedAt agentAddress purpose')
      .lean(),
  ]);

  const baseIds = primaryRows.map((row) => baseAnonymousIdFrom(row.anonymousId) || row.anonymousId);
  const siblingIds = baseIds.flatMap((base) =>
    [...PILLAR_WALLET_PURPOSES.filter((p) => p !== 'spend'), 'lp'].map((p) => siblingAnonymousId(base, p)).filter(Boolean),
  );

  const siblings = await AgentWallet.find({
    anonymousId: { $in: siblingIds },
    status: { $ne: 'retired' },
  })
    .select('anonymousId agentAddress purpose provisionedVia payerAddress walletAddress chain createdAt updatedAt')
    .lean();

  const siblingById = new Map(siblings.map((s) => [s.anonymousId, s]));

  const agents = await Promise.all(
    primaryRows.map(async (primary) => {
      const base = baseAnonymousIdFrom(primary.anonymousId) || primary.anonymousId;
      const wallets = {};

      for (const purpose of [...PILLAR_WALLET_PURPOSES, 'lp']) {
        const id = purpose === 'spend' ? base : siblingAnonymousId(base, purpose);
        const doc = purpose === 'spend' ? primary : siblingById.get(id);
        if (!doc) continue;
        const balances = await fetchAgentWalletBalances(doc.agentAddress);
        wallets[purpose] = {
          anonymousId: doc.anonymousId,
          agentAddress: doc.agentAddress,
          purpose: normalizeAgentWalletPurpose(doc.purpose),
          provisionedVia: doc.provisionedVia || null,
          payerAddress: doc.payerAddress || null,
          walletAddress: doc.walletAddress || null,
          chain: doc.chain || 'solana',
          balances,
          createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt ?? null,
          updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt ?? null,
        };
      }

      return {
        baseAnonymousId: base,
        walletAddress: primary.walletAddress || null,
        payerAddress: primary.payerAddress || null,
        provisionedVia: primary.provisionedVia || null,
        chain: primary.chain || 'solana',
        wallets,
        createdAt: primary.createdAt?.toISOString?.() ?? primary.createdAt ?? null,
        updatedAt: primary.updatedAt?.toISOString?.() ?? primary.updatedAt ?? null,
      };
    }),
  );

  return { total, limit, offset, agents };
}
