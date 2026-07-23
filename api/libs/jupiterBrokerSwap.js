/**
 * Generic Jupiter swap via walletBroker (any input/output mint).
 * Shared by Momentum Rotator, LST loop rebalances, and sniper exits.
 */
import axios from 'axios';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { executeIntent } from '../services/walletBroker.js';
import { resolveReferralFee } from './jupiterReferral.js';
import { getConnection, isSolMint } from './meteoraDlmmExecutor.js';

const JUPITER_API_BASE = 'https://api.jup.ag';
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

/** Common Solana mint constants for earn experiments. */
export const EARN_MINTS = Object.freeze({
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  CBBTC: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
  JLP: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
});

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function jupiterHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JUPITER_API_KEY) {
    headers['x-api-key'] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * Quote-only helper (no sign).
 */
export async function fetchJupiterQuoteRaw({
  inputMint,
  outputMint,
  amountRaw,
  slippageBps = 50,
}) {
  const headers = jupiterHeaders();
  const connection = getConnection();
  const { platformFeeBps } = await resolveReferralFee(connection, outputMint);
  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append('inputMint', inputMint);
  quoteUrl.searchParams.append('outputMint', outputMint);
  quoteUrl.searchParams.append('amount', String(amountRaw));
  quoteUrl.searchParams.append('slippageBps', String(slippageBps));
  if (platformFeeBps > 0) {
    quoteUrl.searchParams.append('platformFeeBps', String(platformFeeBps));
  }
  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  return quoteResponse.data;
}

/**
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {string} params.inputMint
 * @param {string} params.outputMint
 * @param {string|number|bigint} params.amountRaw
 * @param {number} params.estimatedUsd
 * @param {string} params.summary
 * @param {number} [params.slippageBps]
 * @param {number} [params.solPriceUsd]
 * @param {string} [params.toolId]
 */
export async function executeJupiterBrokerSwap({
  anonymousId,
  agentAddress,
  inputMint,
  outputMint,
  amountRaw,
  estimatedUsd,
  summary,
  slippageBps = 50,
  solPriceUsd = 150,
  toolId = 'jupiter-swap-order',
}) {
  const amountStr = String(amountRaw);
  if (!amountStr || amountStr === '0') {
    return { signature: null, skipped: true, outAmount: '0' };
  }

  const headers = jupiterHeaders();
  const connection = getConnection();
  const { platformFeeBps, feeAccount } = await resolveReferralFee(connection, outputMint);

  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append('inputMint', inputMint);
  quoteUrl.searchParams.append('outputMint', outputMint);
  quoteUrl.searchParams.append('amount', amountStr);
  quoteUrl.searchParams.append('slippageBps', String(slippageBps));
  if (platformFeeBps > 0) {
    quoteUrl.searchParams.append('platformFeeBps', String(platformFeeBps));
  }

  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  let policyUsd = toNum(estimatedUsd, 1);
  if (isSolMint(outputMint)) {
    const outLamports = toNum(quoteResponse.data?.outAmount, 0);
    policyUsd = Math.max(policyUsd, (outLamports / LAMPORTS_PER_SOL) * toNum(solPriceUsd, 150));
  }

  const swapBody = {
    quoteResponse: quoteResponse.data,
    userPublicKey: agentAddress,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
  };
  if (platformFeeBps > 0 && feeAccount) {
    swapBody.feeAccount = feeAccount;
  }

  const swapResponse = await axios.post(JUPITER_SWAP_API, swapBody, { headers });
  const swapTxBase64 = swapResponse.data?.swapTransaction;
  if (!swapTxBase64) {
    throw new Error('jupiter_broker_swap_no_transaction');
  }

  const brokerResult = await executeIntent(
    { anonymousId, guest: false },
    {
      type: 'tx_sign',
      chain: 'solana',
      toolId,
      serializedTxBase64: swapTxBase64,
      estimatedUsd: policyUsd,
      summary,
    },
  );

  if (brokerResult.status !== 'ok') {
    const reasons = brokerResult.reasons || [];
    throw new Error(`jupiter_broker_swap_failed:${reasons.join(';')}`);
  }

  return {
    signature: brokerResult.signature,
    skipped: false,
    outAmount: String(quoteResponse.data?.outAmount ?? '0'),
    inAmount: String(quoteResponse.data?.inAmount ?? amountStr),
  };
}
