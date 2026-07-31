/**
 * Migrate LP wallets (:lp) → earn wallets (:earn) for ALL users.
 * Per wallet: close positions → sweep SOL/SPL → point LpRealConfig at earn → retire :lp.
 * Idempotent per wallet / step.
 */
import AgentWallet from '../models/agent/AgentWallet.js';
import LpRealConfig from '../models/LpRealConfig.js';
import LpRealPosition from '../models/LpRealPosition.js';
import {
  baseAnonymousIdFrom,
  siblingAnonymousId,
  purposeQuery,
  lpAnonymousIdFromChat,
} from './agentWalletPurpose.js';
import { ensureAgentWalletSet, createAgentWalletRecord } from './agentWalletProvision.js';
import { resolveLpRealPositions } from './lpRealService.js';
import { LP_REAL_TOOL_IDS } from '../services/policyEngine.js';
import { snapshotAgentBalances, sweepAgentToAgent } from './agentWalletSweep.js';
import { ADMIN_DASHBOARD_WALLETS, isAdminWalletAddress } from './adminWallet.js';

const OPEN_STATUSES = Object.freeze(['open', 'opening', 'closing']);
const LP_DEFAULT_TOOLS = Object.freeze([...LP_REAL_TOOL_IDS, 'lp_real_swap']);
/** Leave this much SOL on LP after sweep; treat remaining as "empty". */
const DUST_SOL = 0.005;

/**
 * Recover original base anonymousId from a (possibly retired) LP anonymousId.
 * e.g. retired:123:wallet:ADDR:lp → wallet:ADDR
 * @param {string} anonymousId
 */
export function recoverBaseFromLpAnonymousId(anonymousId) {
  let id = String(anonymousId || '').trim();
  if (!id) return null;
  if (id.startsWith('retired:')) {
    // retired:<timestamp>:<originalId>
    const rest = id.replace(/^retired:\d+:/, '');
    id = rest || id;
  }
  return baseAnonymousIdFrom(id) || (id.endsWith(':lp') ? id.slice(0, -3) : id);
}

/**
 * List all LP wallets (active + retired that still have an agentAddress).
 * @returns {Promise<Array<import('mongoose').LeanDocument>>}
 */
export async function listAllLpAgentWallets() {
  return AgentWallet.find({
    purpose: 'lp',
    agentAddress: { $exists: true, $nin: [null, ''] },
  })
    .select('anonymousId agentAddress walletAddress status purpose chain custody privyWalletId createdAt updatedAt')
    .lean();
}

/**
 * Resolve earn sibling for an LP wallet row; create earn if missing.
 * @param {import('mongoose').LeanDocument} lpDoc
 */
export async function resolveEarnSiblingForLp(lpDoc) {
  const base = recoverBaseFromLpAnonymousId(lpDoc.anonymousId);
  if (!base) {
    const err = new Error('lp_base_anonymous_id_invalid');
    err.code = 'lp_base_anonymous_id_invalid';
    throw err;
  }

  const earnId = siblingAnonymousId(base, 'earn');
  let earn = earnId
    ? await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean()
    : null;

  if (!earn && lpDoc.walletAddress) {
    await ensureAgentWalletSet({
      baseAnonymousId: base,
      walletAddress: lpDoc.walletAddress,
      chain: lpDoc.chain || 'solana',
      provisionedVia: 'migration',
    });
    earn = earnId
      ? await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean()
      : null;
  }

  if (!earn && earnId) {
    // Guest / unlinked LP — create earn sibling sharing same linked walletAddress if any.
    await createAgentWalletRecord({
      anonymousId: earnId,
      purpose: 'earn',
      walletAddress: lpDoc.walletAddress || null,
      chain: lpDoc.chain || 'solana',
      avatarSeed: earnId,
      provisionedVia: 'migration',
    });
    earn = await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean();
  }

  if (!earn?.agentAddress) {
    const err = new Error('earn_wallet_not_found');
    err.code = 'earn_wallet_not_found';
    throw err;
  }

  return {
    baseAnonymousId: base,
    ownerWallet: lpDoc.walletAddress || null,
    lp: lpDoc,
    earn,
    lpAnonymousId: lpDoc.anonymousId,
    earnAnonymousId: earn.anonymousId,
  };
}

async function countOpenPositions(agentAddress) {
  if (!agentAddress) return 0;
  return LpRealPosition.countDocuments({
    agentAddress: String(agentAddress),
    status: { $in: OPEN_STATUSES },
  });
}

/**
 * Temporarily set a retired LP wallet back to active so the broker can sign the sweep.
 * Returns a restore fn.
 * @param {import('mongoose').LeanDocument} lpDoc
 */
async function temporarilyActivateForSweep(lpDoc) {
  if (lpDoc.status === 'active') {
    return { restore: async () => {}, activated: false };
  }
  await AgentWallet.updateOne(
    { _id: lpDoc._id },
    { $set: { status: 'active' } },
  );
  return {
    activated: true,
    restore: async () => {
      await AgentWallet.updateOne(
        { _id: lpDoc._id },
        { $set: { status: lpDoc.status || 'retired' } },
      );
    },
  };
}

/**
 * Close open positions for one LP wallet.
 * @param {import('mongoose').LeanDocument} lpDoc
 * @param {{ dryRun?: boolean; maxWaitMs?: number }} [opts]
 */
export async function closePositionsForLpWallet(lpDoc, opts = {}) {
  if (!lpDoc?.agentAddress) {
    return { step: 'close', ok: true, skipped: 'no_agent_address' };
  }

  const openBefore = await countOpenPositions(lpDoc.agentAddress);
  const config = await LpRealConfig.findOne({ agentAddress: lpDoc.agentAddress }).lean();

  if (opts.dryRun) {
    return {
      step: 'close',
      ok: true,
      dryRun: true,
      openBefore,
      hasConfig: Boolean(config),
      lpAnonymousId: lpDoc.anonymousId,
      lpAgentAddress: lpDoc.agentAddress,
    };
  }

  if (openBefore === 0 && !config) {
    return {
      step: 'close',
      ok: true,
      openBefore: 0,
      openAfter: 0,
      lpAnonymousId: lpDoc.anonymousId,
      lpAgentAddress: lpDoc.agentAddress,
    };
  }

  const { restore, activated } = await temporarilyActivateForSweep(lpDoc);
  try {
    if (config) {
      await LpRealConfig.updateOne(
        { agentAddress: lpDoc.agentAddress },
        { $set: { enabled: false, closeAllRequested: true, lastError: null } },
      );
    }

    await LpRealPosition.updateMany(
      {
        agentAddress: lpDoc.agentAddress,
        status: { $in: OPEN_STATUSES },
        processing: true,
      },
      { $set: { processing: false } },
    );

    let resolveResult = null;
    if (openBefore > 0 || config) {
      resolveResult = await resolveLpRealPositions({
        forceCloseAll: true,
        agentAddress: lpDoc.agentAddress,
      });
    }

    const maxWaitMs = Number.isFinite(opts.maxWaitMs) ? opts.maxWaitMs : 120_000;
    const started = Date.now();
    let openAfter = await countOpenPositions(lpDoc.agentAddress);
    while (openAfter > 0 && Date.now() - started < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 5_000));
      resolveResult = await resolveLpRealPositions({
        forceCloseAll: true,
        agentAddress: lpDoc.agentAddress,
      });
      openAfter = await countOpenPositions(lpDoc.agentAddress);
    }

    if (openAfter > 0) {
      const err = new Error(`lp_positions_still_open:${openAfter}`);
      err.code = 'lp_positions_still_open';
      err.openCount = openAfter;
      err.resolveResult = resolveResult;
      throw err;
    }

    return {
      step: 'close',
      ok: true,
      openBefore,
      openAfter,
      temporarilyActivated: activated,
      resolveResult: resolveResult
        ? {
            resolved: resolveResult.resolved,
            openChecked: resolveResult.openChecked,
            errors: resolveResult.errors,
          }
        : null,
      lpAnonymousId: lpDoc.anonymousId,
      lpAgentAddress: lpDoc.agentAddress,
    };
  } finally {
    await restore();
  }
}

/**
 * Sweep SOL + SPL from one LP wallet → its earn sibling.
 * @param {import('mongoose').LeanDocument} lpDoc
 * @param {{ dryRun?: boolean; ip?: string; userAgent?: string; sessionId?: string }} [opts]
 */
export async function sweepLpWalletToEarn(lpDoc, opts = {}) {
  if (!lpDoc?.agentAddress) {
    return { step: 'sweep', ok: true, skipped: 'no_agent_address' };
  }

  const ctx = await resolveEarnSiblingForLp(lpDoc);
  const openCount = await countOpenPositions(lpDoc.agentAddress);
  if (openCount > 0) {
    const err = new Error(`close_positions_first:${openCount}`);
    err.code = 'close_positions_first';
    err.openCount = openCount;
    throw err;
  }

  const before = await snapshotAgentBalances(lpDoc.agentAddress);
  const hasFunds =
    before.sol > DUST_SOL || (Array.isArray(before.tokens) && before.tokens.length > 0);

  if (!hasFunds) {
    return {
      step: 'sweep',
      ok: true,
      skipped: 'nothing_to_sweep',
      before,
      earnAgentAddress: ctx.earn.agentAddress,
      lpAnonymousId: lpDoc.anonymousId,
      ctx: summarizePair(ctx),
    };
  }

  if (opts.dryRun) {
    return {
      step: 'sweep',
      ok: true,
      dryRun: true,
      before,
      earnAgentAddress: ctx.earn.agentAddress,
      lpAnonymousId: lpDoc.anonymousId,
      ctx: summarizePair(ctx),
    };
  }

  const { restore, activated } = await temporarilyActivateForSweep(lpDoc);
  try {
    // Refresh doc after possible status flip — broker looks up by anonymousId.
    const liveLp = await AgentWallet.findById(lpDoc._id).lean();
    const fromId = liveLp?.anonymousId || lpDoc.anonymousId;

    const earnBefore = await snapshotAgentBalances(ctx.earn.agentAddress);
    const result = await sweepAgentToAgent(fromId, ctx.earn.agentAddress, {
      dryRun: false,
      ip: opts.ip,
      userAgent: opts.userAgent,
      sessionId: opts.sessionId,
    });
    const earnAfter = await snapshotAgentBalances(ctx.earn.agentAddress);

    return {
      step: 'sweep',
      ok: true,
      temporarilyActivated: activated,
      lpSweep: result,
      earnBefore,
      earnAfter,
      lpAnonymousId: fromId,
      ctx: summarizePair(ctx),
    };
  } finally {
    await restore();
  }
}

/**
 * Point LpRealConfig at earn, bump earn policy, retire :lp.
 * @param {import('mongoose').LeanDocument} lpDoc
 * @param {{ dryRun?: boolean }} [opts]
 */
export async function repointAndRetireLpWallet(lpDoc, opts = {}) {
  const ctx = await resolveEarnSiblingForLp(lpDoc);

  if (lpDoc.agentAddress) {
    const openCount = await countOpenPositions(lpDoc.agentAddress);
    if (openCount > 0) {
      const err = new Error(`close_positions_first:${openCount}`);
      err.code = 'close_positions_first';
      err.openCount = openCount;
      throw err;
    }
  }

  const lpConfig = lpDoc.agentAddress
    ? await LpRealConfig.findOne({ agentAddress: lpDoc.agentAddress }).lean()
    : null;
  const existingEarnConfig = await LpRealConfig.findOne({
    agentAddress: ctx.earn.agentAddress,
  }).lean();

  if (opts.dryRun) {
    return {
      step: 'repoint',
      ok: true,
      dryRun: true,
      hasLpConfig: Boolean(lpConfig),
      hasEarnConfig: Boolean(existingEarnConfig),
      lpStatus: lpDoc.status,
      ctx: summarizePair(ctx),
    };
  }

  const earnWallet = await AgentWallet.findOne({ anonymousId: ctx.earnAnonymousId })
    .select('allowedTools perTxCapUsd dailySpendCapUsd hourlySpendCapUsd')
    .lean();
  const tools = new Set([...(earnWallet?.allowedTools || []), ...LP_DEFAULT_TOOLS]);
  await AgentWallet.updateOne(
    { anonymousId: ctx.earnAnonymousId },
    {
      $set: {
        allowedTools: [...tools],
        perTxCapUsd: Math.max(Number(earnWallet?.perTxCapUsd) || 0, 250),
        dailySpendCapUsd: Math.max(Number(earnWallet?.dailySpendCapUsd) || 0, 2500),
        hourlySpendCapUsd: Math.max(Number(earnWallet?.hourlySpendCapUsd) || 0, 400),
      },
    },
  );

  const capsFromLp = lpConfig
    ? {
        targetBankSol: lpConfig.targetBankSol,
        maxPositionSol: lpConfig.maxPositionSol,
        maxConcurrentPositions: lpConfig.maxConcurrentPositions,
        reserveSolForFees: lpConfig.reserveSolForFees,
        strategySelectionMode: lpConfig.strategySelectionMode,
        currentStrategyId: lpConfig.currentStrategyId,
        publicEarnListed: lpConfig.publicEarnListed,
        depositsPaused: lpConfig.depositsPaused,
        publicMaxDepositSol: lpConfig.publicMaxDepositSol,
        performanceFeeBps: lpConfig.performanceFeeBps,
        capitalBaselineSol: lpConfig.capitalBaselineSol,
        publicEarnStartedAt: lpConfig.publicEarnStartedAt,
        earnStatsEpoch: lpConfig.earnStatsEpoch,
      }
    : {};

  if (lpConfig) {
    await LpRealConfig.updateOne(
      { agentAddress: lpDoc.agentAddress },
      {
        $set: {
          enabled: false,
          closeAllRequested: false,
          publicEarnListed: false,
          depositsPaused: true,
          lastError: 'migrated_to_earn_wallet',
        },
      },
    );
  }

  const earnExperimentId =
    existingEarnConfig?.experimentId ||
    `lp-earn-${ctx.earn.agentAddress.slice(0, 8)}-${Date.now()}`;

  const earnConfigFields = {
    anonymousId: ctx.earnAnonymousId,
    agentAddress: ctx.earn.agentAddress,
    enabled: false,
    experimentId: earnExperimentId,
    title: existingEarnConfig?.title || 'LP Real Agent (Meteora DLMM)',
    startedAt: existingEarnConfig?.startedAt || new Date(),
    ...Object.fromEntries(
      Object.entries(capsFromLp).filter(([, v]) => v !== undefined && v !== null),
    ),
    lastError: null,
    closeAllRequested: false,
  };

  if (existingEarnConfig) {
    await LpRealConfig.updateOne(
      { agentAddress: ctx.earn.agentAddress },
      { $set: earnConfigFields },
    );
  } else if (lpConfig || existingEarnConfig) {
    await LpRealConfig.create({
      _id: ctx.earn.agentAddress,
      ...earnConfigFields,
    });
  }
  // If user never had LP config, don't create a new earn LpRealConfig — just retire the wallet.

  let retired = null;
  const live = await AgentWallet.findById(lpDoc._id).lean();
  if (live && live.status !== 'retired') {
    const prevId = live.anonymousId;
    const retiredAnonymousId = `retired:${Date.now()}:${prevId}`.slice(0, 240);
    await AgentWallet.updateOne(
      { _id: live._id },
      {
        $set: {
          status: 'retired',
          anonymousId: retiredAnonymousId,
        },
      },
    );
    retired = {
      previousAnonymousId: prevId,
      retiredAnonymousId,
      agentAddress: live.agentAddress,
    };
  } else if (live?.status === 'retired') {
    retired = {
      previousAnonymousId: live.anonymousId,
      retiredAnonymousId: live.anonymousId,
      agentAddress: live.agentAddress,
      alreadyRetired: true,
    };
  }

  return {
    step: 'repoint',
    ok: true,
    earnAnonymousId: ctx.earnAnonymousId,
    earnAgentAddress: ctx.earn.agentAddress,
    retired,
    ctx: summarizePair(ctx),
  };
}

/**
 * Full migration for one LP wallet document.
 * @param {import('mongoose').LeanDocument} lpDoc
 * @param {{ dryRun?: boolean; confirm?: boolean; ip?: string; userAgent?: string; sessionId?: string; maxWaitMs?: number }} [opts]
 */
export async function migrateOneLpWallet(lpDoc, opts = {}) {
  if (!opts.dryRun && !opts.confirm) {
    const err = new Error('confirm_required');
    err.code = 'confirm_required';
    throw err;
  }

  const close = await closePositionsForLpWallet(lpDoc, opts);
  const sweep = await sweepLpWalletToEarn(lpDoc, opts);
  const repoint = await repointAndRetireLpWallet(lpDoc, opts);
  return {
    ok: true,
    dryRun: Boolean(opts.dryRun),
    lpAnonymousId: lpDoc.anonymousId,
    lpAgentAddress: lpDoc.agentAddress,
    close,
    sweep,
    repoint,
  };
}

/**
 * Migrate every LP wallet that still exists (active or retired-with-address).
 * Skips wallets with no residual funds AND no open positions AND already retired (noop).
 *
 * @param {{ dryRun?: boolean; confirm?: boolean; ip?: string; userAgent?: string; sessionId?: string; onlyWithFunds?: boolean }} [opts]
 */
export async function migrateAllLpWalletsToEarn(opts = {}) {
  if (!opts.dryRun && !opts.confirm) {
    const err = new Error('confirm_required — pass confirm:true or --confirm');
    err.code = 'confirm_required';
    throw err;
  }

  const all = await listAllLpAgentWallets();
  const results = [];
  const errors = [];

  for (const lp of all) {
    try {
      const openCount = await countOpenPositions(lp.agentAddress);
      let balances = null;
      try {
        balances = await snapshotAgentBalances(lp.agentAddress);
      } catch (e) {
        balances = { error: e?.message || String(e) };
      }
      const hasFunds =
        balances &&
        !balances.error &&
        (balances.sol > DUST_SOL || (balances.tokens && balances.tokens.length > 0));

      if (opts.onlyWithFunds !== false && !hasFunds && openCount === 0 && lp.status === 'retired') {
        results.push({
          ok: true,
          skipped: 'already_retired_empty',
          lpAnonymousId: lp.anonymousId,
          lpAgentAddress: lp.agentAddress,
          sol: balances?.sol ?? null,
        });
        continue;
      }

      // Always process if funds or open positions or still active.
      if (!hasFunds && openCount === 0 && lp.status !== 'active') {
        results.push({
          ok: true,
          skipped: 'no_funds_no_open',
          lpAnonymousId: lp.anonymousId,
          lpAgentAddress: lp.agentAddress,
          sol: balances?.sol ?? null,
        });
        continue;
      }

      console.log(
        `[lp→earn] migrating ${lp.anonymousId} agent=${lp.agentAddress} sol=${balances?.sol ?? '?'} open=${openCount}`,
      );
      const one = await migrateOneLpWallet(lp, opts);
      results.push(one);
    } catch (err) {
      const row = {
        ok: false,
        lpAnonymousId: lp.anonymousId,
        lpAgentAddress: lp.agentAddress,
        error: err?.code || err?.message || String(err),
        openCount: err?.openCount,
      };
      errors.push(row);
      results.push(row);
      console.error(`[lp→earn] FAILED ${lp.anonymousId}:`, err?.message || err);
    }
  }

  return {
    ok: errors.length === 0,
    dryRun: Boolean(opts.dryRun),
    total: all.length,
    migrated: results.filter((r) => r.ok && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: errors.length,
    results,
    errors,
  };
}

// ─── Back-compat: admin-only helpers used by existing admin route / script ───

/**
 * @deprecated Prefer migrateAllLpWalletsToEarn. Kept for admin route single-wallet path.
 */
export async function resolveAdminLpMigrationWallets(ownerWallet) {
  const address =
    typeof ownerWallet === 'string' && ownerWallet.trim()
      ? ownerWallet.trim()
      : ADMIN_DASHBOARD_WALLETS[0];
  if (!isAdminWalletAddress(address)) {
    const err = new Error('not_admin');
    err.code = 'not_admin';
    throw err;
  }

  const spend = await AgentWallet.findOne({
    walletAddress: address,
    status: { $ne: 'retired' },
    ...purposeQuery('spend'),
    $or: [{ chain: 'solana' }, { chain: { $exists: false } }, { chain: null }],
  }).lean();

  if (!spend?.anonymousId) {
    const err = new Error('admin_spend_wallet_not_found');
    err.code = 'admin_spend_wallet_not_found';
    throw err;
  }

  const base = baseAnonymousIdFrom(spend.anonymousId) || spend.anonymousId;
  const lpId = lpAnonymousIdFromChat(base);
  let lp = lpId ? await AgentWallet.findOne({ anonymousId: lpId }).lean() : null;
  if (!lp) {
    lp = await AgentWallet.findOne({
      walletAddress: address,
      purpose: 'lp',
    }).lean();
  }

  let earn = null;
  let earnAnonymousId = siblingAnonymousId(base, 'earn');
  let lpAnonymousId = lp?.anonymousId || lpId;

  if (lp) {
    const pair = await resolveEarnSiblingForLp(lp);
    earn = pair.earn;
    earnAnonymousId = pair.earnAnonymousId;
    lpAnonymousId = pair.lpAnonymousId;
  } else {
    await ensureAgentWalletSet({
      baseAnonymousId: base,
      walletAddress: address,
      chain: 'solana',
      provisionedVia: 'migration',
    });
    earn = await AgentWallet.findOne({
      anonymousId: earnAnonymousId,
      status: { $ne: 'retired' },
    }).lean();
  }

  if (!earn?.agentAddress) {
    const err = new Error('earn_wallet_not_found');
    err.code = 'earn_wallet_not_found';
    throw err;
  }

  return {
    ownerWallet: address,
    baseAnonymousId: base,
    spend,
    lp,
    earn,
    lpAnonymousId,
    earnAnonymousId: earn.anonymousId,
  };
}

export async function migrateLpClosePositions(opts = {}) {
  const ctx = await resolveAdminLpMigrationWallets(opts.ownerWallet);
  if (!ctx.lp) {
    return { step: 'close', ok: true, skipped: 'no_lp_wallet', ctx: summarizeCtx(ctx) };
  }
  return closePositionsForLpWallet(ctx.lp, opts);
}

export async function migrateLpSweepToEarn(opts = {}) {
  const ctx = await resolveAdminLpMigrationWallets(opts.ownerWallet);
  if (!ctx.lp) {
    return { step: 'sweep', ok: true, skipped: 'no_lp_wallet', ctx: summarizeCtx(ctx) };
  }
  return sweepLpWalletToEarn(ctx.lp, opts);
}

export async function migrateLpRepointAndRetire(opts = {}) {
  const ctx = await resolveAdminLpMigrationWallets(opts.ownerWallet);
  if (!ctx.lp) {
    return { step: 'repoint', ok: true, skipped: 'no_lp_wallet', ctx: summarizeCtx(ctx) };
  }
  return repointAndRetireLpWallet(ctx.lp, opts);
}

export async function runLpToEarnMigration(opts = {}) {
  if (!opts.dryRun && !opts.confirm) {
    const err = new Error('confirm_required — pass confirm:true or --confirm');
    err.code = 'confirm_required';
    throw err;
  }
  // Default: migrate ALL wallets (not just admin).
  if (opts.all !== false && !opts.ownerWallet) {
    return migrateAllLpWalletsToEarn(opts);
  }
  const close = await migrateLpClosePositions(opts);
  const sweep = await migrateLpSweepToEarn(opts);
  const repoint = await migrateLpRepointAndRetire(opts);
  return { ok: true, dryRun: Boolean(opts.dryRun), close, sweep, repoint };
}

function summarizePair(ctx) {
  return {
    ownerWallet: ctx.ownerWallet,
    baseAnonymousId: ctx.baseAnonymousId,
    lpAnonymousId: ctx.lpAnonymousId || null,
    lpAgentAddress: ctx.lp?.agentAddress || null,
    lpStatus: ctx.lp?.status || null,
    earnAnonymousId: ctx.earnAnonymousId || null,
    earnAgentAddress: ctx.earn?.agentAddress || null,
  };
}

function summarizeCtx(ctx) {
  return summarizePair(ctx);
}
