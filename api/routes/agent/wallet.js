import express from 'express';
import { Keypair } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';
import pkg from 'random-avatar-generator';
import AgentWallet from '../../models/agent/AgentWallet.js';
import { buildPaymentHeaderFrom402Body } from '../../libs/agentX402Client.js';
import { getSolanaAgentAddress } from '../../libs/agentWallet.js';
import { withdrawSolanaAgentToRecipient } from '../../libs/agentWalletWithdrawSol.js';
import { encryptAgentSecretForStorage } from '../../libs/agentWalletSecretCrypto.js';
import { pickSolanaConnectionForReads } from '../../libs/solanaServerRpc.js';

const { AvatarGenerator } = pkg;
const avatarGenerator = new AvatarGenerator();

const router = express.Router();

const LIST_DEFAULT_LIMIT = 100;
const LIST_MAX_LIMIT = 200;
const WALLET_GROUP_DEFAULT_LIMIT = 10;
const WALLET_GROUP_MAX_LIMIT = 50;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLinkedWalletMatch(walletFilter, search, chain) {
  const clauses = [{ walletAddress: { $exists: true, $nin: [null, ''] } }];
  if (walletFilter) clauses.push({ walletAddress: walletFilter });
  const q = typeof search === 'string' ? search.trim() : '';
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    clauses.push({ $or: [{ walletAddress: re }, { agentAddress: re }, { anonymousId: re }] });
  }
  if (chain === 'base') {
    clauses.push({ chain: 'base' });
  } else if (chain === 'solana') {
    clauses.push({
      $or: [{ chain: 'solana' }, { chain: { $exists: false } }, { chain: null }],
    });
  }
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function serializeAgentDoc(doc) {
  return {
    anonymousId: doc.anonymousId,
    walletAddress: doc.walletAddress,
    chain: doc.chain || 'solana',
    agentAddress: doc.agentAddress,
    avatarUrl: doc.avatarUrl || null,
    createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt ?? null,
  };
}

async function listGlobalStats(match) {
  const [totalAgents, totalUsers, chainCounts] = await Promise.all([
    AgentWallet.countDocuments(match),
    AgentWallet.distinct('walletAddress', match).then((rows) => rows.length),
    AgentWallet.aggregate([
      { $match: match },
      { $group: { _id: { $ifNull: ['$chain', 'solana'] }, count: { $sum: 1 } } },
    ]),
  ]);
  let solanaCount = 0;
  let baseCount = 0;
  for (const row of chainCounts) {
    if (row._id === 'base') baseCount = row.count;
    else solanaCount += row.count;
  }
  return { totalAgents, totalUsers, solanaCount, baseCount };
}

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;

function generateAnonymousId() {
  return crypto.randomUUID?.() ?? crypto.randomBytes(16).toString('hex');
}

/** Decode :anonymousId param (may be URL-encoded, e.g. wallet%3A... from Privy wallet connect). */
function decodeAnonymousId(param) {
  if (param == null || param === '') return param;
  try {
    return decodeURIComponent(String(param));
  } catch {
    return param;
  }
}

/**
 * GET /agent/wallet/list
 * List agent wallets linked to user wallets (walletAddress set).
 * Query:
 *   - groupBy=wallet — paginate by user wallet (nested agents per wallet)
 *   - limit, offset — page size (wallet groups or flat agents)
 *   - walletAddress — exact user wallet filter
 *   - q — search wallet / agent / anonymousId (case-insensitive)
 *   - chain — "solana" | "base" (optional)
 */
router.get('/list', async (req, res) => {
  try {
    const rawLimit = Number.parseInt(String(req.query?.limit ?? ''), 10);
    const rawOffset = Number.parseInt(String(req.query?.offset ?? ''), 10);
    const groupByWallet = req.query?.groupBy === 'wallet';
    const maxLimit = groupByWallet ? WALLET_GROUP_MAX_LIMIT : LIST_MAX_LIMIT;
    const defaultLimit = groupByWallet ? WALLET_GROUP_DEFAULT_LIMIT : LIST_DEFAULT_LIMIT;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), maxLimit)
      : defaultLimit;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
    const walletFilter =
      typeof req.query?.walletAddress === 'string' && req.query.walletAddress.trim()
        ? req.query.walletAddress.trim()
        : null;
    const search = typeof req.query?.q === 'string' ? req.query.q : '';
    const chainParam = req.query?.chain === 'base' ? 'base' : req.query?.chain === 'solana' ? 'solana' : null;

    const match = buildLinkedWalletMatch(walletFilter, search, chainParam);

    if (groupByWallet) {
      const stats = await listGlobalStats(match);
      const grouped = await AgentWallet.aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: '$walletAddress',
            agents: {
              $push: {
                anonymousId: '$anonymousId',
                walletAddress: '$walletAddress',
                chain: { $ifNull: ['$chain', 'solana'] },
                agentAddress: '$agentAddress',
                avatarUrl: '$avatarUrl',
                createdAt: '$createdAt',
                updatedAt: '$updatedAt',
              },
            },
            latestUpdatedAt: { $max: '$updatedAt' },
          },
        },
        { $sort: { latestUpdatedAt: -1 } },
        {
          $facet: {
            page: [{ $skip: offset }, { $limit: limit }],
            meta: [{ $count: 'totalUsers' }],
          },
        },
      ]);

      const facet = grouped[0] ?? { page: [], meta: [] };
      const totalUsers = facet.meta[0]?.totalUsers ?? stats.totalUsers;
      const wallets = (facet.page ?? []).map((row) => ({
        walletAddress: row._id,
        latestUpdatedAt: row.latestUpdatedAt?.toISOString?.() ?? row.latestUpdatedAt ?? null,
        agents: (row.agents ?? []).map((doc) => serializeAgentDoc(doc)),
      }));

      return res.json({
        success: true,
        groupBy: 'wallet',
        totalAgents: stats.totalAgents,
        totalUsers,
        solanaCount: stats.solanaCount,
        baseCount: stats.baseCount,
        limit,
        offset,
        wallets,
      });
    }

    const sortParam = req.query?.sort;
    const orderDir = req.query?.order === 'asc' ? 1 : -1;
    let sortSpec = { updatedAt: orderDir };
    if (sortParam === 'wallet') sortSpec = { walletAddress: orderDir, updatedAt: -1 };
    else if (sortParam === 'chain') sortSpec = { chain: orderDir, walletAddress: orderDir, updatedAt: -1 };
    else if (sortParam === 'agent') sortSpec = { agentAddress: orderDir, updatedAt: -1 };

    const [total, agents, stats] = await Promise.all([
      AgentWallet.countDocuments(match),
      AgentWallet.find(match)
        .select('anonymousId walletAddress chain agentAddress avatarUrl createdAt updatedAt')
        .sort(sortSpec)
        .skip(offset)
        .limit(limit)
        .lean(),
      listGlobalStats(match),
    ]);

    const userIds = new Set(agents.map((a) => a.walletAddress).filter(Boolean));

    return res.json({
      success: true,
      total,
      userCount: userIds.size,
      totalAgents: stats.totalAgents,
      totalUsers: stats.totalUsers,
      solanaCount: stats.solanaCount,
      baseCount: stats.baseCount,
      limit,
      offset,
      agents: agents.map((doc) => serializeAgentDoc(doc)),
    });
  } catch (error) {
    console.error('[agent/wallet] list error:', error?.message ?? String(error));
    return res.status(500).json({ success: false, error: error.message || 'Failed to list agent wallets' });
  }
});

/**
 * GET /agent/wallet/:anonymousId/balance
 * Returns SOL and USDC balance for the agent wallet.
 */
router.get('/:anonymousId/balance', async (req, res) => {
  let anonymousId;
  let doc;
  try {
    anonymousId = decodeAnonymousId(req.params.anonymousId);
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    doc = await AgentWallet.findOne({ anonymousId }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }
    if (!doc.agentAddress) {
      return res.status(500).json({ success: false, error: 'Agent wallet missing agentAddress' });
    }
  } catch (err) {
    console.error('[agent/wallet] balance lookup error:', err?.message ?? String(err));
    return res.status(500).json({ success: false, error: err?.message || 'Failed to lookup agent wallet' });
  }

  let agentPubkey;
  try {
    agentPubkey = new PublicKey(doc.agentAddress);
  } catch (err) {
    console.error('[agent/wallet] invalid agentAddress:', err?.message ?? String(err));
    return res.status(500).json({ success: false, error: 'Invalid agent wallet address' });
  }

  let solLamports;
  let tokenAccounts;
  try {
    const picked = await pickSolanaConnectionForReads(agentPubkey);
    solLamports = picked.lamports;
    tokenAccounts = await picked.connection.getParsedTokenAccountsByOwner(agentPubkey, {
      mint: USDC_MAINNET,
    });
  } catch (err) {
    const isRpcUnavailable =
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ETIMEDOUT' ||
      /fetch failed|ConnectTimeoutError|ECONNREFUSED|ETIMEDOUT|timeout|network/i.test(String(err?.message || ''));
    console.error('[agent/wallet] Solana RPC error:', err?.message ?? String(err));
    const message = isRpcUnavailable
      ? 'Solana RPC unavailable. Check SOLANA_RPC_URL in api/.env and network connectivity.'
      : (err?.message || 'Failed to fetch balance');
    return res.status(isRpcUnavailable ? 503 : 500).json({ success: false, error: message });
  }

  const solBalance = Number(solLamports) / LAMPORTS_PER_SOL;
  const accounts = tokenAccounts?.value ?? (Array.isArray(tokenAccounts) ? tokenAccounts : []);
  let usdcBalance = 0;
  try {
    for (const acc of accounts) {
      const parsed = acc?.account?.data?.parsed ?? acc?.account?.data;
      const info = parsed?.info ?? parsed;
      const tokenAmount = info?.tokenAmount ?? info;
      const ui = tokenAmount?.uiAmount ?? tokenAmount?.uiAmountString;
      usdcBalance += Number(ui) || 0;
    }
  } catch (err) {
    console.error('[agent/wallet] USDC parse error:', err?.message ?? String(err));
  }

  return res.json({
    success: true,
    agentAddress: doc.agentAddress,
    solBalance,
    usdcBalance,
  });
});

/**
 * POST /agent/wallet/:anonymousId/withdraw
 * Body: { recipient: string, asset?: 'usdc'|'sol'|'both', usdcAmount?: number, solAmount?: number }
 * — Solana address must match linked walletAddress. Amounts are optional caps in human units.
 */
router.post('/:anonymousId/withdraw', async (req, res) => {
  try {
    const anonymousId = decodeAnonymousId(req.params.anonymousId);
    const recipient =
      typeof req.body?.recipient === 'string' ? req.body.recipient.trim() : '';
    const assetRaw = req.body?.asset;
    const asset =
      assetRaw === 'usdc' || assetRaw === 'sol' || assetRaw === 'both' ? assetRaw : undefined;
    const usdcAmount =
      typeof req.body?.usdcAmount === 'number' && Number.isFinite(req.body.usdcAmount)
        ? req.body.usdcAmount
        : undefined;
    const solAmount =
      typeof req.body?.solAmount === 'number' && Number.isFinite(req.body.solAmount)
        ? req.body.solAmount
        : undefined;
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    if (!recipient) {
      return res.status(400).json({ success: false, error: 'recipient is required' });
    }
    const { signature } = await withdrawSolanaAgentToRecipient(anonymousId, recipient, {
      ...(asset && { asset }),
      ...(usdcAmount != null && { usdcAmount }),
      ...(solAmount != null && { solAmount }),
    });
    return res.json({ success: true, signature });
  } catch (error) {
    const message = error?.message || 'Withdraw failed';
    return res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /agent/wallet/:anonymousId
 * Get agent wallet address by anonymousId.
 */
router.get('/:anonymousId', async (req, res) => {
  try {
    const anonymousId = decodeAnonymousId(req.params.anonymousId);
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const doc = await AgentWallet.findOne({ anonymousId })
      .select('anonymousId walletAddress chain agentAddress avatarUrl createdAt updatedAt')
      .lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }
    const solanaAgentAddress = await getSolanaAgentAddress(anonymousId);
    return res.json({
      success: true,
      anonymousId: doc.anonymousId,
      walletAddress: doc.walletAddress || null,
      chain: doc.chain || 'solana',
      agentAddress: doc.agentAddress,
      avatarUrl: doc.avatarUrl || null,
      solanaAgentAddress: solanaAgentAddress || null,
      createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt ?? null,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt ?? null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/wallet/connect
 * Get or create agent wallet by connected wallet address and chain.
 * Body: { walletAddress: string, chain?: "solana" | "base" }
 * - chain "solana" (default): creates Solana agent keypair on first create.
 * - chain "base": creates EVM/Base agent wallet (new address on Base).
 * Returns: { anonymousId, agentAddress, avatarUrl?, isNewWallet? }
 */
router.post('/connect', async (req, res) => {
  try {
    const walletAddress = typeof req.body?.walletAddress === 'string'
      ? req.body.walletAddress.trim()
      : null;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress is required' });
    }
    const chain = req.body?.chain === 'base' ? 'base' : 'solana';

    const findQuery = chain === 'base'
      ? { walletAddress, chain: 'base' }
      : { walletAddress, $or: [{ chain: 'solana' }, { chain: { $exists: false } }] };
    let doc = await AgentWallet.findOne(findQuery).lean();
    if (doc) {
      return res.json({
        success: true,
        anonymousId: doc.anonymousId,
        agentAddress: doc.agentAddress,
        avatarUrl: doc.avatarUrl || null,
        isNewWallet: false,
        chain: doc.chain || 'solana',
      });
    }

    const avatarUrl = avatarGenerator.generateRandomAvatar(walletAddress);

    if (chain === 'base') {
      // Create EVM/Base agent wallet (new private key, derive address)
      const { generatePrivateKey, privateKeyToAccount } = await import('viem/accounts');
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      const agentAddress = account.address;
      const agentSecretKey = privateKey; // hex string
      const anonymousId = `wallet:${walletAddress}:base`;

      await AgentWallet.create({
        anonymousId,
        walletAddress,
        chain: 'base',
        agentAddress,
        agentSecretKey: encryptAgentSecretForStorage(agentSecretKey),
        avatarUrl,
      });

      return res.status(201).json({
        success: true,
        anonymousId,
        agentAddress,
        avatarUrl,
        isNewWallet: true,
        chain: 'base',
      });
    }

    // Solana: create keypair (user funds agent wallet themselves)
    const anonymousId = `wallet:${walletAddress}`;
    const keypair = Keypair.generate();
    const agentAddress = keypair.publicKey.toBase58();
    const agentSecretKey = bs58.encode(keypair.secretKey);

    await AgentWallet.create({
      anonymousId,
      walletAddress,
      chain: 'solana',
      agentAddress,
      agentSecretKey: encryptAgentSecretForStorage(agentSecretKey),
      avatarUrl,
    });

    return res.status(201).json({
      success: true,
      anonymousId,
      agentAddress,
      avatarUrl,
      isNewWallet: true,
      chain: 'solana',
    });
  } catch (error) {
    const walletAddress = req.body?.walletAddress?.trim();
    const chain = req.body?.chain === 'base' ? 'base' : 'solana';
    if (error.code === 11000) {
      const existing = await AgentWallet.findOne({ walletAddress, chain })
        .select('anonymousId agentAddress avatarUrl chain')
        .lean();
      if (existing) {
        return res.json({
          success: true,
          anonymousId: existing.anonymousId,
          agentAddress: existing.agentAddress,
          avatarUrl: existing.avatarUrl || null,
          isNewWallet: false,
          chain: existing.chain || 'solana',
        });
      }
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/wallet/pay-402
 * Build and sign x402 payment from 402 response using agent wallet; return payment header for client retry.
 * Body: { anonymousId: string, paymentRequired: object } (paymentRequired = 402 response body with accepts[])
 * Returns: { success: true, paymentHeader: string } or { success: false, error: string }
 */
router.post('/pay-402', async (req, res) => {
  const payStart = Date.now();
  try {
    const { anonymousId, paymentRequired } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    if (!paymentRequired || typeof paymentRequired !== 'object') {
      return res.status(400).json({ success: false, error: 'paymentRequired (402 response body) is required' });
    }
    const paymentHeader = await buildPaymentHeaderFrom402Body(anonymousId.trim(), paymentRequired);
    return res.json({
      success: true,
      paymentHeader: paymentHeader.paymentHeader,
      ...(paymentHeader.signature ? { signature: paymentHeader.signature } : {}),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Payment failed',
    });
  }
});

/**
 * POST /agent/wallet
 * Get or create agent wallet. No wallet connect required.
 * Body: { anonymousId?: string } (optional; if omitted, server generates one)
 * Returns: { anonymousId: string, agentAddress: string }
 */
router.post('/', async (req, res) => {
  try {
    const { anonymousId: bodyId } = req.body || {};
    const anonymousId = typeof bodyId === 'string' && bodyId.trim()
      ? bodyId.trim()
      : generateAnonymousId();

    let doc = await AgentWallet.findOne({ anonymousId }).lean();
    if (doc) {
      return res.json({ 
        success: true, 
        anonymousId, 
        agentAddress: doc.agentAddress,
        avatarUrl: doc.avatarUrl || null,
      });
    }

    const keypair = Keypair.generate();
    const agentAddress = keypair.publicKey.toBase58();
    const agentSecretKey = bs58.encode(keypair.secretKey);
    // Generate unique avatar based on anonymousId
    const avatarUrl = avatarGenerator.generateRandomAvatar(anonymousId);

    await AgentWallet.create({
      anonymousId,
      agentAddress,
      agentSecretKey: encryptAgentSecretForStorage(agentSecretKey),
      avatarUrl,
    });

    return res.status(201).json({
      success: true,
      anonymousId,
      agentAddress,
      avatarUrl,
      isNewWallet: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await AgentWallet.findOne({ anonymousId: (req.body || {}).anonymousId?.trim() })
        .select('agentAddress avatarUrl')
        .lean();
      if (existing) {
        return res.json({
          success: true,
          anonymousId: (req.body || {}).anonymousId?.trim(),
          agentAddress: existing.agentAddress,
          avatarUrl: existing.avatarUrl || null,
          isNewWallet: false,
        });
      }
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /agent/wallet/:anonymousId/avatar
 * Update user avatar with a base64 data URL.
 * Body: { avatarUrl: string }
 * Returns: { success: boolean, avatarUrl: string }
 */
router.put('/:anonymousId/avatar', async (req, res) => {
  try {
    const { anonymousId } = req.params;
    const { avatarUrl } = req.body || {};
    
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    
    if (typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
      return res.status(400).json({ success: false, error: 'avatarUrl is required' });
    }

    const doc = await AgentWallet.findOneAndUpdate(
      { anonymousId },
      { avatarUrl: avatarUrl.trim() },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }

    return res.json({
      success: true,
      avatarUrl: doc.avatarUrl || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/wallet/:anonymousId/avatar/generate
 * Generate a new random avatar for the user.
 * Returns: { success: boolean, avatarUrl: string }
 */
router.post('/:anonymousId/avatar/generate', async (req, res) => {
  try {
    const anonymousId = decodeAnonymousId(req.params.anonymousId);
    
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }

    const doc = await AgentWallet.findOne({ anonymousId }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }

    // Generate new random avatar (without seed to get a different avatar each time)
    // Pass undefined or random value to ensure a unique avatar each time
    const randomSeed = `${doc.walletAddress || anonymousId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newAvatarUrl = avatarGenerator.generateRandomAvatar(randomSeed);

    const updated = await AgentWallet.findOneAndUpdate(
      { anonymousId },
      { avatarUrl: newAvatarUrl },
      { new: true }
    ).lean();

    return res.json({
      success: true,
      avatarUrl: updated?.avatarUrl || newAvatarUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export async function createAgentWalletRouter() {
  return router;
}

export default router;
