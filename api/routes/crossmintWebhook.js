/**
 * Crossmint order webhooks (Svix).
 * POST /internal/crossmint/webhook[/:secret]
 *
 * Configure the endpoint in Crossmint console to point at:
 *   https://api.syraa.fun/internal/crossmint/webhook
 * and set CROSSMINT_WEBHOOK_SECRET to the signing secret.
 */
import express from 'express';
import CrossmintOnrampOrder from '../models/agent/CrossmintOnrampOrder.js';
import { getCrossmintWebhookSecret } from '../libs/crossmint/crossmintConfig.js';
import { verifyCrossmintWebhook } from '../libs/crossmint/verifyCrossmintWebhook.js';

function extractOrder(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload.data || payload;
  const order = data.order || data;
  const orderId = order.orderId || order.id || data.orderId;
  if (!orderId) return null;
  return { orderId: String(orderId), order, type: payload.type || data.type || null };
}

function deriveStatus(order) {
  const phase = order?.phase || null;
  const paymentStatus = order?.payment?.status || null;
  const deliveryStatus = order?.lineItems?.[0]?.delivery?.status || null;
  if (phase === 'completed' || deliveryStatus === 'completed' || paymentStatus === 'completed') {
    return { status: 'completed', phase, paymentStatus, deliveryStatus };
  }
  if (
    paymentStatus === 'failed-kyc' ||
    deliveryStatus === 'failed' ||
    String(paymentStatus || '').includes('failed')
  ) {
    return { status: 'failed', phase, paymentStatus, deliveryStatus };
  }
  return { status: 'pending', phase, paymentStatus, deliveryStatus };
}

function isWebhookAuthorizedByPath(req) {
  const secret = getCrossmintWebhookSecret();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const pathSecret = typeof req.params?.secret === 'string' ? req.params.secret.trim() : '';
  return pathSecret === secret;
}

export function createCrossmintWebhookRouter() {
  const router = express.Router();

  const handleWebhook = async (req, res) => {
    try {
      const raw =
        typeof req.rawBody === 'string'
          ? req.rawBody
          : Buffer.isBuffer(req.rawBody)
            ? req.rawBody.toString('utf8')
            : JSON.stringify(req.body || {});

      let payload;
      try {
        payload = verifyCrossmintWebhook(raw, req.headers);
      } catch (verifyErr) {
        // Allow path-secret fallback when Svix headers are absent (console test pings).
        if (!isWebhookAuthorizedByPath(req) && getCrossmintWebhookSecret()) {
          return res.status(401).json({
            ok: false,
            error: verifyErr?.code || 'unauthorized',
            message: verifyErr instanceof Error ? verifyErr.message : 'Unauthorized',
          });
        }
        payload = req.body && typeof req.body === 'object' ? req.body : {};
      }

      res.status(200).json({ ok: true });

      const extracted = extractOrder(payload);
      if (!extracted) return;

      const derived = deriveStatus(extracted.order);
      await CrossmintOnrampOrder.findOneAndUpdate(
        { orderId: extracted.orderId },
        {
          $set: {
            phase: derived.phase,
            paymentStatus: derived.paymentStatus,
            deliveryStatus: derived.deliveryStatus,
            status: derived.status,
            lastWebhookAt: new Date(),
            rawLastPayload: {
              type: extracted.type,
              phase: derived.phase,
              paymentStatus: derived.paymentStatus,
              deliveryStatus: derived.deliveryStatus,
            },
          },
        },
      ).catch((e) => {
        console.error('[crossmint-webhook]', e instanceof Error ? e.message : e);
      });
    } catch (e) {
      console.error('[crossmint-webhook]', e instanceof Error ? e.message : e);
      if (!res.headersSent) {
        return res.status(500).json({ ok: false, error: 'webhook_failed' });
      }
    }
  };

  router.post('/crossmint/webhook', handleWebhook);
  router.post('/crossmint/webhook/:secret', handleWebhook);

  return router;
}
