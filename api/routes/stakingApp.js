import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { requireMongooseConnection } from '../config/mongoose.js';
import { computeOperatorStats } from '../services/streamflowLockAggregates.js';
import { requireSession } from '../utils/requireSession.js';

const DEFAULT_ADMIN_WALLET = 'Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4';

function getAdminWallet() {
  return (process.env.ADMIN_DASHBOARD_WALLET || DEFAULT_ADMIN_WALLET).trim();
}

/**
 * Admin gate (SECURITY P0.8): the previous header-based check (`x-admin-wallet`) was trivially
 * spoofable — any HTTP client could set the header to the admin address and gain access.
 * New flow: caller must hold a Syra session JWT whose verified wallet equals ADMIN_DASHBOARD_WALLET.
 * Session JWTs are minted only after a fresh SIWS signature, so spoofing requires the admin's
 * actual private key.
 */
function requireStakingAdmin(req, res, next) {
  if (!req.user || req.user.guest || !req.user.walletAddress) {
    res.status(401).json({ success: false, error: 'auth_required' });
    return;
  }
  if (req.user.walletAddress !== getAdminWallet()) {
    res.status(403).json({ success: false, error: 'not_admin' });
    return;
  }
  next();
}

function getFaucetKeypair() {
  const secret = process.env.FAUCET_SECRET_KEY;
  if (secret) {
    try {
      const parsed = JSON.parse(secret);
      if (Array.isArray(parsed)) {
        return Keypair.fromSecretKey(Uint8Array.from(parsed));
      }
    } catch {
      return null;
    }
  }
  const keypairPath = process.env.FAUCET_KEYPAIR_PATH;
  if (keypairPath) {
    try {
      const resolved = path.isAbsolute(keypairPath)
        ? keypairPath
        : path.join(process.cwd(), keypairPath);
      const data = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
      return Keypair.fromSecretKey(Uint8Array.from(data));
    } catch {
      return null;
    }
  }
  return null;
}

export async function createStakingAppRouter() {
  const router = Router();
  router.use(requireMongooseConnection);

  /**
   * Internal staking dashboard — registry operator metrics.
   * Requires a Syra session whose verified wallet equals ADMIN_DASHBOARD_WALLET (P0.8).
   */
  router.get('/dashboard/operator-stats', requireSession({ allowGuest: false, requireOwnership: false }), requireStakingAdmin, async (req, res) => {
    try {
      const mint = String(req.query.mint || '').trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      if (!mint) {
        res.status(400).json({ success: false, error: 'mint is required' });
        return;
      }
      const data = await computeOperatorStats(mint, network);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Operator stats failed' });
    }
  });

  /** Devnet SPL faucet for staking mint (same behavior as former Next.js route). */
  router.post('/faucet', async (req, res) => {
    const isMainnet =
      process.env.STAKING_NETWORK === 'mainnet-beta' ||
      process.env.SOLANA_CLUSTER === 'mainnet-beta';
    if (isMainnet) {
      res.status(403).json({ error: 'Faucet is disabled on mainnet' });
      return;
    }

    const stakingMint = process.env.STAKING_MINT || process.env.STAKING_TOKEN_MINT;
    if (!stakingMint || stakingMint === '11111111111111111111111111111111') {
      res.status(500).json({
        error: 'Faucet not configured: set STAKING_MINT (or STAKING_TOKEN_MINT) on the API server',
      });
      return;
    }

    const faucetKeypair = getFaucetKeypair();
    if (!faucetKeypair) {
      res.status(500).json({
        error: 'Faucet not configured: set FAUCET_SECRET_KEY or FAUCET_KEYPAIR_PATH on the API server',
      });
      return;
    }

    const body = req.body || {};
    const walletStr = body.wallet;
    if (!walletStr || typeof walletStr !== 'string') {
      res.status(400).json({ error: 'Missing wallet address' });
      return;
    }

    let recipient;
    try {
      recipient = new PublicKey(walletStr);
    } catch {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const stakingDecimals = Number(process.env.STAKING_DECIMALS || '6');
    const faucetAmount = Number(process.env.FAUCET_AMOUNT || '1000');
    const amountRaw = BigInt(Math.floor(faucetAmount * 10 ** stakingDecimals));
    if (amountRaw <= 0n) {
      res.status(500).json({ error: 'Invalid FAUCET_AMOUNT' });
      return;
    }

    const rpcUrl =
      process.env.STAKING_RPC_URL ||
      process.env.SOLANA_RPC_URL ||
      'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const mint = new PublicKey(stakingMint);

    const sourceAta = await getAssociatedTokenAddress(
      mint,
      faucetKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const destAta = await getAssociatedTokenAddress(mint, recipient, false, TOKEN_PROGRAM_ID);

    try {
      const sourceInfo = await connection.getAccountInfo(sourceAta);
      if (!sourceInfo) {
        res.status(500).json({
          error:
            'Faucet wallet has no staking token account. Fund it with staking tokens first.',
        });
        return;
      }

      const instructions = [];
      const destInfo = await connection.getAccountInfo(destAta);
      if (!destInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            faucetKeypair.publicKey,
            destAta,
            recipient,
            mint
          )
        );
      }

      instructions.push(
        createTransferInstruction(
          sourceAta,
          destAta,
          faucetKeypair.publicKey,
          Number(amountRaw),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const tx = new Transaction().add(...instructions);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = faucetKeypair.publicKey;

      const sig = await connection.sendTransaction(tx, [faucetKeypair], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      res.json({ success: true, signature: sig, amount: faucetAmount });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
