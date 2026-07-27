/**
 * Robinhood Chain (Arbitrum Orbit L2) + Uniswap v3 deployment config.
 * Addresses confirmed from Uniswap official deployments + Robinhood token contracts docs.
 * All contract/token addresses are env-overridable; Uniswap addresses fail closed if blanked.
 */
import { defineChain } from "viem";

function envAddress(name, fallback) {
  const raw = typeof process.env[name] === "string" ? process.env[name].trim() : "";
  if (raw) return /** @type {`0x${string}`} */ (raw);
  return fallback ? /** @type {`0x${string}`} */ (fallback) : null;
}

function envUrl(name, fallback) {
  const raw = typeof process.env[name] === "string" ? process.env[name].trim() : "";
  return raw || fallback;
}

/** Official Uniswap v3 deployments on Robinhood Chain (chainId 4663). */
export const ROBINHOOD_UNISWAP_V3_DEFAULTS = Object.freeze({
  factory: "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  multicall: "0x282a3c4d320cc7f0d5eaf56b8029e4b88338f0a3",
  tickLens: "0x7dfd4f31be6814d2906bde155c3e1b146eac1468",
  quoterV2: "0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7",
  nonfungiblePositionManager: "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3",
  swapRouter02: "0xCaf681a66D020601342297493863E78C959E5cb2",
});

/** Canonical tokens from docs.robinhood.com/chain/contracts (USDC is not native; optional via env). */
export const ROBINHOOD_TOKEN_DEFAULTS = Object.freeze({
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  /** No native USDC on Robinhood mainnet; set ROBINHOOD_USDC if a bridged USDC is approved. */
  usdc: null,
});

export const ROBINHOOD_MAINNET_CHAIN_ID = 4663;
export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;
export const ROBINHOOD_CAIP2 = `eip155:${ROBINHOOD_MAINNET_CHAIN_ID}`;
export const ROBINHOOD_TESTNET_CAIP2 = `eip155:${ROBINHOOD_TESTNET_CHAIN_ID}`;

export const robinhoodMainnet = defineChain({
  id: ROBINHOOD_MAINNET_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [envUrl("ROBINHOOD_RPC_URL", "https://rpc.mainnet.chain.robinhood.com")],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: envUrl("ROBINHOOD_EXPLORER_URL", "https://robinhoodchain.blockscout.com"),
    },
  },
});

export const robinhoodTestnet = defineChain({
  id: ROBINHOOD_TESTNET_CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [envUrl("ROBINHOOD_TESTNET_RPC_URL", "https://rpc.testnet.chain.robinhood.com")],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout Testnet",
      url: envUrl(
        "ROBINHOOD_TESTNET_EXPLORER_URL",
        "https://explorer.testnet.chain.robinhood.com",
      ),
    },
  },
  testnet: true,
});

/**
 * @param {'mainnet'|'testnet'} [network]
 */
export function getRobinhoodChain(network = "mainnet") {
  return network === "testnet" ? robinhoodTestnet : robinhoodMainnet;
}

/**
 * @param {'mainnet'|'testnet'} [network]
 */
export function getRobinhoodRpcUrl(network = "mainnet") {
  const chain = getRobinhoodChain(network);
  return chain.rpcUrls.default.http[0];
}

/**
 * @param {'mainnet'|'testnet'} [network]
 */
export function getRobinhoodExplorerBaseUrl(network = "mainnet") {
  const chain = getRobinhoodChain(network);
  return chain.blockExplorers.default.url.replace(/\/$/, "");
}

/**
 * @param {string} txHash
 * @param {'mainnet'|'testnet'} [network]
 */
export function robinhoodTxUrl(txHash, network = "mainnet") {
  const hash = String(txHash || "").trim();
  if (!hash) return null;
  return `${getRobinhoodExplorerBaseUrl(network)}/tx/${hash}`;
}

/**
 * Resolved Uniswap v3 periphery/core addresses (env overrides applied).
 * Throws if any required address is missing (fail closed for live execution).
 */
export function getRobinhoodUniswapV3Addresses() {
  const factory = envAddress("ROBINHOOD_UNISWAP_FACTORY", ROBINHOOD_UNISWAP_V3_DEFAULTS.factory);
  const npm = envAddress(
    "ROBINHOOD_UNISWAP_NPM",
    ROBINHOOD_UNISWAP_V3_DEFAULTS.nonfungiblePositionManager,
  );
  const swapRouter02 = envAddress(
    "ROBINHOOD_UNISWAP_SWAP_ROUTER",
    ROBINHOOD_UNISWAP_V3_DEFAULTS.swapRouter02,
  );
  const quoterV2 = envAddress("ROBINHOOD_UNISWAP_QUOTER_V2", ROBINHOOD_UNISWAP_V3_DEFAULTS.quoterV2);
  const multicall = envAddress("ROBINHOOD_UNISWAP_MULTICALL", ROBINHOOD_UNISWAP_V3_DEFAULTS.multicall);
  const tickLens = envAddress("ROBINHOOD_UNISWAP_TICK_LENS", ROBINHOOD_UNISWAP_V3_DEFAULTS.tickLens);

  if (!factory || !npm || !swapRouter02 || !quoterV2) {
    throw new Error("robinhood_uniswap_v3_addresses_unset");
  }

  return Object.freeze({
    factory,
    nonfungiblePositionManager: npm,
    swapRouter02,
    quoterV2,
    multicall,
    tickLens,
  });
}

/**
 * Approved ERC-20 tokens for LP Autopilot (WETH + USDG required; USDC optional via env).
 */
export function getRobinhoodApprovedTokens() {
  const weth = envAddress("ROBINHOOD_WETH", ROBINHOOD_TOKEN_DEFAULTS.weth);
  const usdg = envAddress("ROBINHOOD_USDG", ROBINHOOD_TOKEN_DEFAULTS.usdg);
  const usdc = envAddress("ROBINHOOD_USDC", ROBINHOOD_TOKEN_DEFAULTS.usdc);
  if (!weth || !usdg) {
    throw new Error("robinhood_approved_tokens_unset");
  }
  /** @type {Record<string, `0x${string}`>} */
  const tokens = { WETH: weth, USDG: usdg };
  if (usdc) tokens.USDC = usdc;
  return Object.freeze(tokens);
}

/**
 * Lowercased set of approved token addresses.
 * @returns {Set<string>}
 */
export function getRobinhoodApprovedTokenAddressSet() {
  return new Set(Object.values(getRobinhoodApprovedTokens()).map((a) => a.toLowerCase()));
}

/**
 * Destination allowlist for live txs: NPM + SwapRouter02 + approved ERC-20s.
 * @returns {Set<string>}
 */
export function getRobinhoodLpDestinationAllowlist() {
  const uni = getRobinhoodUniswapV3Addresses();
  const tokens = getRobinhoodApprovedTokenAddressSet();
  return new Set([
    uni.nonfungiblePositionManager.toLowerCase(),
    uni.swapRouter02.toLowerCase(),
    ...tokens,
  ]);
}

/**
 * Map Uniswap fee decimal (e.g. 0.003) to fee tier uint24 (e.g. 3000).
 * @param {number} feeDecimal
 */
export function feeDecimalToTier(feeDecimal) {
  const d = Number(feeDecimal);
  if (!Number.isFinite(d) || d <= 0) return 3000;
  const bps = Math.round(d * 1_000_000);
  const known = [100, 500, 3000, 10000];
  let best = known[0];
  let bestDiff = Math.abs(bps - best);
  for (const k of known) {
    const diff = Math.abs(bps - k);
    if (diff < bestDiff) {
      best = k;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Tick spacing for a Uniswap v3 fee tier.
 * @param {number} feeTier
 */
export function tickSpacingForFeeTier(feeTier) {
  const fee = Number(feeTier);
  if (fee === 100) return 1;
  if (fee === 500) return 10;
  if (fee === 3000) return 60;
  if (fee === 10000) return 200;
  return 60;
}

/**
 * Align tick down/up to spacing.
 * @param {number} tick
 * @param {number} spacing
 * @param {'floor'|'ceil'} mode
 */
export function alignTick(tick, spacing, mode = "floor") {
  const s = Math.max(1, Math.floor(spacing));
  const t = Math.trunc(tick);
  if (mode === "ceil") {
    const rem = ((t % s) + s) % s;
    return rem === 0 ? t : t + (s - rem);
  }
  return Math.floor(t / s) * s;
}

/**
 * Map sim binsBelow/binsAbove to Uniswap v3 tickLower/tickUpper around current tick.
 * @param {{ currentTick: number; tickSpacing: number; binsBelow: number; binsAbove: number }} input
 */
export function binsToTickRange({ currentTick, tickSpacing, binsBelow, binsAbove }) {
  const spacing = Math.max(1, Math.floor(Number(tickSpacing) || 60));
  const below = Math.max(0, Math.floor(Number(binsBelow) || 0));
  const above = Math.max(0, Math.floor(Number(binsAbove) || 0));
  const center = alignTick(Number(currentTick) || 0, spacing, "floor");
  let tickLower = center - below * spacing;
  let tickUpper = center + Math.max(1, above) * spacing;
  if (below === 0 && above === 0) {
    tickLower = center - spacing;
    tickUpper = center + spacing;
  }
  if (tickLower >= tickUpper) {
    tickUpper = tickLower + spacing;
  }
  return { tickLower, tickUpper, tickSpacing: spacing, centerTick: center };
}
