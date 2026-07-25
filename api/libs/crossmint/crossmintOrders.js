/**
 * Crossmint headless onramp order client.
 * @see https://docs.crossmint.com/onramp/api-reference/create-order
 */
import {
  getCrossmintApiBaseUrl,
  getCrossmintServerApiKey,
  getUsdcTokenLocator,
} from './crossmintConfig.js';

/**
 * @param {{
 *   walletAddress: string,
 *   receiptEmail: string,
 *   amountUsd: string | number,
 *   chain?: 'solana' | 'base',
 * }} params
 */
export async function createCrossmintOnrampOrder(params) {
  const apiKey = getCrossmintServerApiKey();
  if (!apiKey) {
    const err = new Error('CROSSMINT_SERVER_API_KEY is not set');
    err.code = 'crossmint_not_configured';
    throw err;
  }

  const chain = params.chain === 'base' ? 'base' : 'solana';
  const amount = String(params.amountUsd).trim();
  const walletAddress = String(params.walletAddress || '').trim();
  const receiptEmail = String(params.receiptEmail || '').trim().toLowerCase();

  if (!walletAddress) {
    const err = new Error('walletAddress is required');
    err.code = 'invalid_wallet';
    throw err;
  }
  if (!receiptEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail)) {
    const err = new Error('Valid receiptEmail is required');
    err.code = 'invalid_email';
    throw err;
  }

  const response = await fetch(`${getCrossmintApiBaseUrl()}/2022-06-09/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      recipient: { walletAddress },
      payment: {
        method: 'card',
        receiptEmail,
      },
      lineItems: [
        {
          tokenLocator: getUsdcTokenLocator(chain),
          executionParameters: {
            mode: 'exact-in',
            amount,
          },
        },
      ],
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      body?.message || body?.error || `Crossmint order failed (${response.status})`,
    );
    err.code = body?.code || 'crossmint_order_failed';
    err.status = response.status;
    err.details = body;
    throw err;
  }

  return body;
}

/**
 * @param {string} orderId
 */
export async function getCrossmintOnrampOrder(orderId) {
  const apiKey = getCrossmintServerApiKey();
  if (!apiKey) {
    const err = new Error('CROSSMINT_SERVER_API_KEY is not set');
    err.code = 'crossmint_not_configured';
    throw err;
  }
  const id = String(orderId || '').trim();
  if (!id) {
    const err = new Error('orderId is required');
    err.code = 'invalid_order';
    throw err;
  }

  const response = await fetch(`${getCrossmintApiBaseUrl()}/2022-06-09/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'X-API-KEY': apiKey },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body?.message || `Crossmint get order failed (${response.status})`);
    err.code = body?.code || 'crossmint_get_failed';
    err.status = response.status;
    throw err;
  }
  return body;
}
