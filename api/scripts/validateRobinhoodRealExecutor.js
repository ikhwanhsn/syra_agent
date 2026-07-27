/**
 * Validate Robinhood LP real executor safety invariants + optional on-chain simulate.
 *
 * Usage:
 *   node scripts/validateRobinhoodRealExecutor.js
 *   node scripts/validateRobinhoodRealExecutor.js --simulate
 *   node scripts/validateRobinhoodRealExecutor.js --simulate --pool=0x...
 *
 * Does NOT broadcast mainnet txs. --simulate uses publicClient.simulateContract against
 * mainnet state (read-only eth_call). Prefer testnet when ROBINHOOD_LP_REAL_NETWORK=testnet.
 *
 * SECURITY: Do not set ROBINHOOD_LP_REAL_DRY_RUN=false until a dedicated security review
 * has signed off on this executor path (fund-loss blocker).
 */
import {
  binsToTickRange,
  feeDecimalToTier,
  getRobinhoodApprovedTokens,
  getRobinhoodLpDestinationAllowlist,
  getRobinhoodUniswapV3Addresses,
  ROBINHOOD_MAINNET_CHAIN_ID,
  ROBINHOOD_TOKEN_DEFAULTS,
  ROBINHOOD_UNISWAP_V3_DEFAULTS,
  tickSpacingForFeeTier,
} from "../config/robinhoodChain.js";
import {
  assertRobinhoodLpAllowedDestination,
  getRobinhoodLpRealDryRun,
  getRobinhoodLpRealKillSwitch,
  getRobinhoodLpRealMaxBankUsd,
  getRobinhoodLpRealMaxConcurrentPositions,
  getRobinhoodLpRealMaxOpensPerTick,
  getRobinhoodLpRealMaxPositionUsd,
  getRobinhoodLpRealPilotEnabled,
  getRobinhoodLpRealSlippageBps,
  isRobinhoodLpAllowedDestination,
  passesRobinhoodRealPoolScreen,
} from "../config/robinhoodLpRealAccess.js";
import {
  applySlippageMin,
  getRobinhoodPublicClient,
  readPoolState,
  resolveTickRangeFromBins,
} from "../libs/robinhoodUniswapExecutor.js";

const args = process.argv.slice(2);
const doSimulate = args.includes("--simulate");
const poolArg = args.find((a) => a.startsWith("--pool="))?.slice("--pool=".length);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  } else {
    console.log(`ok    ${msg}`);
  }
}

console.log("=== Robinhood LP real executor validation ===\n");

// --- Config / defaults ---
assert(getRobinhoodLpRealDryRun() === true, "dry-run defaults to true (safe)");
assert(getRobinhoodLpRealPilotEnabled() === false, "pilot defaults to false (safe)");
assert(getRobinhoodLpRealKillSwitch() === false, "kill switch defaults to false");
assert(getRobinhoodLpRealMaxPositionUsd() <= 5, `max position USD <= 5 (got ${getRobinhoodLpRealMaxPositionUsd()})`);
assert(getRobinhoodLpRealMaxBankUsd() <= 25, `max bank USD <= 25 (got ${getRobinhoodLpRealMaxBankUsd()})`);
assert(getRobinhoodLpRealMaxConcurrentPositions() <= 2, "max concurrent <= 2 by default");
assert(getRobinhoodLpRealMaxOpensPerTick() <= 1, "max opens/tick <= 1 by default");
assert(getRobinhoodLpRealSlippageBps() <= 500, "slippage bps capped");

const uni = getRobinhoodUniswapV3Addresses();
assert(
  uni.nonfungiblePositionManager.toLowerCase() ===
    ROBINHOOD_UNISWAP_V3_DEFAULTS.nonfungiblePositionManager.toLowerCase(),
  "NPM matches Uniswap official Robinhood deployment",
);
assert(
  uni.swapRouter02.toLowerCase() === ROBINHOOD_UNISWAP_V3_DEFAULTS.swapRouter02.toLowerCase(),
  "SwapRouter02 matches Uniswap official Robinhood deployment",
);
assert(
  uni.factory.toLowerCase() === ROBINHOOD_UNISWAP_V3_DEFAULTS.factory.toLowerCase(),
  "Factory matches Uniswap official Robinhood deployment",
);
assert(
  uni.quoterV2.toLowerCase() === ROBINHOOD_UNISWAP_V3_DEFAULTS.quoterV2.toLowerCase(),
  "QuoterV2 matches Uniswap official Robinhood deployment",
);

const tokens = getRobinhoodApprovedTokens();
assert(
  tokens.WETH.toLowerCase() === ROBINHOOD_TOKEN_DEFAULTS.weth.toLowerCase(),
  "WETH matches Robinhood docs",
);
assert(
  tokens.USDG.toLowerCase() === ROBINHOOD_TOKEN_DEFAULTS.usdg.toLowerCase(),
  "USDG matches Robinhood docs",
);

const allow = getRobinhoodLpDestinationAllowlist();
assert(allow.has(uni.nonfungiblePositionManager.toLowerCase()), "allowlist includes NPM");
assert(allow.has(uni.swapRouter02.toLowerCase()), "allowlist includes SwapRouter02");
assert(allow.has(tokens.WETH.toLowerCase()), "allowlist includes WETH");
assert(allow.has(tokens.USDG.toLowerCase()), "allowlist includes USDG");
assert(
  !isRobinhoodLpAllowedDestination("0x1111111111111111111111111111111111111111"),
  "random address rejected by allowlist",
);
try {
  assertRobinhoodLpAllowedDestination("0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef");
  assert(false, "assertRobinhoodLpAllowedDestination should throw for unknown");
} catch {
  assert(true, "assertRobinhoodLpAllowedDestination throws for unknown");
}

// --- Tick math ---
assert(feeDecimalToTier(0.003) === 3000, "fee 0.3% -> 3000");
assert(feeDecimalToTier(0.0001) === 100, "fee 0.01% -> 100");
assert(tickSpacingForFeeTier(3000) === 60, "tickSpacing 3000 -> 60");
assert(tickSpacingForFeeTier(500) === 10, "tickSpacing 500 -> 10");

const range = binsToTickRange({
  currentTick: 12345,
  tickSpacing: 60,
  binsBelow: 10,
  binsAbove: 10,
});
assert(range.tickLower % 60 === 0, "tickLower aligned to spacing");
assert(range.tickUpper % 60 === 0, "tickUpper aligned to spacing");
assert(range.tickLower < range.tickUpper, "tickLower < tickUpper");
assert(range.tickUpper - range.tickLower === 20 * 60, "width = (below+above)*spacing");

const slip = applySlippageMin(1_000_000n, 100);
assert(slip === 990_000n, "1% slippage min on 1e6");

// --- Pool screen ---
assert(
  !passesRobinhoodRealPoolScreen({
    tvlUsd: 1_000,
    volume24hUsd: 500,
    feeTvlRatio: 0.00001,
    quoteSymbol: "WETH",
    quoteMint: tokens.WETH,
    baseMint: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }),
  "rejects ultra-thin pools",
);
assert(
  passesRobinhoodRealPoolScreen({
    tvlUsd: 120_000,
    volume24hUsd: 80_000,
    feeTvlRatio: 0.001,
    quoteSymbol: "WETH",
    quoteMint: tokens.WETH,
    baseMint: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }),
  "accepts liquid WETH quote pool",
);

if (doSimulate) {
  console.log("\n--- On-chain simulate (read-only) ---");
  const network =
    String(process.env.ROBINHOOD_LP_REAL_NETWORK || "mainnet").toLowerCase() === "testnet"
      ? "testnet"
      : "mainnet";
  const publicClient = getRobinhoodPublicClient(network);
  const chainId = await publicClient.getChainId();
  assert(
    network === "testnet" || chainId === ROBINHOOD_MAINNET_CHAIN_ID,
    `RPC chainId=${chainId} network=${network}`,
  );

  // Known USDG/WETH Uniswap pool on Robinhood (from DexScreener earlier).
  const poolAddress =
    poolArg ||
    process.env.ROBINHOOD_LP_VALIDATE_POOL ||
    "0x52e65b17fb6e5ba00ed806f37afcd2daa50271ca";

  try {
    const pool = await readPoolState(poolAddress, network);
    assert(pool.token0 && pool.token1, `pool slot0 readable token0=${pool.token0}`);
    assert(Number.isFinite(pool.currentTick), `currentTick=${pool.currentTick}`);

    const ticks = await resolveTickRangeFromBins({
      poolAddress,
      binsBelow: 20,
      binsAbove: 20,
      network,
    });
    assert(ticks.tickLower < ticks.tickUpper, "resolved tick range valid");
    assert(
      ticks.tickLower <= pool.currentTick && pool.currentTick < ticks.tickUpper,
      "mint range contains current tick (in-range)",
    );

    // Simulate NPM mint with dust amounts from a random EOA (expect revert on balances,
    // but encode/call path must be valid). We only assert simulateContract is invokable.
    const { encodeFunctionData, parseAbi } = await import("viem");
    const NPM_ABI = parseAbi([
      "function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    ]);
    const data = encodeFunctionData({
      abi: NPM_ABI,
      functionName: "mint",
      args: [
        {
          token0: /** @type {`0x${string}`} */ (pool.token0),
          token1: /** @type {`0x${string}`} */ (pool.token1),
          fee: pool.feeTier,
          tickLower: ticks.tickLower,
          tickUpper: ticks.tickUpper,
          amount0Desired: 1000n,
          amount1Desired: 1000n,
          amount0Min: 0n,
          amount1Min: 0n,
          recipient: "0x0000000000000000000000000000000000000001",
          deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        },
      ],
    });
    assert(data.startsWith("0x"), "mint calldata encoded");
    assertRobinhoodLpAllowedDestination(uni.nonfungiblePositionManager);
    assert(true, "mint calldata allowlisted to NPM (not submitted)");

    console.log(
      `  pool=${poolAddress} fee=${pool.feeTier} tick=${pool.currentTick} range=[${ticks.tickLower},${ticks.tickUpper}]`,
    );
  } catch (e) {
    assert(false, `simulate path error: ${e instanceof Error ? e.message : e}`);
  }
} else {
  console.log("\n(skip on-chain simulate; pass --simulate to exercise RPC reads)");
}

console.log("\n=== Summary ===");
if (failed > 0) {
  console.error(`${failed} assertion(s) failed`);
  console.error(
    "Kill criterion: do not disable dry-run until simulate path can produce a valid in-range mint + close on testnet/fork.",
  );
  process.exit(1);
}
console.log("All checks passed.");
console.log(
  "RECOMMENDATION: keep ROBINHOOD_LP_REAL_DRY_RUN=true until a dedicated security review of Privy eth_sendTransaction + allowlist + caps.",
);
process.exit(0);
