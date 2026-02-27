/**
 * v2 routes for each Nansen x402 endpoint. GET and POST; body from JSON (POST) or query params (GET).
 * Mount under /v2/nansen (e.g. GET/POST /v2/nansen/profiler/address/current-balance).
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_NANSEN_USD, X402_API_PRICE_NANSEN_PREMIUM_USD } from "../../../config/x402Pricing.js";
import { payer, getSentinelPayerFetch } from "../../../libs/sentinelPayer.js";
import {
  profilerAddressCurrentBalance,
  profilerAddressHistoricalBalances,
  profilerPerpPositions,
  profilerAddressTransactions,
  profilerPerpTrades,
  profilerAddressRelatedWallets,
  profilerAddressPnlSummary,
  profilerAddressPnl,
  tokenScreener,
  perpScreener,
  tgmTransfers,
  tgmJupDca,
  tgmFlowIntelligence,
  tgmWhoBoughtSold,
  tgmDexTrades,
  tgmFlows,
  profilerAddressCounterparties,
  tgmHolders,
  tgmPnlLeaderboard,
  tgmPerpPnlLeaderboard,
  perpLeaderboard,
  smartMoneyNetflow,
  smartMoneyHoldings,
  smartMoneyDexTrades,
  smartMoneyHistoricalHoldings,
  smartMoneyDcas,
  tgmPerpPositions,
  tgmPerpTrades,
} from "../../../request/nansen/nansenX402.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

/** Build options for Nansen calls: Sentinel-wrapped payer.fetch and optional baseUrl from env */
function nansenOptions() {
  return {
    fetch: getSentinelPayerFetch(),
    ...(process.env.NANSEN_API_BASE_URL ? { baseUrl: process.env.NANSEN_API_BASE_URL } : {}),
  };
}

/**
 * Build request payload from req. POST: use req.body. GET: build from req.query;
 * query values that look like JSON ({...} or [...]) are parsed.
 */
function getPayload(req) {
  if (req.method === "POST" && req.body && Object.keys(req.body).length > 0) {
    return req.body;
  }
  const q = req.query ?? {};
  const out = {};
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === "") continue;
    const s = typeof value === "string" ? value.trim() : String(value);
    if (s.startsWith("{") || s.startsWith("[")) {
      try {
        out[key] = JSON.parse(s);
      } catch {
        out[key] = value;
      }
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Factory: handler that runs fn(payload) with payer and settles payment */
function handler(fn) {
  return async (req, res) => {
    const { PAYER_KEYPAIR } = process.env;
    if (!PAYER_KEYPAIR) {
      return res.status(500).json({ error: "PAYER_KEYPAIR must be set" });
    }
    await payer.addLocalWallet(PAYER_KEYPAIR);
    try {
      const payload = getPayload(req);
      const data = await fn(payload, nansenOptions());
      await settlePaymentAndSetResponse(res, req);
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };
}

/** Payment config shared by GET and POST for an endpoint */
function paymentOpts(price, description, resource, path) {
  return {
    price,
    description,
    method: "GET",
    discoverable: true,
    resource: resource ?? `/nansen${path}`,
    outputSchema: { data: { type: "object", description: "Nansen API response" } },
  };
}

/** Register GET and POST for a single path with requirePayment */
function route(router, path, fn, price, description, resource) {
  const opts = { ...paymentOpts(price, description, resource, path) };
  const pay = requirePayment(opts);
  const h = handler(fn);
  router.get(path, pay, h);
  router.post(path, requirePayment({ ...opts, method: "POST" }), h);
}

export async function createNansenEndpointsRouter() {
  const router = express.Router();

  const basic = X402_API_PRICE_NANSEN_USD;
  const premium = X402_API_PRICE_NANSEN_PREMIUM_USD;

  // Basic — $0.01
  route(router, "/profiler/address/current-balance", profilerAddressCurrentBalance, basic, "Nansen: address current balance", "/nansen/profiler/address/current-balance");
  route(router, "/profiler/address/historical-balances", profilerAddressHistoricalBalances, basic, "Nansen: address historical balances", "/nansen/profiler/address/historical-balances");
  route(router, "/profiler/perp-positions", profilerPerpPositions, basic, "Nansen: profiler perp positions", "/nansen/profiler/perp-positions");
  route(router, "/profiler/address/transactions", profilerAddressTransactions, basic, "Nansen: address transactions", "/nansen/profiler/address/transactions");
  route(router, "/profiler/perp-trades", profilerPerpTrades, basic, "Nansen: profiler perp trades", "/nansen/profiler/perp-trades");
  route(router, "/profiler/address/related-wallets", profilerAddressRelatedWallets, basic, "Nansen: address related wallets", "/nansen/profiler/address/related-wallets");
  route(router, "/profiler/address/pnl-summary", profilerAddressPnlSummary, basic, "Nansen: address PnL summary", "/nansen/profiler/address/pnl-summary");
  route(router, "/profiler/address/pnl", profilerAddressPnl, basic, "Nansen: address PnL", "/nansen/profiler/address/pnl");
  route(router, "/token-screener", tokenScreener, basic, "Nansen: token screener", "/nansen/token-screener");
  route(router, "/perp-screener", perpScreener, basic, "Nansen: perp screener", "/nansen/perp-screener");
  route(router, "/tgm/transfers", tgmTransfers, basic, "Nansen: TGM transfers", "/nansen/tgm/transfers");
  route(router, "/tgm/jup-dca", tgmJupDca, basic, "Nansen: TGM Jupiter DCA", "/nansen/tgm/jup-dca");
  route(router, "/tgm/flow-intelligence", tgmFlowIntelligence, basic, "Nansen: TGM flow intelligence", "/nansen/tgm/flow-intelligence");
  route(router, "/tgm/who-bought-sold", tgmWhoBoughtSold, basic, "Nansen: TGM who bought/sold", "/nansen/tgm/who-bought-sold");
  route(router, "/tgm/dex-trades", tgmDexTrades, basic, "Nansen: TGM DEX trades", "/nansen/tgm/dex-trades");
  route(router, "/tgm/flows", tgmFlows, basic, "Nansen: TGM flows", "/nansen/tgm/flows");
  route(router, "/tgm/perp-positions", tgmPerpPositions, basic, "Nansen: TGM perp positions", "/nansen/tgm/perp-positions");
  route(router, "/tgm/perp-trades", tgmPerpTrades, basic, "Nansen: TGM perp trades", "/nansen/tgm/perp-trades");

  // Premium — $0.05
  route(router, "/profiler/address/counterparties", profilerAddressCounterparties, premium, "Nansen: address counterparties", "/nansen/profiler/address/counterparties");
  route(router, "/tgm/holders", tgmHolders, premium, "Nansen: TGM holders", "/nansen/tgm/holders");
  route(router, "/tgm/pnl-leaderboard", tgmPnlLeaderboard, premium, "Nansen: TGM PnL leaderboard", "/nansen/tgm/pnl-leaderboard");
  route(router, "/tgm/perp-pnl-leaderboard", tgmPerpPnlLeaderboard, premium, "Nansen: TGM perp PnL leaderboard", "/nansen/tgm/perp-pnl-leaderboard");
  route(router, "/perp-leaderboard", perpLeaderboard, premium, "Nansen: perp leaderboard", "/nansen/perp-leaderboard");

  // Smart Money — $0.05
  route(router, "/smart-money/netflow", smartMoneyNetflow, premium, "Nansen: smart money net flow", "/nansen/smart-money/netflow");
  route(router, "/smart-money/holdings", smartMoneyHoldings, premium, "Nansen: smart money holdings", "/nansen/smart-money/holdings");
  route(router, "/smart-money/dex-trades", smartMoneyDexTrades, premium, "Nansen: smart money DEX trades", "/nansen/smart-money/dex-trades");
  route(router, "/smart-money/historical-holdings", smartMoneyHistoricalHoldings, premium, "Nansen: smart money historical holdings", "/nansen/smart-money/historical-holdings");
  route(router, "/smart-money/dcas", smartMoneyDcas, premium, "Nansen: smart money DCAs", "/nansen/smart-money/dcas");

  return router;
}
