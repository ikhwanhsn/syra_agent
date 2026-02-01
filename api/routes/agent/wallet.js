import express from 'express';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';
import AgentWallet from '../../models/agent/AgentWallet.js';
import { buildPaymentHeaderFrom402Body } from '../../libs/agentX402Client.js';

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

/**
 * GET /agent/wallet/:anonymousId/balance
 * Returns SOL and USDC balance for the agent wallet.
 */
router.get('/:anonymousId/balance', async (req, res) => {
  try {
    const { anonymousId } = req.params;
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const doc = await AgentWallet.findOne({ anonymousId }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }
    const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
    const agentPubkey = new PublicKey(doc.agentAddress);
    const [solLamports, tokenAccounts] = await Promise.all([
      connection.getBalance(agentPubkey, 'confirmed'),
      connection.getParsedTokenAccountsByOwner(agentPubkey, { mint: USDC_MAINNET }),
    ]);
    const solBalance = solLamports / LAMPORTS_PER_SOL;
    const usdcBalance = tokenAccounts.value.reduce((sum, acc) => {
      const amt = acc.account.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
    return res.json({
      success: true,
      agentAddress: doc.agentAddress,
      solBalance,
      usdcBalance,
    });
  } catch (error) {
    const isRpcUnavailable =
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      /fetch failed|ConnectTimeoutError|ECONNREFUSED|ETIMEDOUT/i.test(error?.message || '');
    const message = isRpcUnavailable
      ? 'Solana RPC unavailable. Check SOLANA_RPC_URL in api/.env and network connectivity.'
      : error?.message || 'Failed to fetch balance';
    return res.status(isRpcUnavailable ? 503 : 500).json({ success: false, error: message });
  }
});

/**
 * GET /agent/wallet/:anonymousId
 * Get agent wallet address by anonymousId.
 */
router.get('/:anonymousId', async (req, res) => {
  try {
    const { anonymousId } = req.params;
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const doc = await AgentWallet.findOne({ anonymousId }).select('agentAddress').lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Agent wallet not found' });
    }
    return res.json({ success: true, agentAddress: doc.agentAddress });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/wallet/connect
 * Get or create agent wallet by connected wallet address (check database first).
 * Body: { walletAddress: string }
 * Returns: { anonymousId: string, agentAddress: string }
 */
router.post('/connect', async (req, res) => {
  try {
    const walletAddress = typeof req.body?.walletAddress === 'string'
      ? req.body.walletAddress.trim()
      : null;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress is required' });
    }

    let doc = await AgentWallet.findOne({ walletAddress }).lean();
    if (doc) {
      return res.json({
        success: true,
        anonymousId: doc.anonymousId,
        agentAddress: doc.agentAddress,
      });
    }

    const anonymousId = `wallet:${walletAddress}`;
    const keypair = Keypair.generate();
    const agentAddress = keypair.publicKey.toBase58();
    const agentSecretKey = bs58.encode(keypair.secretKey);

    await AgentWallet.create({
      anonymousId,
      walletAddress,
      agentAddress,
      agentSecretKey,
    });

    return res.status(201).json({
      success: true,
      anonymousId,
      agentAddress,
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await AgentWallet.findOne({ walletAddress: req.body?.walletAddress?.trim() })
        .select('anonymousId agentAddress')
        .lean();
      if (existing) {
        return res.json({
          success: true,
          anonymousId: existing.anonymousId,
          agentAddress: existing.agentAddress,
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
      return res.json({ success: true, anonymousId, agentAddress: doc.agentAddress });
    }

    const keypair = Keypair.generate();
    const agentAddress = keypair.publicKey.toBase58();
    const agentSecretKey = bs58.encode(keypair.secretKey);

    await AgentWallet.create({
      anonymousId,
      agentAddress,
      agentSecretKey,
    });

    return res.status(201).json({ success: true, anonymousId, agentAddress });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await AgentWallet.findOne({ anonymousId: (req.body || {}).anonymousId?.trim() })
        .select('agentAddress')
        .lean();
      if (existing) {
        return res.json({
          success: true,
          anonymousId: (req.body || {}).anonymousId?.trim(),
          agentAddress: existing.agentAddress,
        });
      }
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

export async function createAgentWalletRouter() {
  return router;
}

export default router;
