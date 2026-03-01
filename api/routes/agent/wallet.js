import express from 'express';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';
import pkg from 'random-avatar-generator';
import AgentWallet from '../../models/agent/AgentWallet.js';
import { buildPaymentHeaderFrom402Body } from '../../libs/agentX402Client.js';
import { fundNewAgentWallet } from '../../libs/fundNewAgentWallet.js';

const { AvatarGenerator } = pkg;
const avatarGenerator = new AvatarGenerator();

const router = express.Router();

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

/** Custom fetch with longer timeout so slow/unreliable RPCs don't fail with Connect Timeout. */
function fetchWithTimeout(url, init = {}) {
  const timeout = RPC_TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, {
    ...init,
    signal: init.signal || controller.signal,
  }).finally(() => clearTimeout(id));
}

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
    console.error('[agent/wallet] balance lookup error:', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to lookup agent wallet' });
  }

  let agentPubkey;
  try {
    agentPubkey = new PublicKey(doc.agentAddress);
  } catch (err) {
    console.error('[agent/wallet] invalid agentAddress:', doc.agentAddress, err?.message);
    return res.status(500).json({ success: false, error: 'Invalid agent wallet address' });
  }

  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  let solLamports;
  let tokenAccounts;
  try {
    [solLamports, tokenAccounts] = await Promise.all([
      connection.getBalance(agentPubkey, 'confirmed'),
      connection.getParsedTokenAccountsByOwner(agentPubkey, { mint: USDC_MAINNET }),
    ]);
  } catch (err) {
    const isRpcUnavailable =
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ETIMEDOUT' ||
      /fetch failed|ConnectTimeoutError|ECONNREFUSED|ETIMEDOUT|timeout|network/i.test(String(err?.message || ''));
    console.error('[agent/wallet] Solana RPC error:', err?.message || err);
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
    console.error('[agent/wallet] USDC parse error:', err?.message || err);
  }

  return res.json({
    success: true,
    agentAddress: doc.agentAddress,
    solBalance,
    usdcBalance,
  });
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
    const doc = await AgentWallet.findOne({ anonymousId }).select('agentAddress avatarUrl').lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }
    return res.json({ 
      success: true, 
      agentAddress: doc.agentAddress,
      avatarUrl: doc.avatarUrl || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/wallet/connect
 * Get or create agent wallet by connected wallet address and chain.
 * Body: { walletAddress: string, chain?: "solana" | "base" }
 * - chain "solana" (default): creates Solana agent keypair, funds with $1 on first create.
 * - chain "base": creates EVM/Base agent wallet (new address on Base). No auto-fund.
 * Returns: { anonymousId, agentAddress, avatarUrl?, isNewWallet?, fundingPending? (Solana only) }
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
        agentSecretKey,
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

    // Solana: create keypair and optionally fund
    const anonymousId = `wallet:${walletAddress}`;
    const keypair = Keypair.generate();
    const agentAddress = keypair.publicKey.toBase58();
    const agentSecretKey = bs58.encode(keypair.secretKey);

    await AgentWallet.create({
      anonymousId,
      walletAddress,
      chain: 'solana',
      agentAddress,
      agentSecretKey,
      avatarUrl,
    });

    res.status(201).json({
      success: true,
      anonymousId,
      agentAddress,
      avatarUrl,
      isNewWallet: true,
      fundingPending: true,
    });

    fundNewAgentWallet(agentAddress).catch(() => {});
    return;
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
      agentSecretKey,
      avatarUrl,
    });

    // Return immediately for better UX; fund in background (~20–60s on-chain)
    res.status(201).json({
      success: true,
      anonymousId,
      agentAddress,
      avatarUrl,
      isNewWallet: true,
      fundingPending: true,
    });

    fundNewAgentWallet(agentAddress).catch(() => {});
    return;
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
