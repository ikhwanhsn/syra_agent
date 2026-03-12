/**
 * OKX DEX / On-chain Market routes (token by contract address + chain).
 * All endpoints use OKX web3 REST API (api/libs/okxDexMarket.js). Requires OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE.
 *
 * GET/POST /okx/dex/price       — address, chain (default ethereum)
 * GET/POST /okx/dex/prices      — tokens (comma chainIndex:address or addresses), chain
 * GET/POST /okx/dex/kline       — address, chain, bar (1H), limit (100), after, before
 * GET/POST /okx/dex/trades      — address, chain, limit (100), after
 * GET/POST /okx/dex/index       — address (empty for native), chain
 * GET/POST /okx/dex/signal-chains
 * GET/POST /okx/dex/signal-list — chain, wallet-type, min-amount-usd, etc.
 * GET/POST /okx/dex/memepump-chains
 * GET/POST /okx/dex/memepump-tokens — chain, stage (NEW|MIGRATING|MIGRATED), filters
 * GET/POST /okx/dex/memepump-token-details — address, chain
 * GET/POST /okx/dex/memepump-token-dev-info — address, chain
 * GET/POST /okx/dex/memepump-similar-tokens — address, chain
 * GET/POST /okx/dex/memepump-token-bundle-info — address, chain
 * GET/POST /okx/dex/memepump-aped-wallet — address, chain, wallet
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_OKX_USD } from "../../../config/x402Pricing.js";
import {
  getDexPrice,
  getDexPrices,
  getDexKline,
  getDexTrades,
  getDexIndexPrice,
  getDexSignalChains,
  getDexSignalList,
  getDexMemepumpChains,
  getDexMemepumpTokenList,
  getDexMemepumpTokenDetails,
  getDexMemepumpTokenDevInfo,
  getDexMemepumpSimilarTokens,
  getDexMemepumpTokenBundleInfo,
  getDexMemepumpApedWallet,
  hasOkxDexCredentials,
} from "../../../libs/okxDexMarket.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const OKX_DEX_PAYMENT_BASE = {
  price: X402_API_PRICE_OKX_USD,
  discoverable: true,
  inputSchema: {},
};

function params(req) {
  return { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
}

function defaultStr(v, def) {
  if (v != null && String(v).trim() !== "") return String(v).trim();
  return def;
}

function defaultInt(v, def, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isNaN(n)) {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  }
  return def;
}

async function maybeSettle(res, req) {
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
}

function paymentOpt(opts) {
  return { ...OKX_DEX_PAYMENT_BASE, ...opts };
}

/** Default token address per chain when address/tokens omitted (wrapped native or main token). */
const DEFAULT_TOKEN_BY_CHAIN = {
  ethereum: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  solana: "So11111111111111111111111111111111111111112", // wrapped SOL
  base: "0x4200000000000000000000000000000000000006", // WETH on Base
  bsc: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  arbitrum: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
  xlayer: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // OKB/native
  tron: "tr7nhqjeqqtg8n4nqejee3um9uy8y8l5cf", // USDT on TRON (fallback for chains without native)
};

function getDefaultAddressForChain(chain) {
  const c = (chain || "ethereum").trim().toLowerCase();
  const addr = DEFAULT_TOKEN_BY_CHAIN[c] ?? DEFAULT_TOKEN_BY_CHAIN.ethereum;
  return addr && String(addr).trim() !== "" ? String(addr).trim() : DEFAULT_TOKEN_BY_CHAIN.ethereum;
}

/** Get token address from request; for memepump token-specific endpoints, address is required (no default). */
function getMemepumpTokenAddress(p) {
  const raw = p.address ?? p.tokenContractAddress ?? p.token_contract_address;
  if (raw != null && String(raw).trim() !== "") return String(raw).trim();
  return null;
}

// ---- REST (OKX web3 API) ----

async function handleDexPrice(req, res) {
  const p = params(req);
  const chain = defaultStr(p.chain, "ethereum");
  const address = defaultStr(p.address ?? p.tokenContractAddress ?? p.token_contract_address, getDefaultAddressForChain(chain));
  const data = await getDexPrice(address, chain);
  res.setHeader("Cache-Control", "public, max-age=10");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleDexPrices(req, res) {
  const p = params(req);
  const chain = defaultStr(p.chain, "ethereum");
  const tokens = defaultStr(p.tokens ?? p.token_list, getDefaultAddressForChain(chain));
  const data = await getDexPrices(tokens, chain);
  res.setHeader("Cache-Control", "public, max-age=10");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleDexKline(req, res) {
  const p = params(req);
  const chain = defaultStr(p.chain, "ethereum");
  const address = defaultStr(p.address ?? p.tokenContractAddress ?? p.token_contract_address, getDefaultAddressForChain(chain));
  const data = await getDexKline(address, chain, {
    bar: defaultStr(p.bar ?? p.interval, "1H"),
    limit: defaultInt(p.limit ?? p.size, 100, 1, 299),
    after: (v = p.after) != null && String(v).trim() !== "" ? String(v).trim() : undefined,
    before: (v = p.before) != null && String(v).trim() !== "" ? String(v).trim() : undefined,
  });
  res.setHeader("Cache-Control", "public, max-age=30");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleDexTrades(req, res) {
  const p = params(req);
  const chain = defaultStr(p.chain, "ethereum");
  const address = defaultStr(p.address ?? p.tokenContractAddress ?? p.token_contract_address, getDefaultAddressForChain(chain));
  const data = await getDexTrades(address, chain, {
    limit: defaultInt(p.limit ?? p.size, 100, 1, 500),
    after: (v = p.after) != null && String(v).trim() !== "" ? String(v).trim() : undefined,
  });
  res.setHeader("Cache-Control", "public, max-age=10");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleDexIndex(req, res) {
  const p = params(req);
  const chain = defaultStr(p.chain, "ethereum");
  const address = defaultStr(p.address ?? p.tokenContractAddress, "");
  const data = await getDexIndexPrice(address, chain);
  res.setHeader("Cache-Control", "public, max-age=10");
  await maybeSettle(res, req);
  res.json(data);
}

// ---- Signal & Memepump (OKX REST, same credentials) ----

async function handleSignalChains(req, res) {
  try {
    const data = await getDexSignalChains();
    res.setHeader("Cache-Control", "public, max-age=60");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleSignalList(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const opts = {
      walletType: defaultStr(p.walletType ?? p.wallet_type, "1,2,3"),
      minAmountUsd: defaultStr(p.minAmountUsd ?? p.min_amount_usd, ""),
      maxAmountUsd: defaultStr(p.maxAmountUsd ?? p.max_amount_usd, ""),
      minAddressCount: defaultStr(p.minAddressCount ?? p.min_address_count, ""),
      maxAddressCount: defaultStr(p.maxAddressCount ?? p.max_address_count, ""),
      tokenAddress: defaultStr(p.tokenAddress ?? p.token_address, ""),
      minMarketCapUsd: defaultStr(p.minMarketCapUsd ?? p.min_market_cap_usd, ""),
      maxMarketCapUsd: defaultStr(p.maxMarketCapUsd ?? p.max_market_cap_usd, ""),
      minLiquidityUsd: defaultStr(p.minLiquidityUsd ?? p.min_liquidity_usd, ""),
      maxLiquidityUsd: defaultStr(p.maxLiquidityUsd ?? p.max_liquidity_usd, ""),
    };
    const data = await getDexSignalList(chain, opts);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpChains(req, res) {
  try {
    const data = await getDexMemepumpChains();
    res.setHeader("Cache-Control", "public, max-age=60");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpTokens(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const stage = defaultStr(p.stage ?? p.lifecycle, "NEW");
    if (!["NEW", "MIGRATING", "MIGRATED"].includes(stage)) {
      return res.status(400).json({ error: "stage must be NEW, MIGRATING, or MIGRATED" });
    }
    const opts = {
      protocolIdList: defaultStr(p.protocolIdList ?? p.protocol_id_list, ""),
      walletAddress: defaultStr(p.walletAddress ?? p.wallet_address, ""),
    };
    const data = await getDexMemepumpTokenList(chain, stage, opts);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

const MEMEPUMP_ADDRESS_REQUIRED_MSG =
  "address is required (token contract address, e.g. a Solana pump.fun or meme token). Use /okx/dex/memepump-tokens?chain=solana&stage=NEW to discover tokens.";

async function handleMemepumpTokenDetails(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const address = getMemepumpTokenAddress(p);
    if (!address) {
      return res.status(400).json({ error: MEMEPUMP_ADDRESS_REQUIRED_MSG, result: null });
    }
    const walletAddress = defaultStr(p.walletAddress ?? p.wallet ?? p.wallet_address, "");
    const data = await getDexMemepumpTokenDetails(address, chain, walletAddress);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpTokenDevInfo(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const address = getMemepumpTokenAddress(p);
    if (!address) {
      return res.status(400).json({ error: MEMEPUMP_ADDRESS_REQUIRED_MSG, result: null });
    }
    const data = await getDexMemepumpTokenDevInfo(address, chain);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpSimilarTokens(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const address = getMemepumpTokenAddress(p);
    if (!address) {
      return res.status(400).json({ error: MEMEPUMP_ADDRESS_REQUIRED_MSG, result: null });
    }
    const data = await getDexMemepumpSimilarTokens(address, chain);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpTokenBundleInfo(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const address = getMemepumpTokenAddress(p);
    if (!address) {
      return res.status(400).json({ error: MEMEPUMP_ADDRESS_REQUIRED_MSG, result: null });
    }
    const data = await getDexMemepumpTokenBundleInfo(address, chain);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

async function handleMemepumpApedWallet(req, res) {
  try {
    const p = params(req);
    const chain = defaultStr(p.chain, "solana");
    const address = getMemepumpTokenAddress(p);
    if (!address) {
      return res.status(400).json({ error: MEMEPUMP_ADDRESS_REQUIRED_MSG, result: null });
    }
    const wallet = defaultStr(p.wallet ?? p.walletAddress ?? p.wallet_address, "");
    const data = await getDexMemepumpApedWallet(address, chain, wallet);
    res.setHeader("Cache-Control", "public, max-age=30");
    await maybeSettle(res, req);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || String(err), result: null });
  }
}

function wrap(handler, needsDexCreds = false) {
  return async (req, res, next) => {
    if (needsDexCreds && !hasOkxDexCredentials()) {
      return res.status(503).json({
        error: "OKX DEX API requires OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE in environment",
        result: null,
      });
    }
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

export async function createOkxDexMarketRouter() {
  const router = express.Router();

  const restEndpoints = [
    { path: "/price", handler: handleDexPrice, needsCreds: true, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
    { path: "/prices", handler: handleDexPrices, needsCreds: true, schema: { queryParams: { tokens: { type: "string" }, chain: { type: "string" } } } },
    { path: "/kline", handler: handleDexKline, needsCreds: true, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" }, bar: { type: "string" }, limit: { type: "number" } } } },
    { path: "/trades", handler: handleDexTrades, needsCreds: true, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" }, limit: { type: "number" } } } },
    { path: "/index", handler: handleDexIndex, needsCreds: true, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
  ];

  const cliEndpoints = [
    { path: "/signal-chains", handler: handleSignalChains },
    { path: "/signal-list", handler: handleSignalList, schema: { queryParams: { chain: { type: "string" }, walletType: { type: "string" }, minAmountUsd: { type: "string" } } } },
    { path: "/memepump-chains", handler: handleMemepumpChains },
    { path: "/memepump-tokens", handler: handleMemepumpTokens, schema: { queryParams: { chain: { type: "string" }, stage: { type: "string" } } } },
    { path: "/memepump-token-details", handler: handleMemepumpTokenDetails, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
    { path: "/memepump-token-dev-info", handler: handleMemepumpTokenDevInfo, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
    { path: "/memepump-similar-tokens", handler: handleMemepumpSimilarTokens, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
    { path: "/memepump-token-bundle-info", handler: handleMemepumpTokenBundleInfo, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" } } } },
    { path: "/memepump-aped-wallet", handler: handleMemepumpApedWallet, schema: { queryParams: { address: { type: "string" }, chain: { type: "string" }, wallet: { type: "string" } } } },
  ];

  for (const { path, handler, needsCreds, schema } of restEndpoints) {
    const config = paymentOpt({ resource: `/okx/dex${path}`, inputSchema: schema || {} });
    if (process.env.NODE_ENV !== "production") {
      router.get(`${path}/dev`, wrap(handler, needsCreds));
      router.post(`${path}/dev`, wrap(handler, needsCreds));
    }
    router.get(path, requirePayment({ ...config, method: "GET" }), wrap(handler, needsCreds));
    router.post(path, requirePayment({ ...config, method: "POST" }), wrap(handler, needsCreds));
  }

  for (const { path, handler, schema } of cliEndpoints) {
    const config = paymentOpt({ resource: `/okx/dex${path}`, inputSchema: schema || {} });
    if (process.env.NODE_ENV !== "production") {
      router.get(`${path}/dev`, wrap(handler));
      router.post(`${path}/dev`, wrap(handler));
    }
    router.get(path, requirePayment({ ...config, method: "GET" }), wrap(handler));
    router.post(path, requirePayment({ ...config, method: "POST" }), wrap(handler));
  }

  return router;
}
