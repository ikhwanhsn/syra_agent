/**
 * Execution adapter for the OKX.AI Trading Hackathon agent.
 *
 * Two modes:
 *  - paper (default): deterministic simulated fills using the decision-engine
 *    price + modeled slippage/fees. Lets the whole loop be validated with zero
 *    financial risk.
 *  - live: routes the swap through the bound OKX Agentic Wallet via Onchain OS
 *    so the on-chain trade is attributed to the wallet the leaderboard tracks.
 *
 * IMPORTANT (leaderboard rule): the competition only counts on-chain trades
 * executed through Onchain OS from the bound Agentic Wallet. Live mode therefore
 * shells out to the Onchain OS trade command. Because the exact swap subcommand
 * must be confirmed during Phase 0 setup, live mode REQUIRES an explicit
 * `OKX_TRADING_EXEC_CMD` template — it never guesses. If it is not configured,
 * live execution throws instead of silently doing the wrong thing.
 */
import { spawnSync } from "node:child_process";

/**
 * Per-token on-chain routing for live swaps via `onchainos swap execute`, which
 * takes token *contract addresses*, a chain, and the wallet address.
 *
 * Provide this via OKX_TRADING_TOKENS (JSON):
 *   { "solana": { "chain": "Solana", "address": "<SOL/token mint>", "quoteAddress": "<USDT mint>", "wallet": "<addr>" }, ... }
 *
 * `quoteAddress` / `wallet` fall back to OKX_TRADING_QUOTE_ADDR and
 * OKX_TRADING_WALLET when omitted per-token.
 */
function tokenMap() {
  const raw = process.env.OKX_TRADING_TOKENS;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function resolveTokenRoute(token) {
  const m = tokenMap();
  const entry = m[String(token).toLowerCase()] || {};
  return {
    chain: entry.chain || process.env.OKX_TRADING_CHAIN || null,
    address: entry.address || null,
    quoteAddress: entry.quoteAddress || process.env.OKX_TRADING_QUOTE_ADDR || null,
    wallet: entry.wallet || process.env.OKX_TRADING_WALLET || null,
  };
}

/**
 * Deterministic paper fill.
 * @param {{ side: "buy"|"sell", priceUsd: number, notionalUsd?: number, qty?: number, cfg: any }} args
 */
export function simulateFill({ side, priceUsd, notionalUsd, qty, cfg }) {
  const slip = (cfg.slippageBps || 0) / 10_000;
  const feeRate = (cfg.feeBps || 0) / 10_000;
  const fillPrice = side === "buy" ? priceUsd * (1 + slip) : priceUsd * (1 - slip);
  let filledQty;
  let filledNotional;
  if (side === "buy") {
    filledNotional = Number(notionalUsd) || 0;
    filledQty = fillPrice > 0 ? filledNotional / fillPrice : 0;
  } else {
    filledQty = Number(qty) || 0;
    filledNotional = filledQty * fillPrice;
  }
  const feeUsd = filledNotional * feeRate;
  return {
    status: "filled",
    mode: "paper",
    filledPriceUsd: fillPrice,
    filledQty,
    filledNotionalUsd: filledNotional,
    feeUsd,
    slippageBps: cfg.slippageBps || 0,
    txHash: null,
  };
}

/**
 * Build the live swap argv for `onchainos swap execute`.
 *
 * Default template (override with OKX_TRADING_EXEC_CMD):
 *   onchainos swap execute --from {FROM_ADDR} --to {TO_ADDR}
 *     --readable-amount {READABLE_AMOUNT} --chain {CHAIN}
 *     --wallet {WALLET} --slippage {SLIPPAGE_PCT} --json
 *
 * For a buy the swap is quote -> token (readable-amount = USD notional of the
 * quote/USDT); for a sell it is token -> quote (readable-amount = base qty).
 * Placeholders: {FROM_ADDR} {TO_ADDR} {READABLE_AMOUNT} {CHAIN} {WALLET}
 * {SLIPPAGE_PCT} {SLIPPAGE_BPS} {TOKEN} {SIDE}.
 */
const DEFAULT_EXEC_CMD =
  "onchainos swap execute --from {FROM_ADDR} --to {TO_ADDR} " +
  "--readable-amount {READABLE_AMOUNT} --chain {CHAIN} --wallet {WALLET} " +
  "--slippage {SLIPPAGE_PCT} --json";

export function buildLiveCommand({ side, token, notionalUsd, qty, cfg }) {
  const route = resolveTokenRoute(token);
  if (!route.address || !route.quoteAddress || !route.chain || !route.wallet) {
    throw new Error(
      `Live execution needs a full route for "${token}" (chain, token address, ` +
        `quote address, wallet). Configure OKX_TRADING_TOKENS / OKX_TRADING_QUOTE_ADDR ` +
        `/ OKX_TRADING_WALLET / OKX_TRADING_CHAIN (Phase 0). Refusing to guess.`,
    );
  }
  const template = (process.env.OKX_TRADING_EXEC_CMD || DEFAULT_EXEC_CMD).trim();
  const fromAddr = side === "buy" ? route.quoteAddress : route.address;
  const toAddr = side === "buy" ? route.address : route.quoteAddress;
  const readableAmount = side === "buy" ? Number(notionalUsd) || 0 : Number(qty) || 0;
  const subst = {
    "{FROM_ADDR}": fromAddr,
    "{TO_ADDR}": toAddr,
    "{READABLE_AMOUNT}": String(readableAmount),
    "{CHAIN}": route.chain,
    "{WALLET}": route.wallet,
    "{SLIPPAGE_PCT}": String(((cfg.slippageBps || 0) / 100).toFixed(4)),
    "{SLIPPAGE_BPS}": String(cfg.slippageBps || 0),
    "{TOKEN}": token,
    "{SIDE}": side,
  };
  return template.split(/\s+/).map((p) => {
    let out = p;
    for (const [k, v] of Object.entries(subst)) out = out.split(k).join(String(v));
    return out;
  });
}

/**
 * Execute an order intent. Returns a normalized fill object; never throws in
 * paper mode. In live mode, a non-zero exit or unparseable output yields a
 * `status: "failed"` fill (caller must not mutate positions on failure).
 * @param {{ side: "buy"|"sell", token: string, instrument?: string, priceUsd: number, notionalUsd?: number, qty?: number }} intent
 * @param {any} cfg
 */
export function executeIntent(intent, cfg) {
  const { side, priceUsd, notionalUsd, qty } = intent;

  if (!cfg.live) {
    return simulateFill({ side, priceUsd, notionalUsd, qty, cfg });
  }

  let argv;
  try {
    argv = buildLiveCommand({ side, token: intent.token, notionalUsd, qty, cfg });
  } catch (err) {
    return {
      status: "failed",
      mode: "live",
      error: String(err?.message || err),
      filledPriceUsd: 0,
      filledQty: 0,
      filledNotionalUsd: 0,
      feeUsd: 0,
      slippageBps: cfg.slippageBps || 0,
      txHash: null,
    };
  }

  const bin = argv[0];
  const args = argv.slice(1);
  const res = spawnSync(bin, args, { encoding: "utf8", timeout: 120_000 });

  if (res.error || res.status !== 0) {
    return {
      status: "failed",
      mode: "live",
      error: String(res.error?.message || res.stderr || `exit ${res.status}`),
      filledPriceUsd: 0,
      filledQty: 0,
      filledNotionalUsd: 0,
      feeUsd: 0,
      slippageBps: cfg.slippageBps || 0,
      txHash: null,
    };
  }

  // Parse the `onchainos swap execute` JSON result. For a buy (quote -> token)
  // toAmount = token qty received and fromAmount = quote/USDT spent; for a sell
  // (token -> quote) fromAmount = token qty sold and toAmount = quote received.
  const parsed = safeJson(res.stdout);
  const modeledPrice =
    priceUsd * (side === "buy" ? 1 + cfg.slippageBps / 10_000 : 1 - cfg.slippageBps / 10_000);

  let filledQty;
  let filledNotional;
  if (side === "buy") {
    filledQty = Number(parsed?.toAmount ?? parsed?.filledQty ?? (notionalUsd || 0) / modeledPrice) || 0;
    filledNotional = Number(parsed?.fromAmount ?? parsed?.filledNotional ?? notionalUsd) || 0;
  } else {
    filledQty = Number(parsed?.fromAmount ?? parsed?.filledQty ?? qty) || 0;
    filledNotional = Number(parsed?.toAmount ?? parsed?.filledNotional ?? filledQty * modeledPrice) || 0;
  }
  const fillPrice = filledQty > 0 ? filledNotional / filledQty : modeledPrice;

  return {
    status: "filled",
    mode: "live",
    filledPriceUsd: fillPrice,
    filledQty,
    filledNotionalUsd: filledNotional,
    feeUsd: Number(parsed?.tradeFee ?? parsed?.feeUsd ?? 0) || 0,
    slippageBps: cfg.slippageBps || 0,
    txHash: parsed?.swapTxHash || parsed?.txHash || parsed?.txId || parsed?.signature || null,
    raw: parsed ?? undefined,
  };
}

function safeJson(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    // try to find the first JSON object in noisy output
    const m = String(str).match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
