import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import {
  getCrossmintEnv,
  getUsdcTokenLocator,
  getOnrampAmountLimits,
  isCrossmintOnrampEnabled,
  getCrossmintPublicStatus,
} from './crossmintConfig.js';
import { verifyCrossmintWebhook } from './verifyCrossmintWebhook.js';
import crypto from 'crypto';

describe('crossmintConfig', () => {
  const prev = { ...process.env };

  after(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in prev)) delete process.env[k];
    }
    Object.assign(process.env, prev);
  });

  it('defaults to staging and solana staging USDC locator', () => {
    delete process.env.CROSSMINT_ENV;
    assert.equal(getCrossmintEnv(), 'staging');
    assert.match(getUsdcTokenLocator('solana'), /^solana:/);
  });

  it('uses production Solana USDC mint locator', () => {
    process.env.CROSSMINT_ENV = 'production';
    assert.equal(
      getUsdcTokenLocator('solana'),
      'solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    );
  });

  it('requires enabled flag and both API keys', () => {
    process.env.CROSSMINT_ONRAMP_ENABLED = 'true';
    process.env.CROSSMINT_SERVER_API_KEY = 'sk_test';
    process.env.CROSSMINT_CLIENT_API_KEY = 'ck_test';
    assert.equal(isCrossmintOnrampEnabled(), true);
    delete process.env.CROSSMINT_CLIENT_API_KEY;
    assert.equal(isCrossmintOnrampEnabled(), false);
  });

  it('exposes public status without secrets', () => {
    process.env.CROSSMINT_ONRAMP_ENABLED = 'false';
    const status = getCrossmintPublicStatus();
    assert.equal(status.enabled, false);
    assert.equal(status.fundingSource, 'crossmint_onramp');
    assert.ok(status.minAmountUsd >= 1);
    const limits = getOnrampAmountLimits();
    assert.ok(limits.defaultUsd >= limits.minUsd);
  });
});

describe('verifyCrossmintWebhook', () => {
  it('verifies a valid HMAC signature', () => {
    const secretPart = Buffer.from('test-secret-bytes-here!!').toString('base64');
    const secret = `whsec_${secretPart}`;
    const body = JSON.stringify({ type: 'orders.updated', data: { order: { orderId: 'o1', phase: 'completed' } } });
    const msgId = 'msg_test';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signedContent = `${msgId}.${timestamp}.${body}`;
    const expected = crypto
      .createHmac('sha256', Buffer.from(secretPart, 'base64'))
      .update(signedContent)
      .digest('base64');

    const payload = verifyCrossmintWebhook(body, {
      'svix-id': msgId,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${expected}`,
    }, { secret });

    assert.equal(payload.data.order.orderId, 'o1');
  });

  it('rejects bad signatures', () => {
    const secretPart = Buffer.from('test-secret-bytes-here!!').toString('base64');
    const secret = `whsec_${secretPart}`;
    assert.throws(
      () =>
        verifyCrossmintWebhook('{}', {
          'svix-id': 'msg_x',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'v1,deadbeef',
        }, { secret }),
      /Invalid webhook signature/,
    );
  });
});
