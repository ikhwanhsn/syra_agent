/**
 * Verify Crossmint (Svix) webhook signatures without adding the svix package.
 * @see https://docs.crossmint.com/introduction/platform/webhooks/verify-webhooks
 */
import crypto from 'crypto';
import { getCrossmintWebhookSecret } from './crossmintConfig.js';

const DEFAULT_TOLERANCE_SEC = 300;

/**
 * @param {string | Buffer} rawBody
 * @param {Record<string, string | string[] | undefined>} headers
 * @param {{ secret?: string, toleranceSec?: number }} [opts]
 * @returns {object} parsed JSON payload
 */
export function verifyCrossmintWebhook(rawBody, headers, opts = {}) {
  const secret = (opts.secret ?? getCrossmintWebhookSecret()).trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('CROSSMINT_WEBHOOK_SECRET is not set');
      err.code = 'webhook_not_configured';
      throw err;
    }
    const text = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody || '').toString('utf8');
    return text ? JSON.parse(text) : {};
  }

  const getHeader = (name) => {
    const v = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(v)) return String(v[0] || '').trim();
    return String(v || '').trim();
  };

  const msgId = getHeader('svix-id');
  const timestamp = getHeader('svix-timestamp');
  const signatureHeader = getHeader('svix-signature');
  if (!msgId || !timestamp || !signatureHeader) {
    const err = new Error('Missing Svix webhook headers');
    err.code = 'invalid_webhook_headers';
    throw err;
  }

  const ts = Number(timestamp);
  const tolerance = opts.toleranceSec ?? DEFAULT_TOLERANCE_SEC;
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > tolerance) {
    const err = new Error('Webhook timestamp outside tolerance');
    err.code = 'webhook_timestamp';
    throw err;
  }

  const body =
    typeof rawBody === 'string'
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : String(rawBody || '');

  const signedContent = `${msgId}.${timestamp}.${body}`;
  const secretPart = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const secretBytes = Buffer.from(secretPart, 'base64');
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const candidates = signatureHeader
    .split(' ')
    .map((part) => {
      const comma = part.indexOf(',');
      return comma >= 0 ? part.slice(comma + 1).trim() : part.trim();
    })
    .filter(Boolean);

  const matched = candidates.some((sig) => {
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });

  if (!matched) {
    const err = new Error('Invalid webhook signature');
    err.code = 'invalid_webhook_signature';
    throw err;
  }

  return body ? JSON.parse(body) : {};
}
