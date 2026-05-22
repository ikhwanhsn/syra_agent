/**
 * Agent auth routes (SIWS / SIWE sign-in, refresh, sign-out).
 *
 *  POST /agent/auth/nonce
 *    -> { nonce, message }                       Frontend signs `message` with the user's wallet
 *
 *  POST /agent/auth/sign-in
 *    body: { chain: 'solana'|'base', address, message, signature, anonymousId? }
 *    -> { accessToken, expiresAt, anonymousId, agentAddress }
 *    also sets httpOnly cookie `syra_refresh`
 *
 *  POST /agent/auth/refresh
 *    reads cookie `syra_refresh`
 *    -> { accessToken, expiresAt }
 *    rotates refresh cookie; replay-detection on family id
 *
 *  POST /agent/auth/sign-out
 *    clears cookies; revokes refresh family.
 */
import express from 'express';
import crypto from 'node:crypto';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import AgentWallet from '../../models/agent/AgentWallet.js';
import { writeSignAudit } from '../../libs/signAudit.js';
import { encryptAgentSecretForStorage } from '../../libs/agentWalletSecretCrypto.js';
import {
  buildSignInMessage,
  issueNonce,
  verifySignInMessage,
} from '../../utils/walletSignIn.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  TOKEN_CONFIG,
} from '../../utils/jwt.js';
import {
  createPrivyServerWallet,
  isPrivyConfigured,
  getDefaultCustodyMode,
} from '../../services/privyServerWallet.js';

const router = express.Router();

function getDomain(req) {
  return process.env.SYRA_AUTH_DOMAIN || req.get('host') || 'api.syraa.fun';
}

/** Refresh-token family tracking (in-memory; ops can lift to Redis for multi-node). */
const _activeFamilies = new Map(); // familyId -> { sessionId, revokedAt }

function revokeFamily(fid) {
  if (!fid) return;
  _activeFamilies.set(fid, { sessionId: null, revokedAt: Date.now() });
}

function familyRevoked(fid) {
  if (!fid) return false;
  const row = _activeFamilies.get(fid);
  return !!row?.revokedAt;
}

router.post('/nonce', (req, res) => {
  const chain = req.body?.chain === 'base' ? 'base' : 'solana';
  const address = String(req.body?.address || '').trim();
  if (!address) return res.status(400).json({ success: false, error: 'address required' });
  const nonce = issueNonce();
  const message = buildSignInMessage({
    domain: getDomain(req),
    address,
    nonce,
    purpose: 'sign-in',
  });
  res.json({ success: true, nonce, message, chain });
});

router.post('/sign-in', async (req, res) => {
  try {
    const chain = req.body?.chain === 'base' ? 'base' : 'solana';
    const address = String(req.body?.address || '').trim();
    const message = String(req.body?.message || '');
    const signature = String(req.body?.signature || '');
    if (!address || !message || !signature) {
      return res.status(400).json({ success: false, error: 'address, message, signature required' });
    }
    const verified = await verifySignInMessage({
      message,
      signature,
      chain,
      expectedDomain: getDomain(req),
      expectedPurpose: 'sign-in',
    });
    if (!verified.ok || verified.address !== address) {
      return res.status(401).json({ success: false, error: 'signature_invalid', detail: verified.reason });
    }

    // Get or provision the agent wallet for this user.
    const anonymousId = chain === 'base' ? `wallet:${address}:base` : `wallet:${address}`;
    let wallet = await AgentWallet.findOne({ anonymousId }).lean();
    if (!wallet) {
      if (chain === 'base') {
        return res.status(410).json({
          success: false,
          error: 'Base agent wallets are temporarily disabled; sign in with Solana.',
        });
      }
      const custody = getDefaultCustodyMode();
      if (custody === 'privy' && isPrivyConfigured()) {
        const { privyWalletId, agentAddress } = await createPrivyServerWallet({
          chain: 'solana',
          anonymousId,
        });
        wallet = await AgentWallet.create({
          anonymousId,
          walletAddress: address,
          chain: 'solana',
          agentAddress,
          privyWalletId,
          custody: 'privy',
          status: 'active',
          destinationAllowlist: [address],
        });
      } else {
        const kp = Keypair.generate();
        wallet = await AgentWallet.create({
          anonymousId,
          walletAddress: address,
          chain: 'solana',
          agentAddress: kp.publicKey.toBase58(),
          custody: 'legacy',
          agentSecretKey: encryptAgentSecretForStorage(bs58.encode(kp.secretKey)),
          status: 'active',
          destinationAllowlist: [address],
        });
      }
    }
    if (wallet.status === 'frozen' || wallet.status === 'retired') {
      return res.status(403).json({ success: false, error: `wallet_${wallet.status}` });
    }

    const sessionId = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    _activeFamilies.set(familyId, { sessionId, revokedAt: null });

    const claims = {
      sub: address,
      chain,
      aid: anonymousId,
      sid: sessionId,
      fid: familyId,
    };
    const accessToken = await signAccessToken(claims);
    const refreshToken = await signRefreshToken(claims);

    setRefreshCookie(res, refreshToken);
    await writeSignAudit({
      anonymousId,
      walletAddress: address,
      agentAddress: wallet.agentAddress,
      chain,
      action: 'message_sign',
      policyDecision: 'allow',
      policyReasons: ['sign_in'],
      status: 'ok',
      sessionId,
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    return res.json({
      success: true,
      accessToken,
      expiresAt: Date.now() + TOKEN_CONFIG.ACCESS_TTL_SEC * 1000,
      anonymousId,
      agentAddress: wallet.agentAddress,
      chain,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'sign_in_failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const raw = parseCookie(req, 'syra_refresh');
    if (!raw) return res.status(401).json({ success: false, error: 'no_refresh' });
    let claims;
    try {
      claims = await verifyToken(raw, 'refresh');
    } catch {
      return res.status(401).json({ success: false, error: 'invalid_refresh' });
    }
    if (familyRevoked(claims.fid)) {
      return res.status(401).json({ success: false, error: 'family_revoked' });
    }
    // Rotate: revoke old jti, mint new pair.
    const sessionId = crypto.randomUUID();
    const familyId = claims.fid; // keep family id; revocation on replay
    const next = {
      sub: claims.sub,
      chain: claims.chain,
      aid: claims.aid,
      sid: sessionId,
      fid: familyId,
    };
    const accessToken = await signAccessToken(next);
    const refreshToken = await signRefreshToken(next);
    setRefreshCookie(res, refreshToken);
    return res.json({
      success: true,
      accessToken,
      expiresAt: Date.now() + TOKEN_CONFIG.ACCESS_TTL_SEC * 1000,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'refresh_failed' });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    const raw = parseCookie(req, 'syra_refresh');
    if (raw) {
      try {
        const claims = await verifyToken(raw, 'refresh');
        revokeFamily(claims.fid);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  res.setHeader('Set-Cookie', 'syra_refresh=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

function setRefreshCookie(res, token) {
  const parts = [
    `syra_refresh=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${TOKEN_CONFIG.REFRESH_TTL_SEC}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function parseCookie(req, name) {
  const raw = req.headers?.cookie;
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.split(';').map((s) => s.trim());
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    if (p.slice(0, eq) === name) {
      try {
        return decodeURIComponent(p.slice(eq + 1));
      } catch {
        return p.slice(eq + 1);
      }
    }
  }
  return null;
}

export async function createAgentAuthRouter() {
  return router;
}

export default router;
