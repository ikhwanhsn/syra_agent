/**
 * Admin-gated management API for x402 Labs — wallets, settings, manual runs, call log.
 * All endpoints accept a `chain` query/body param: `solana` (default) | `base` | `algorand`.
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../../libs/adminWallet.js';
import { requireMongooseConnection } from '../../config/mongoose.js';
import { requireSession } from '../../utils/requireSession.js';
import {
  createLabWallet,
  createLabWalletsBulk,
  listLabWallets,
  getLabWalletBalances,
  listActivePayerWallets,
} from '../../libs/labs/labWalletService.js';
import {
  runLabX402Payment,
  getLabX402Settings,
  updateLabX402Settings,
  listLabX402Calls,
  getLabX402VolumeStats,
} from '../../libs/labs/labX402Payer.js';
import { listLabX402EndpointsWithQuota } from '../../libs/labs/labX402Endpoints.js';
import { ensurePayerFundedForNextCall } from '../../libs/labs/labX402Refund.js';
import { restartLabX402Scheduler } from '../../libs/labs/labX402Scheduler.js';
import {
  getLabDepositHub,
  distributeLabDeposit,
} from '../../libs/labs/labDepositDistributor.js';
import { getMaxBulkCreateCount, logLabX402Call } from '../../libs/labs/labX402CallLog.js';
import { formatFundingSkipError } from '../../libs/labs/labFundingSkipMessage.js';
import {
  assessLabTreasury,
  recoverLabAutoCallFromTreasury,
} from '../../libs/labs/labTreasuryGuard.js';
import { normalizeLabChain } from '../../models/labs/LabX402Settings.js';

/**
 * Persist a funding skip so the Labs Call log is not empty when Run says "see Error column".
 * @param {{
 *   payerAddress: string;
 *   chain: 'solana' | 'base' | 'algorand';
 *   endpoint?: string;
 *   reason: string;
 *   error?: string;
 *   trigger?: 'manual' | 'scheduler';
 * }} input
 */
async function logFundingSkip(input) {
  try {
    await logLabX402Call({
      payerAddress: input.payerAddress,
      endpoint: input.endpoint || '(funding)',
      priceUsd: 0,
      chain: input.chain,
      status: 'error',
      error: formatFundingSkipError({
        reason: input.reason,
        error: input.error,
        includeTopUpHint: true,
      }),
      trigger: input.trigger === 'scheduler' ? 'scheduler' : 'manual',
    });
  } catch {
    /* never block the run response on log failure */
  }
}

/** @type {Map<string, number>} */
const manualRunCooldown = new Map();
const MANUAL_RUN_COOLDOWN_MS = 30_000;

/**
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @returns {'SOL' | 'ETH' | 'ALGO' | 'OKB'}
 */
function nativeSymbolForChain(chain) {
  if (chain === 'base') return 'ETH';
  if (chain === 'xlayer') return 'OKB';
  if (chain === 'algorand') return 'ALGO';
  return 'SOL';
}

/**
 * @param {import('express').Request} req
 * @returns {'solana' | 'base' | 'algorand'}
 */
function parseChain(req) {
  const raw = req.query?.chain ?? req.body?.chain;
  return normalizeLabChain(raw);
}

function requireManualRunCooldown(req, res, next) {
  const wallet = req.user?.walletAddress ?? '';
  const chain = parseChain(req);
  const key = `${String(wallet).trim()}:${chain}`;
  if (!key.startsWith(':')) {
    const last = manualRunCooldown.get(key) ?? 0;
    if (Date.now() - last < MANUAL_RUN_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        error: 'run_cooldown',
        message: 'Manual run cooldown — wait 30 seconds between batch runs.',
      });
    }
    manualRunCooldown.set(key, Date.now());
  }
  next();
}

/**
 * Admin gate (SECURITY): previous `x-admin-wallet` / `x-wallet-address` header fallback was
 * spoofable. Require a Syra session JWT whose verified wallet is on the admin allowlist.
 */
function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: 'admin_disabled' });
  }

  if (!req.user || req.user.guest || !req.user.walletAddress) {
    return res.status(401).json({ success: false, error: 'auth_required' });
  }
  if (!isAdminWalletAddress(req.user.walletAddress)) {
    return res.status(403).json({ success: false, error: 'not_admin' });
  }
  next();
}

export function createLabsX402Router() {
  const router = express.Router();
  router.use(requireSession(), requireAdminWallet, requireMongooseConnection);

  router.get('/wallets', async (req, res) => {
    try {
      const chain = parseChain(req);
      const wallets = await listLabWallets(chain);
      return res.json({ success: true, data: wallets });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list wallets' });
    }
  });

  router.post('/wallets', express.json(), async (req, res) => {
    try {
      const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
      const role = req.body?.role === 'payto' ? 'payto' : 'payer';
      const chain = parseChain(req);
      if (!label) {
        return res.status(400).json({ success: false, error: 'label is required' });
      }
      const wallet = await createLabWallet({ label, role, chain });
      return res.status(201).json({ success: true, data: wallet });
    } catch (e) {
      const status = /already exists|Maximum of/i.test(e?.message || '') ? 409 : 500;
      return res.status(status).json({ success: false, error: e?.message || 'Failed to create wallet' });
    }
  });

  router.post('/wallets/bulk', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const count = Number(req.body?.count);
      const labelPrefix =
        typeof req.body?.labelPrefix === 'string' ? req.body.labelPrefix.trim() : 'Payer';
      if (!Number.isFinite(count) || count < 1) {
        return res.status(400).json({ success: false, error: 'count must be a positive number' });
      }
      if (count > getMaxBulkCreateCount()) {
        return res.status(400).json({
          success: false,
          error: `count cannot exceed ${getMaxBulkCreateCount()} per request`,
        });
      }
      const wallets = await createLabWalletsBulk({
        count,
        chain,
        labelPrefix,
        role: 'payer',
      });
      return res.status(201).json({ success: true, data: wallets });
    } catch (e) {
      const status = /Maximum of/i.test(e?.message || '') ? 409 : 500;
      return res
        .status(status)
        .json({ success: false, error: e?.message || 'Failed to create wallets' });
    }
  });

  router.get('/wallets/:address/balance', async (req, res) => {
    try {
      const chain = parseChain(req);
      const balances = await getLabWalletBalances(req.params.address, chain);
      if (!balances) {
        return res
          .status(503)
          .json({ success: false, error: 'balance_unavailable', message: 'RPC balance read failed; try again shortly.' });
      }
      return res.json({
        success: true,
        data: {
          address: req.params.address,
          chain: balances.chain,
          nativeBalance: balances.nativeBalance,
          nativeSymbol: nativeSymbolForChain(balances.chain),
          solBalance: balances.nativeBalance,
          usdcBalance: balances.usdcBalance,
        },
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read balance' });
    }
  });

  router.get('/deposit', async (req, res) => {
    try {
      const chain = parseChain(req);
      const deposit = await getLabDepositHub(chain);
      return res.json({ success: true, data: deposit });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Failed to get deposit hub' });
    }
  });

  router.get('/treasury', async (req, res) => {
    try {
      const chain = parseChain(req);
      const [settings, payers] = await Promise.all([
        getLabX402Settings(chain),
        listActivePayerWallets(chain),
      ]);
      const assessment = await assessLabTreasury(chain, {
        payerCount: payers.length,
        priceMultiplier: settings.priceMultiplier,
      });
      return res.json({
        success: true,
        data: {
          ...assessment,
          autoCallEnabled: settings.autoCallEnabled,
          autoCallPausedReason: settings.autoCallPausedReason ?? null,
          autoCallPausedAt: settings.autoCallPausedAt ?? null,
          treasuryLastAlertAt: settings.treasuryLastAlertAt ?? null,
          paused: Boolean(settings.autoCallPausedReason),
          topUp: {
            payToAddress: assessment.payToAddress,
            funderAddress: assessment.funderAddress ?? assessment.payToAddress,
            hubAddress: assessment.hubAddress,
            usdcUsd: assessment.recommendedTopUpUsdc,
            native: assessment.recommendedTopUpNative,
            algo: assessment.recommendedTopUpAlgo,
            instructions: (() => {
              if (assessment.canFundAny) return null;
              if (assessment.hubHasFunds) {
                return `Deposit hub has funds. Click Distribute, or POST /labs/x402/deposit/distribute?chain=${chain}. The scheduler also auto-distributes when deposit distribute is enabled.`;
              }
              const stableSym = chain === 'xlayer' ? 'USDT0' : 'USDC';
              const nativeSym =
                chain === 'algorand'
                  ? 'ALGO'
                  : chain === 'base'
                    ? 'ETH'
                    : chain === 'xlayer'
                      ? 'OKB'
                      : 'SOL';
              const needUsdc = Number(assessment.recommendedTopUpUsdc || 0);
              const needNative = Number(assessment.recommendedTopUpNative || 0);
              const hubHint = assessment.hubAddress
                ? `, then Distribute from the hub if needed.`
                : '.';
              const dest = `any lab wallet (or deposit hub ${assessment.hubAddress || 'once created'})`;
              if (assessment.reason === 'payto_native_underfunded' && needNative > 0) {
                return (
                  `Fund ${dest} with ~${needNative.toFixed(4)} spendable ${nativeSym}` +
                  (needUsdc > 0 ? ` and ~$${needUsdc.toFixed(2)} ${stableSym}` : '') +
                  hubHint
                );
              }
              return (
                `Fund ${dest} with ~$${needUsdc.toFixed(2)} ${stableSym}` +
                (needNative > 0 ? ` and ~${needNative.toFixed(4)} ${nativeSym}` : '') +
                hubHint
              );
            })(),
          },
        },
      });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Failed to assess treasury' });
    }
  });

  router.post('/treasury/resume', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const assessment = await assessLabTreasury(chain, {
        payerCount: (await listActivePayerWallets(chain)).length,
      });
      if (!assessment.canFundAny) {
        return res.status(409).json({
          success: false,
          error: 'treasury_still_underfunded',
          message: `Cannot resume: ${assessment.reason || 'payto_underfunded'}. Fund any lab wallet or the deposit hub first.`,
          data: assessment,
        });
      }
      // Recover clears pause AND re-enables auto-call (prior chronic disable left enabled=false).
      await recoverLabAutoCallFromTreasury(chain);
      restartLabX402Scheduler(chain);
      const settings = await getLabX402Settings(chain);
      return res.json({
        success: true,
        data: {
          resumed: true,
          settings,
          treasury: assessment,
        },
      });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Failed to resume auto-call' });
    }
  });

  router.post('/deposit/distribute', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const result = await distributeLabDeposit(chain, { force: true });
      return res.json({ success: true, data: result });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Distribute failed' });
    }
  });

  router.get('/settings', async (req, res) => {
    try {
      const chain = parseChain(req);
      const settings = await getLabX402Settings(chain);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read settings' });
    }
  });

  router.put('/settings', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const settings = await updateLabX402Settings(req.body ?? {}, chain);
      restartLabX402Scheduler(chain);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to update settings' });
    }
  });

  router.post('/run', express.json(), requireManualRunCooldown, async (req, res) => {
    try {
      const chain = parseChain(req);
      const payerAddress =
        typeof req.body?.payerAddress === 'string' ? req.body.payerAddress.trim() : null;
      const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : undefined;

      const { refundEnabled, priceMultiplier } = await getLabX402Settings(chain);

      if (payerAddress) {
        const funding = await ensurePayerFundedForNextCall(payerAddress, {
          refundEnabled,
          chain,
          priceMultiplier,
        });
        if (!funding.canPay) {
          await logFundingSkip({
            payerAddress,
            chain,
            endpoint,
            reason: funding.reason,
            error: funding.error,
            trigger: 'manual',
          });
          return res.json({
            success: false,
            data: {
              success: false,
              endpoint: endpoint ?? null,
              skipped: true,
              reason: funding.reason,
              error: `Payer cannot pay (${funding.reason}). Top up the PayTo/payer wallet.`,
            },
          });
        }
        const result = await runLabX402Payment(payerAddress, {
          endpoint,
          trigger: 'manual',
          chain,
        });
        return res.json({ success: true, data: result });
      }

      const payers = await listActivePayerWallets(chain);
      if (payers.length === 0) {
        return res.status(400).json({ success: false, error: 'No active payer wallets' });
      }

      const results = [];
      for (const p of payers) {
        const funding = await ensurePayerFundedForNextCall(p.address, {
          refundEnabled,
          chain,
          priceMultiplier,
        });
        if (!funding.canPay) {
          await logFundingSkip({
            payerAddress: p.address,
            chain,
            endpoint,
            reason: funding.reason,
            error: funding.error,
            trigger: 'manual',
          });
          results.push({
            success: false,
            endpoint: endpoint ?? null,
            skipped: true,
            reason: funding.reason,
            error: `Payer cannot pay (${funding.reason}).`,
          });
          continue;
        }
        results.push(
          await runLabX402Payment(p.address, { endpoint, trigger: 'manual', chain }),
        );
      }
      return res.json({ success: true, data: { results } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Run failed' });
    }
  });

  router.get('/calls', async (req, res) => {
    try {
      const chain = parseChain(req);
      const limit = Number(req.query?.limit) || 10;
      const calls = await listLabX402Calls({ limit, chain });
      return res.json({ success: true, data: calls });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list calls' });
    }
  });

  router.get('/volume', async (req, res) => {
    try {
      const chain = parseChain(req);
      const stats = await getLabX402VolumeStats(chain);
      return res.json({ success: true, data: stats });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read volume' });
    }
  });

  router.get('/endpoints', async (_req, res) => {
    try {
      const endpoints = await listLabX402EndpointsWithQuota();
      return res.json({ success: true, data: endpoints });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list endpoints' });
    }
  });

  return router;
}
