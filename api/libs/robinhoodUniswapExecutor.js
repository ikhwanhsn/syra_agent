/**
 * Uniswap v3 executor for Robinhood Chain LP Autopilot.
 * Reads via viem publicClient; signs/sends via Privy eth_sendTransaction only.
 */
import {
  createPublicClient,
  http,
  encodeFunctionData,
  decodeEventLog,
  parseAbi,
  formatEther,
  formatUnits,
  maxUint128,
  maxUint256,
} from "viem";
import {
  binsToTickRange,
  feeDecimalToTier,
  getRobinhoodChain,
  getRobinhoodRpcUrl,
  getRobinhoodUniswapV3Addresses,
  ROBINHOOD_MAINNET_CHAIN_ID,
  tickSpacingForFeeTier,
} from "../config/robinhoodChain.js";
import {
  assertRobinhoodLpAllowedDestination,
  getRobinhoodLpRealMinGasWei,
  getRobinhoodLpRealSlippageBps,
} from "../config/robinhoodLpRealAccess.js";
import { privySendEvmTx } from "../services/privyServerWallet.js";

const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

const POOL_ABI = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function fee() view returns (uint24)",
  "function tickSpacing() view returns (int24)",
  "function liquidity() view returns (uint128)",
]);

const NPM_ABI = parseAbi([
  "function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function increaseLiquidity((uint256 tokenId,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,uint256 deadline)) payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function decreaseLiquidity((uint256 tokenId,uint128 liquidity,uint256 amount0Min,uint256 amount1Min,uint256 deadline)) payable returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId,address recipient,uint128 amount0Max,uint128 amount1Max)) payable returns (uint256 amount0, uint256 amount1)",
  "function burn(uint256 tokenId) payable",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
]);

const SWAP_ROUTER_ABI = parseAbi([
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)",
]);

const FACTORY_ABI = parseAbi([
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)",
]);

const TX_CONFIRM_TIMEOUT_MS = 90_000;
const DEFAULT_DEADLINE_SECS = 20 * 60;

/** @type {import('viem').PublicClient | null} */
let cachedPublicClient = null;

/**
 * @param {'mainnet'|'testnet'} [network]
 */
export function getRobinhoodPublicClient(network = "mainnet") {
  if (network === "mainnet" && cachedPublicClient) return cachedPublicClient;
  const client = createPublicClient({
    chain: getRobinhoodChain(network),
    transport: http(getRobinhoodRpcUrl(network), { timeout: 20_000 }),
  });
  if (network === "mainnet") cachedPublicClient = client;
  return client;
}

function toAddr(value) {
  const a = String(value || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) throw new Error(`invalid_address:${value}`);
  return /** @type {`0x${string}`} */ (a);
}

function applySlippageMin(amount, slippageBps) {
  const amt = typeof amount === "bigint" ? amount : BigInt(amount || 0);
  const bps = BigInt(Math.max(0, Math.floor(Number(slippageBps) || 0)));
  if (amt <= 0n) return 0n;
  return (amt * (10_000n - bps)) / 10_000n;
}

function deadlineTs(secs = DEFAULT_DEADLINE_SECS) {
  return BigInt(Math.floor(Date.now() / 1000) + secs);
}

/**
 * @param {{ privyWalletId: string; to: string; data: string; value?: bigint; chainId?: number }} input
 */
async function sendAllowedTx(input) {
  assertRobinhoodLpAllowedDestination(input.to);
  const { hash } = await privySendEvmTx({
    privyWalletId: input.privyWalletId,
    to: input.to,
    data: input.data,
    value: input.value ?? 0n,
    chainId: input.chainId ?? ROBINHOOD_MAINNET_CHAIN_ID,
  });
  return hash;
}

/**
 * @param {import('viem').PublicClient} publicClient
 * @param {string} hash
 */
export async function waitForRobinhoodTx(publicClient, hash) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: /** @type {`0x${string}`} */ (hash),
    timeout: TX_CONFIRM_TIMEOUT_MS,
  });
  if (receipt.status !== "success") {
    throw new Error(`tx_reverted:${hash}`);
  }
  return receipt;
}

/**
 * @param {string} owner
 * @param {'mainnet'|'testnet'} [network]
 */
export async function getNativeEthBalance(owner, network = "mainnet") {
  const publicClient = getRobinhoodPublicClient(network);
  return publicClient.getBalance({ address: toAddr(owner) });
}

/**
 * Guard: require enough native ETH for gas before opening.
 * @param {string} owner
 * @param {'mainnet'|'testnet'} [network]
 */
export async function assertGasBalance(owner, network = "mainnet") {
  const bal = await getNativeEthBalance(owner, network);
  const min = getRobinhoodLpRealMinGasWei();
  if (bal < min) {
    throw new Error(
      `insufficient_gas_eth:have=${formatEther(bal)} need>=${formatEther(min)}`,
    );
  }
  return bal;
}

/**
 * @param {string} token
 * @param {string} owner
 * @param {'mainnet'|'testnet'} [network]
 */
export async function getErc20Balance(token, owner, network = "mainnet") {
  const publicClient = getRobinhoodPublicClient(network);
  return /** @type {bigint} */ (
    await publicClient.readContract({
      address: toAddr(token),
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [toAddr(owner)],
    })
  );
}

/**
 * @param {string} poolAddress
 * @param {'mainnet'|'testnet'} [network]
 */
export async function readPoolState(poolAddress, network = "mainnet") {
  const publicClient = getRobinhoodPublicClient(network);
  const pool = toAddr(poolAddress);
  const [slot0, token0, token1, fee, tickSpacing, liquidity] = await Promise.all([
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "slot0" }),
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "token0" }),
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "token1" }),
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "fee" }),
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "tickSpacing" }),
    publicClient.readContract({ address: pool, abi: POOL_ABI, functionName: "liquidity" }),
  ]);
  const [sqrtPriceX96, tick] = slot0;
  return {
    poolAddress: pool,
    sqrtPriceX96,
    currentTick: Number(tick),
    token0: String(token0),
    token1: String(token1),
    feeTier: Number(fee),
    tickSpacing: Number(tickSpacing),
    liquidity: String(liquidity),
  };
}

/**
 * @param {string|number|bigint} tokenId
 * @param {'mainnet'|'testnet'} [network]
 */
export async function readNpmPosition(tokenId, network = "mainnet") {
  const publicClient = getRobinhoodPublicClient(network);
  const npm = getRobinhoodUniswapV3Addresses().nonfungiblePositionManager;
  const id = BigInt(tokenId);
  const pos = await publicClient.readContract({
    address: npm,
    abi: NPM_ABI,
    functionName: "positions",
    args: [id],
  });
  return {
    tokenId: id.toString(),
    token0: String(pos[2]),
    token1: String(pos[3]),
    feeTier: Number(pos[4]),
    tickLower: Number(pos[5]),
    tickUpper: Number(pos[6]),
    liquidity: String(pos[7]),
    tokensOwed0: String(pos[10]),
    tokensOwed1: String(pos[11]),
  };
}

/**
 * Ensure ERC-20 allowance for spender; approve max if needed.
 * @param {{ privyWalletId: string; owner: string; token: string; spender: string; amount: bigint; network?: 'mainnet'|'testnet'; simulateOnly?: boolean }} input
 */
export async function ensureApproval(input) {
  const {
    privyWalletId,
    owner,
    token,
    spender,
    amount,
    network = "mainnet",
    simulateOnly = false,
  } = input;
  const publicClient = getRobinhoodPublicClient(network);
  const tokenAddr = toAddr(token);
  const spenderAddr = toAddr(spender);
  assertRobinhoodLpAllowedDestination(tokenAddr);
  assertRobinhoodLpAllowedDestination(spenderAddr);

  const allowance = /** @type {bigint} */ (
    await publicClient.readContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [toAddr(owner), spenderAddr],
    })
  );
  if (allowance >= amount) {
    return { skipped: true, allowance: allowance.toString() };
  }

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddr, maxUint256],
  });

  if (simulateOnly) {
    await publicClient.simulateContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddr, maxUint256],
      account: toAddr(owner),
    });
    return { simulated: true, to: tokenAddr, data };
  }

  const hash = await sendAllowedTx({
    privyWalletId,
    to: tokenAddr,
    data,
    chainId: getRobinhoodChain(network).id,
  });
  await waitForRobinhoodTx(publicClient, hash);
  return { hash, approved: true };
}

/**
 * SwapRouter02 exactInputSingle sidecar.
 * @param {{ privyWalletId: string; owner: string; tokenIn: string; tokenOut: string; fee: number; amountIn: bigint; amountOutMinimum?: bigint; network?: 'mainnet'|'testnet'; simulateOnly?: boolean }} input
 */
export async function swapExactInputSingle(input) {
  const {
    privyWalletId,
    owner,
    tokenIn,
    tokenOut,
    fee,
    amountIn,
    amountOutMinimum,
    network = "mainnet",
    simulateOnly = false,
  } = input;
  const publicClient = getRobinhoodPublicClient(network);
  const router = getRobinhoodUniswapV3Addresses().swapRouter02;
  assertRobinhoodLpAllowedDestination(router);
  assertRobinhoodLpAllowedDestination(tokenIn);

  const slippageBps = getRobinhoodLpRealSlippageBps();
  const minOut =
    amountOutMinimum != null
      ? BigInt(amountOutMinimum)
      : applySlippageMin(amountIn / 1000n, slippageBps); // conservative floor when no quote

  await ensureApproval({
    privyWalletId,
    owner,
    token: tokenIn,
    spender: router,
    amount: amountIn,
    network,
    simulateOnly,
  });

  const params = {
    tokenIn: toAddr(tokenIn),
    tokenOut: toAddr(tokenOut),
    fee: Number(fee),
    recipient: toAddr(owner),
    amountIn,
    amountOutMinimum: minOut,
    sqrtPriceLimitX96: 0n,
  };

  if (simulateOnly) {
    await publicClient.simulateContract({
      address: router,
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [params],
      account: toAddr(owner),
    });
    return { simulated: true, params };
  }

  const data = encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [params],
  });
  const hash = await sendAllowedTx({
    privyWalletId,
    to: router,
    data,
    chainId: getRobinhoodChain(network).id,
  });
  await waitForRobinhoodTx(publicClient, hash);
  return { hash, params };
}

/**
 * Derive tick range from sim bins + live pool slot0.
 * @param {{ poolAddress: string; binsBelow: number; binsAbove: number; feeTierDecimal?: number; network?: 'mainnet'|'testnet' }} input
 */
export async function resolveTickRangeFromBins(input) {
  const pool = await readPoolState(input.poolAddress, input.network ?? "mainnet");
  const feeTier =
    pool.feeTier ||
    (input.feeTierDecimal != null ? feeDecimalToTier(input.feeTierDecimal) : 3000);
  const spacing = pool.tickSpacing || tickSpacingForFeeTier(feeTier);
  const range = binsToTickRange({
    currentTick: pool.currentTick,
    tickSpacing: spacing,
    binsBelow: input.binsBelow,
    binsAbove: input.binsAbove,
  });
  return { ...pool, feeTier, ...range };
}

/**
 * Parse tokenId from IncreaseLiquidity / Transfer logs on mint receipt.
 * @param {import('viem').TransactionReceipt} receipt
 * @param {string} npmAddress
 */
function parseMintTokenId(receipt, npmAddress) {
  const npm = npmAddress.toLowerCase();
  for (const log of receipt.logs || []) {
    if (String(log.address || "").toLowerCase() !== npm) continue;
    try {
      const decoded = decodeEventLog({
        abi: NPM_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "IncreaseLiquidity" && decoded.args?.tokenId != null) {
        return BigInt(decoded.args.tokenId).toString();
      }
    } catch {
      // not our event
    }
    // ERC-721 Transfer topic0; tokenId is topic[3]
    const transferTopic =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    if (
      log.topics?.[0]?.toLowerCase() === transferTopic &&
      log.topics?.[3]
    ) {
      return BigInt(log.topics[3]).toString();
    }
  }
  throw new Error("mint_token_id_not_found_in_logs");
}

/**
 * Open a Uniswap v3 LP position (approve + optional sidecar + mint).
 *
 * @param {{
 *   privyWalletId: string;
 *   owner: string;
 *   poolAddress: string;
 *   binsBelow: number;
 *   binsAbove: number;
 *   amount0Desired: bigint;
 *   amount1Desired: bigint;
 *   feeTierDecimal?: number;
 *   network?: 'mainnet'|'testnet';
 *   simulateOnly?: boolean;
 *   skipSidecar?: boolean;
 * }} input
 */
export async function openPosition(input) {
  const {
    privyWalletId,
    owner,
    poolAddress,
    binsBelow,
    binsAbove,
    amount0Desired,
    amount1Desired,
    feeTierDecimal,
    network = "mainnet",
    simulateOnly = false,
    skipSidecar = true,
  } = input;

  if (!simulateOnly) {
    await assertGasBalance(owner, network);
  }

  const publicClient = getRobinhoodPublicClient(network);
  const uni = getRobinhoodUniswapV3Addresses();
  const npm = uni.nonfungiblePositionManager;
  assertRobinhoodLpAllowedDestination(npm);

  const range = await resolveTickRangeFromBins({
    poolAddress,
    binsBelow,
    binsAbove,
    feeTierDecimal,
    network,
  });

  // Optional sidecar when one side is zero and caller provides funding token via skipSidecar=false.
  if (!skipSidecar && (amount0Desired === 0n || amount1Desired === 0n)) {
    // Caller is expected to pre-balance; this path is reserved for future auto-split.
  }

  const slippageBps = getRobinhoodLpRealSlippageBps();
  const amount0Min = applySlippageMin(amount0Desired, slippageBps);
  const amount1Min = applySlippageMin(amount1Desired, slippageBps);

  if (amount0Desired > 0n) {
    await ensureApproval({
      privyWalletId,
      owner,
      token: range.token0,
      spender: npm,
      amount: amount0Desired,
      network,
      simulateOnly,
    });
  }
  if (amount1Desired > 0n) {
    await ensureApproval({
      privyWalletId,
      owner,
      token: range.token1,
      spender: npm,
      amount: amount1Desired,
      network,
      simulateOnly,
    });
  }

  const mintParams = {
    token0: toAddr(range.token0),
    token1: toAddr(range.token1),
    fee: range.feeTier,
    tickLower: range.tickLower,
    tickUpper: range.tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    recipient: toAddr(owner),
    deadline: deadlineTs(),
  };

  if (simulateOnly) {
    await publicClient.simulateContract({
      address: npm,
      abi: NPM_ABI,
      functionName: "mint",
      args: [mintParams],
      account: toAddr(owner),
    });
    return {
      simulated: true,
      tickLower: range.tickLower,
      tickUpper: range.tickUpper,
      feeTier: range.feeTier,
      token0: range.token0,
      token1: range.token1,
      currentTick: range.currentTick,
      mintParams,
    };
  }

  const data = encodeFunctionData({
    abi: NPM_ABI,
    functionName: "mint",
    args: [mintParams],
  });
  const hash = await sendAllowedTx({
    privyWalletId,
    to: npm,
    data,
    chainId: getRobinhoodChain(network).id,
  });
  const receipt = await waitForRobinhoodTx(publicClient, hash);
  const tokenId = parseMintTokenId(receipt, npm);
  const onChain = await readNpmPosition(tokenId, network);

  return {
    hash,
    tokenId,
    liquidity: onChain.liquidity,
    tickLower: onChain.tickLower,
    tickUpper: onChain.tickUpper,
    feeTier: onChain.feeTier,
    token0: onChain.token0,
    token1: onChain.token1,
    currentTick: range.currentTick,
    receipt,
  };
}

/**
 * Collect fees for a position NFT.
 * @param {{ privyWalletId: string; owner: string; tokenId: string|number|bigint; network?: 'mainnet'|'testnet'; simulateOnly?: boolean }} input
 */
export async function collectFees(input) {
  const { privyWalletId, owner, tokenId, network = "mainnet", simulateOnly = false } = input;
  const publicClient = getRobinhoodPublicClient(network);
  const npm = getRobinhoodUniswapV3Addresses().nonfungiblePositionManager;
  assertRobinhoodLpAllowedDestination(npm);
  const id = BigInt(tokenId);
  const params = {
    tokenId: id,
    recipient: toAddr(owner),
    amount0Max: maxUint128,
    amount1Max: maxUint128,
  };

  if (simulateOnly) {
    await publicClient.simulateContract({
      address: npm,
      abi: NPM_ABI,
      functionName: "collect",
      args: [params],
      account: toAddr(owner),
    });
    return { simulated: true, tokenId: id.toString() };
  }

  const data = encodeFunctionData({
    abi: NPM_ABI,
    functionName: "collect",
    args: [params],
  });
  const hash = await sendAllowedTx({
    privyWalletId,
    to: npm,
    data,
    chainId: getRobinhoodChain(network).id,
  });
  await waitForRobinhoodTx(publicClient, hash);
  return { hash, tokenId: id.toString() };
}

/**
 * Close position: decreaseLiquidity(all) + collect + burn.
 * @param {{ privyWalletId: string; owner: string; tokenId: string|number|bigint; network?: 'mainnet'|'testnet'; simulateOnly?: boolean }} input
 */
export async function closePosition(input) {
  const { privyWalletId, owner, tokenId, network = "mainnet", simulateOnly = false } = input;
  const publicClient = getRobinhoodPublicClient(network);
  const npm = getRobinhoodUniswapV3Addresses().nonfungiblePositionManager;
  assertRobinhoodLpAllowedDestination(npm);
  const id = BigInt(tokenId);
  const onChain = await readNpmPosition(id, network);
  const liquidity = BigInt(onChain.liquidity || "0");
  const hashes = [];

  if (liquidity > 0n) {
    const decParams = {
      tokenId: id,
      liquidity,
      amount0Min: 0n,
      amount1Min: 0n,
      deadline: deadlineTs(),
    };
    if (simulateOnly) {
      await publicClient.simulateContract({
        address: npm,
        abi: NPM_ABI,
        functionName: "decreaseLiquidity",
        args: [decParams],
        account: toAddr(owner),
      });
    } else {
      const data = encodeFunctionData({
        abi: NPM_ABI,
        functionName: "decreaseLiquidity",
        args: [decParams],
      });
      const hash = await sendAllowedTx({
        privyWalletId,
        to: npm,
        data,
        chainId: getRobinhoodChain(network).id,
      });
      await waitForRobinhoodTx(publicClient, hash);
      hashes.push(hash);
    }
  }

  const collectResult = await collectFees({
    privyWalletId,
    owner,
    tokenId: id,
    network,
    simulateOnly,
  });
  if (collectResult.hash) hashes.push(collectResult.hash);

  if (simulateOnly) {
    await publicClient.simulateContract({
      address: npm,
      abi: NPM_ABI,
      functionName: "burn",
      args: [id],
      account: toAddr(owner),
    });
    return { simulated: true, tokenId: id.toString(), hashes };
  }

  const burnData = encodeFunctionData({
    abi: NPM_ABI,
    functionName: "burn",
    args: [id],
  });
  const burnHash = await sendAllowedTx({
    privyWalletId,
    to: npm,
    data: burnData,
    chainId: getRobinhoodChain(network).id,
  });
  await waitForRobinhoodTx(publicClient, burnHash);
  hashes.push(burnHash);

  return {
    hash: burnHash,
    hashes,
    tokenId: id.toString(),
    token0: onChain.token0,
    token1: onChain.token1,
  };
}

/**
 * Rough split of deposit USD into token0/token1 raw amounts using pool price + decimals.
 * Uses 50/50 notional when both sides are needed; single-sided when one bin side is 0.
 *
 * @param {{
 *   poolAddress: string;
 *   depositUsd: number;
 *   entryPriceUsd: number;
 *   binsBelow: number;
 *   binsAbove: number;
 *   ethUsd?: number;
 *   network?: 'mainnet'|'testnet';
 * }} input
 */
export async function estimateMintAmounts(input) {
  const network = input.network ?? "mainnet";
  const publicClient = getRobinhoodPublicClient(network);
  const pool = await readPoolState(input.poolAddress, network);
  const [dec0, dec1, sym0, sym1] = await Promise.all([
    publicClient.readContract({ address: toAddr(pool.token0), abi: ERC20_ABI, functionName: "decimals" }),
    publicClient.readContract({ address: toAddr(pool.token1), abi: ERC20_ABI, functionName: "decimals" }),
    publicClient.readContract({ address: toAddr(pool.token0), abi: ERC20_ABI, functionName: "symbol" }).catch(() => "T0"),
    publicClient.readContract({ address: toAddr(pool.token1), abi: ERC20_ABI, functionName: "symbol" }).catch(() => "T1"),
  ]);

  const depositUsd = Math.max(0, Number(input.depositUsd) || 0);
  const ethUsd = Math.max(1, Number(input.ethUsd) || Number(input.entryPriceUsd) || 2000);
  const below = Math.max(0, Math.floor(Number(input.binsBelow) || 0));
  const above = Math.max(0, Math.floor(Number(input.binsAbove) || 0));

  const isWeth = (sym) => String(sym || "").toUpperCase() === "WETH" || String(sym || "").toUpperCase() === "ETH";
  const isStable = (sym) => {
    const s = String(sym || "").toUpperCase();
    return s === "USDG" || s === "USDC" || s === "USDT";
  };

  const price0Usd = isWeth(sym0) ? ethUsd : isStable(sym0) ? 1 : Number(input.entryPriceUsd) || ethUsd;
  const price1Usd = isWeth(sym1) ? ethUsd : isStable(sym1) ? 1 : 1;

  let share0 = 0.5;
  if (below === 0 && above > 0) share0 = isWeth(sym0) || !isStable(sym0) ? 0 : 1;
  if (above === 0 && below > 0) share0 = isWeth(sym0) || !isStable(sym0) ? 1 : 0;

  const usd0 = depositUsd * share0;
  const usd1 = depositUsd * (1 - share0);
  const amount0Desired =
    price0Usd > 0
      ? BigInt(Math.max(0, Math.floor((usd0 / price0Usd) * 10 ** Number(dec0))))
      : 0n;
  const amount1Desired =
    price1Usd > 0
      ? BigInt(Math.max(0, Math.floor((usd1 / price1Usd) * 10 ** Number(dec1))))
      : 0n;

  return {
    amount0Desired,
    amount1Desired,
    token0: pool.token0,
    token1: pool.token1,
    decimals0: Number(dec0),
    decimals1: Number(dec1),
    symbol0: String(sym0),
    symbol1: String(sym1),
    feeTier: pool.feeTier,
    human0: formatUnits(amount0Desired, Number(dec0)),
    human1: formatUnits(amount1Desired, Number(dec1)),
  };
}

/**
 * Whether current tick is inside [tickLower, tickUpper).
 * @param {number} currentTick
 * @param {number} tickLower
 * @param {number} tickUpper
 */
export function isTickInRange(currentTick, tickLower, tickUpper) {
  return currentTick >= tickLower && currentTick < tickUpper;
}

export {
  ERC20_ABI,
  POOL_ABI,
  NPM_ABI,
  SWAP_ROUTER_ABI,
  FACTORY_ABI,
  applySlippageMin,
};
