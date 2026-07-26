/**
 * Settlement / payment-rail constants (public addresses + facilitator URLs).
 * Private keys and API keys remain in env via secrets.js.
 */

/** Solana USDC (mainnet). */
export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** Solana USDC (devnet). */
export const SOLANA_DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
/** Base mainnet USDC. */
export const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
/** Base Sepolia USDC. */
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
/** Polygon USDC. */
export const POLYGON_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
/** Polygon Amoy USDC. */
export const POLYGON_AMOY_USDC = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
/** Arbitrum USDC. */
export const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
/** Arbitrum Sepolia USDC. */
export const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
/** Celo USDC. */
export const CELO_USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

/** Primary Solana merchant payTo (PayAI / Corbits / Dexter / Goplausible). */
export const SOLANA_PAYTO = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
/** Base / EVM merchant payTo (PayAI multi-network). */
export const EVM_PAYTO = "0xB8B34bB10fABf2e4b2c2cD19fAe916da161C8445";
/** Base-specific payTo used by B402 / Base gateway surfaces. */
export const BASE_PAYTO = "0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734";
/** OKX x402 payTo. */
export const OKX_X402_PAYTO = "0x3b35c4bb0b5304f97644de429f68e3b5be2b400c";
/** Algorand merchant payTo. */
export const ALGORAND_PAYTO = "IQ5SGZDKKOXUKNNX4JH5MXZTVUWZM5SXGD5LIG7FXASOAVFZ2QBMJLSFII";
/** Celo merchant payTo. */
export const CELO_PAYTO = "0xD85Ec8eCD3C04c4843d4E354f4Dd95A081007DFA";
/** B402 (Binance) payTo. */
export const B402_PAY_TO = "0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734";

export const FACILITATOR_URL_PAYAI = "https://facilitator.payai.network";
export const CORBITS_FACILITATOR_URL = "https://facilitator.corbits.dev";
export const GOPLAUSIBLE_FACILITATOR_URL = "https://facilitator.goplausible.xyz";
export const B402_BASE_URL = "https://api.commonservice.io";
export const CELO_FACILITATOR_URL = "https://api.x402.celo.org";

export const NETWORK_PAYAI = "solana";
export const B402_TOKEN = "USD1";
export const X402_USE_PAYAI_FACILITATOR = true;
export const X402_B402_ENABLED = true;
export const OKX_X402_SYNC_SETTLE = true;

export const CELO_SETTLE_VIA_FACILITATOR = true;
export const CELO_ALLOW_SELF_SETTLE = false;
export const CELO_ATTRIBUTION_TAG = "celo_3ef93c3cb10b";

export const BASE_BUILDER_CODE = "bc_db1p1u9z";

/** Tempo agent payout (non-secret knobs; private key stays in env). */
export const TEMPO_AGENT_PAYOUT = Object.freeze({
  enabled: true,
  maxUsd: 50,
  chainId: 4217,
  payoutAddress: "0x0934290625c07F0C6e478A299A2EBF50F2673Ccb",
  payoutToken: "0x20c000000000000000000000b9537d11c60e8b50",
});

/** Crossmint onramp product flags (API keys stay in env). */
export const CROSSMINT_ONRAMP = Object.freeze({
  enabled: true,
  env: "staging",
  defaultAmountUsd: 10,
  minAmountUsd: 10,
  maxAmountUsd: 500,
});

/** LP real agent gate (match prior prod .env). */
export const LP_AGENT_REAL = Object.freeze({
  enabled: false,
  useRealSignals: false,
});

/**
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getPayToAddresses() {
  return {
    solanaPayTo: SOLANA_PAYTO,
    evmPayTo: EVM_PAYTO,
  };
}

/**
 * @returns {{
 *   payai: string,
 *   corbits: string,
 *   goplausible: string,
 *   b402: string,
 *   celo: string,
 * }}
 */
export function getFacilitatorUrls() {
  return {
    payai: FACILITATOR_URL_PAYAI,
    corbits: CORBITS_FACILITATOR_URL,
    goplausible: GOPLAUSIBLE_FACILITATOR_URL,
    b402: B402_BASE_URL,
    celo: CELO_FACILITATOR_URL,
  };
}
