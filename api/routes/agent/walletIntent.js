/**
 * Per-intent user-signed confirmation route.
 *
 * P1.4 — when the broker stages a WalletIntent (require_confirm), the frontend renders an
 * approval card. The user signs a SIWS/SIWE message containing the intentId + payload hash with
 * their connected wallet. POSTing that signature here authorizes the broker to proceed.
 *
 *   POST /agent/wallet/intent/:intentId/nonce
 *     -> { nonce, message }   (message to be signed by the user wallet)
 *
 *   POST /agent/wallet/intent/:intentId/confirm
 *     body: { chain, address, message, signature }
 *     -> { status: 'confirmed', intent } | { status: 'denied', reasons }
 *
 *   POST /agent/wallet/intent/:intentId/reject
 *     -> { status: 'rejected' }
 *
 * The route does NOT execute the action — it only verifies the signature and transitions the
 * intent to `confirmed`. The original caller (chat router, tools route) polls or receives the
 * confirmation signal and re-invokes the action with the now-allowed intent.
 *
 * For chat-initiated intents, the frontend should re-send the original chat message so the
 * broker can re-evaluate and execute (intent confirmation skips the require_confirm gate).
 */
import express from 'express';
import { requireSession } from '../../utils/requireSession.js';
import WalletIntent from '../../models/agent/WalletIntent.js';
import {
  buildSignInMessage,
  issueNonce,
  verifySignInMessage,
} from '../../utils/walletSignIn.js';
import { confirmIntent } from '../../services/walletBroker.js';
import { writeSignAudit } from '../../libs/signAudit.js';

const router = express.Router();

function getDomain(req) {
  return process.env.SYRA_AUTH_DOMAIN || req.get('host') || 'api.syraa.fun';
}

router.post('/:intentId/nonce', requireSession({ allowGuest: false }), async (req, res) => {
  const { intentId } = req.params;
  const intent = await WalletIntent.findOne({ intentId }).lean();
  if (!intent) return res.status(404).json({ success: false, error: 'intent_not_found' });
  if (intent.anonymousId !== req.user.anonymousId) {
    return res.status(403).json({ success: false, error: 'intent_owner_mismatch' });
  }
  if (intent.status !== 'pending') {
    return res.status(409).json({ success: false, error: `intent_status_${intent.status}` });
  }
  const nonce = issueNonce();
  const message = buildSignInMessage({
    domain: getDomain(req),
    address: req.user.walletAddress,
    nonce,
    purpose: `confirm-intent:${intentId}`,
    statement: `I authorize Syra intent ${intentId}: ${intent.payload?.summary || intent.action}`,
  });
  return res.json({ success: true, nonce, message });
});

router.post('/:intentId/confirm', requireSession({ allowGuest: false }), async (req, res) => {
  try {
    const { intentId } = req.params;
    const chain = req.body?.chain === 'base' ? 'base' : 'solana';
    const address = String(req.body?.address || '').trim();
    const message = String(req.body?.message || '');
    const signature = String(req.body?.signature || '');
    if (!address || !message || !signature) {
      return res.status(400).json({ success: false, error: 'address, message, signature required' });
    }
    if (address !== req.user.walletAddress) {
      return res.status(403).json({ success: false, error: 'session_address_mismatch' });
    }
    const verified = await verifySignInMessage({
      message,
      signature,
      chain,
      expectedDomain: getDomain(req),
      expectedPurpose: `confirm-intent:${intentId}`,
    });
    if (!verified.ok || verified.address !== address) {
      return res.status(401).json({ success: false, error: 'signature_invalid', detail: verified.reason });
    }

    const result = await confirmIntent(
      {
        anonymousId: req.user.anonymousId,
        userVerifiedAddress: address,
        sessionId: req.user.sessionId,
        ip: req.ip,
        userAgent: req.get('user-agent') || undefined,
      },
      intentId,
      { signature, signedMessage: message }
    );
    return res.json({ success: result.status === 'confirmed', ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'confirm_failed' });
  }
});

router.post('/:intentId/reject', requireSession({ allowGuest: false }), async (req, res) => {
  const { intentId } = req.params;
  const intent = await WalletIntent.findOne({ intentId }).lean();
  if (!intent) return res.status(404).json({ success: false, error: 'intent_not_found' });
  if (intent.anonymousId !== req.user.anonymousId) {
    return res.status(403).json({ success: false, error: 'intent_owner_mismatch' });
  }
  if (intent.status !== 'pending') {
    return res.status(409).json({ success: false, error: `intent_status_${intent.status}` });
  }
  await WalletIntent.updateOne({ intentId }, { $set: { status: 'rejected' } });
  await writeSignAudit({
    anonymousId: req.user.anonymousId,
    walletAddress: req.user.walletAddress,
    chain: intent.chain,
    action: 'intent_reject',
    toolId: intent.toolId,
    intentId,
    policyDecision: 'deny',
    policyReasons: ['user_rejected'],
    status: 'rejected',
    sessionId: req.user.sessionId,
    ip: req.ip,
    userAgent: req.get('user-agent') || undefined,
  });
  return res.json({ success: true, status: 'rejected' });
});

router.get('/:intentId', requireSession({ allowGuest: false }), async (req, res) => {
  const { intentId } = req.params;
  const intent = await WalletIntent.findOne({ intentId }).lean();
  if (!intent) return res.status(404).json({ success: false, error: 'intent_not_found' });
  if (intent.anonymousId !== req.user.anonymousId) {
    return res.status(403).json({ success: false, error: 'intent_owner_mismatch' });
  }
  return res.json({
    success: true,
    intent: {
      intentId: intent.intentId,
      status: intent.status,
      action: intent.action,
      toolId: intent.toolId,
      payload: intent.payload,
      chain: intent.chain,
      expiresAt: intent.expiresAt,
      riskScore: intent.riskScore,
      policyReasons: intent.policyReasons,
    },
  });
});

export async function createAgentWalletIntentRouter() {
  return router;
}

export default router;
