/**
 * Agent-only execution for partners removed from public HTTP (Binance, Giza, Bankr, Neynar, SIWA).
 * Invoked from POST /agent/tools/call when tool.agentDirect is true.
 */
import {
  BINANCE_CORRELATION_TICKER,
  computeCorrelationFromOHLC,
} from "../routes/partner/binance/correlation.js";
import { fetchBinanceOhlcBatch } from "./binanceOhlcBatch.js";
import {
  fetchBinanceSpotPublic,
  getBinanceSpotSigned,
  postBinanceSpotSigned,
  deleteBinanceSpotSigned,
} from "./binanceSpotClient.js";
import { getGiza, getAgentByOwner, hasGizaCredentials } from "./gizaClient.js";
import { getBalances, submitPrompt, getJob, cancelJob, bankrConfig } from "./bankrClient.js";
import {
  getUsersByFids,
  getUserByUsername,
  getFeed,
  getCast,
  searchCasts,
  neynarConfig,
} from "./neynarClient.js";
import { runSiwaNonce, runSiwaVerify } from "./siwaAgentService.js";

function binanceCreds(params) {
  const fromEnv =
    process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET
      ? {
          apiKey: process.env.BINANCE_API_KEY.trim(),
          secret: process.env.BINANCE_API_SECRET.trim(),
        }
      : null;
  if (params.apiKey && params.apiSecret) {
    return { apiKey: String(params.apiKey).trim(), secret: String(params.apiSecret).trim() };
  }
  return fromEnv;
}

async function binanceCorrelation(params) {
  const symbol = (params.symbol || "BTCUSDT").toUpperCase();
  const limit = parseInt(params.limit || "10", 10) || 10;
  const ohlcPayload = await fetchBinanceOhlcBatch(BINANCE_CORRELATION_TICKER, "1m");
  const matrix = computeCorrelationFromOHLC(ohlcPayload);
  if (!matrix || typeof matrix !== "object") {
    const results = ohlcPayload?.results || [];
    const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
    const failed = results.filter((r) => !r?.success);
    const firstError =
      failed[0]?.error ||
      (results.length === 0 ? "No OHLC results returned" : "All symbols failed or insufficient data");
    return {
      ok: false,
      error: `No correlation data: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
      status: 502,
    };
  }
  if (!matrix[symbol]) {
    return { ok: false, error: "Symbol not found", status: 404 };
  }
  const ranked = Object.entries(matrix[symbol])
    .filter(([s]) => s !== symbol)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit);
  if (ranked.length === 0) {
    return { ok: false, error: "No correlation found", status: 404 };
  }
  return {
    ok: true,
    data: {
      symbol,
      top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
    },
  };
}

/**
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @param {{ host?: string }} [opts]
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: string, status?: number }>}
 */
export async function runAgentPartnerDirectTool(toolId, params, opts = {}) {
  const host = opts.host;

  try {
    switch (toolId) {
      case "binance-correlation":
        return await binanceCorrelation(params);

      case "binance-ticker-24h": {
        const symbol = params.symbol || "";
        const data = await fetchBinanceSpotPublic("ticker/24hr", symbol ? { symbol: symbol.toUpperCase() } : {});
        return { ok: true, data };
      }

      case "binance-orderbook": {
        const symbol = (params.symbol || "BTCUSDT").toUpperCase();
        const validLimits = [5, 10, 20, 50, 100, 500, 1000];
        const requestedLimit = parseInt(params.limit, 10) || 100;
        const limit = validLimits.includes(requestedLimit)
          ? requestedLimit
          : validLimits.reduce((best, l) => (l <= requestedLimit ? l : best), 5);
        const data = await fetchBinanceSpotPublic("depth", { symbol, limit: String(limit) });
        return { ok: true, data };
      }

      case "binance-exchange-info": {
        const query = {};
        if (params.symbol) query.symbol = params.symbol.toUpperCase();
        if (params.symbols) query.symbols = params.symbols;
        const data = await fetchBinanceSpotPublic("exchangeInfo", query);
        return { ok: true, data };
      }

      case "binance-spot-account": {
        const creds = binanceCreds(params);
        if (!creds) {
          return {
            ok: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or pass apiKey and apiSecret in params.",
            status: 400,
          };
        }
        const data = await getBinanceSpotSigned(creds.apiKey, creds.secret, "account", {});
        return { ok: true, data };
      }

      case "binance-spot-order": {
        const creds = binanceCreds(params);
        if (!creds) {
          return {
            ok: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or pass apiKey and apiSecret in params.",
            status: 400,
          };
        }
        const symbol = (params.symbol || "").toUpperCase();
        if (!symbol) return { ok: false, error: "symbol is required (e.g. BTCUSDT)", status: 400 };
        const body = {
          symbol,
          side: (params.side || "BUY").toUpperCase(),
          type: (params.type || "MARKET").toUpperCase(),
        };
        if (params.quantity != null && params.quantity !== "") body.quantity = params.quantity;
        if (params.quoteOrderQty != null && params.quoteOrderQty !== "") body.quoteOrderQty = params.quoteOrderQty;
        if (params.price != null && params.price !== "") body.price = params.price;
        if (params.timeInForce != null && params.timeInForce !== "") body.timeInForce = params.timeInForce;
        if (params.newClientOrderId != null && params.newClientOrderId !== "")
          body.newClientOrderId = params.newClientOrderId;
        if (params.stopPrice != null && params.stopPrice !== "") body.stopPrice = params.stopPrice;
        if (params.icebergQty != null && params.icebergQty !== "") body.icebergQty = params.icebergQty;
        const data = await postBinanceSpotSigned(creds.apiKey, creds.secret, "order", body);
        return { ok: true, data };
      }

      case "binance-spot-order-cancel": {
        const creds = binanceCreds(params);
        if (!creds) {
          return {
            ok: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or pass apiKey and apiSecret in params.",
            status: 400,
          };
        }
        const symbol = (params.symbol || "").toUpperCase();
        if (!symbol) return { ok: false, error: "symbol is required (e.g. BTCUSDT)", status: 400 };
        const body = { symbol };
        if (params.orderId != null && params.orderId !== "") body.orderId = params.orderId;
        if (params.origClientOrderId != null && params.origClientOrderId !== "")
          body.origClientOrderId = params.origClientOrderId;
        if (!body.orderId && !body.origClientOrderId) {
          return { ok: false, error: "Either orderId or origClientOrderId is required", status: 400 };
        }
        const data = await deleteBinanceSpotSigned(creds.apiKey, creds.secret, "order", body);
        return { ok: true, data };
      }

      case "giza-protocols": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const token = params.token && String(params.token).trim();
        if (!token || !token.startsWith("0x")) {
          return { ok: false, error: "Query parameter token (0x...) is required", status: 400 };
        }
        const giza = await getGiza();
        if (!giza) return { ok: false, error: "Giza SDK init failed", status: 502 };
        const { protocols } = await giza.protocols(token);
        return { ok: true, data: { success: true, protocols } };
      }

      case "giza-agent": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        if (!owner || !owner.startsWith("0x")) {
          return { ok: false, error: "Query parameter owner (0x...) is required", status: 400 };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get or create Giza agent", status: 502 };
        return { ok: true, data: { success: true, wallet: agent.wallet } };
      }

      case "giza-portfolio":
      case "giza-apr":
      case "giza-performance":
      case "giza-run": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        if (!owner || !owner.startsWith("0x")) {
          return { ok: false, error: "owner (0x...) is required", status: 400 };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get Giza agent", status: 502 };
        if (toolId === "giza-portfolio") {
          const info = await agent.portfolio();
          return { ok: true, data: { success: true, ...info } };
        }
        if (toolId === "giza-apr") {
          const data = await agent.apr();
          return { ok: true, data: { success: true, ...data } };
        }
        if (toolId === "giza-performance") {
          const data = await agent.performance();
          return { ok: true, data: { success: true, ...data } };
        }
        await agent.run();
        return { ok: true, data: { success: true, message: "Optimization run triggered" } };
      }

      case "giza-activate": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        const token = params.token && String(params.token).trim();
        const txHash = params.txHash && String(params.txHash).trim();
        const rawProto = params.protocols;
        let protocolList = [];
        if (rawProto) {
          try {
            const parsed = JSON.parse(String(rawProto));
            protocolList = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
          } catch {
            protocolList = String(rawProto)
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
          }
        }
        if (!owner || !token || !txHash || protocolList.length === 0) {
          return {
            ok: false,
            error: "owner, token, protocols (comma-separated or JSON array), and txHash are required",
            status: 400,
          };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get Giza agent", status: 502 };
        let constraintsVal;
        try {
          constraintsVal = params.constraints ? JSON.parse(params.constraints) : undefined;
        } catch {
          constraintsVal = undefined;
        }
        await agent.activate({
          owner,
          token,
          protocols: protocolList.map((p) => String(p)),
          txHash,
          constraints: Array.isArray(constraintsVal) ? constraintsVal : undefined,
        });
        return { ok: true, data: { success: true, message: "Agent activated" } };
      }

      case "giza-withdraw": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        if (!owner || !owner.startsWith("0x")) {
          return { ok: false, error: "owner (0x...) is required", status: 400 };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get Giza agent", status: 502 };
        const amount = params.amount != null && String(params.amount).trim() !== "" ? String(params.amount).trim() : undefined;
        await agent.withdraw(amount);
        return {
          ok: true,
          data: {
            success: true,
            message: amount ? "Partial withdrawal initiated" : "Full withdrawal (deactivation) initiated",
          },
        };
      }

      case "giza-top-up": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        const txHash = params.txHash && String(params.txHash).trim();
        if (!owner || !txHash) {
          return { ok: false, error: "owner and txHash are required", status: 400 };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get Giza agent", status: 502 };
        await agent.topUp(txHash);
        return { ok: true, data: { success: true, message: "Top-up recorded" } };
      }

      case "giza-update-protocols": {
        if (!hasGizaCredentials()) {
          return {
            ok: false,
            error: "Giza is not configured. Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME.",
            status: 503,
          };
        }
        const owner = params.owner && String(params.owner).trim();
        const rawProto = params.protocols;
        let protocolList = [];
        if (rawProto) {
          try {
            const parsed = JSON.parse(String(rawProto));
            protocolList = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
          } catch {
            protocolList = String(rawProto)
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
          }
        }
        if (!owner || protocolList.length === 0) {
          return { ok: false, error: "owner and protocols are required", status: 400 };
        }
        const agent = await getAgentByOwner(owner);
        if (!agent) return { ok: false, error: "Failed to get Giza agent", status: 502 };
        await agent.updateProtocols(protocolList);
        return { ok: true, data: { success: true, message: "Protocols updated" } };
      }

      case "bankr-balances": {
        if (!bankrConfig.configured) {
          return {
            ok: false,
            error: "Bankr not configured. Set BANKR_API_KEY (bk_...) in API .env.",
            status: 503,
          };
        }
        const result = await getBalances({ chains: params.chains });
        if (result.error) return { ok: false, error: result.error, status: 502 };
        return { ok: true, data: result.balances };
      }

      case "bankr-prompt": {
        if (!bankrConfig.configured) {
          return {
            ok: false,
            error: "Bankr not configured. Set BANKR_API_KEY (bk_...) in API .env.",
            status: 503,
          };
        }
        if (!params.prompt || !String(params.prompt).trim()) {
          return { ok: false, error: "prompt is required", status: 400 };
        }
        const body = {
          prompt: String(params.prompt).trim(),
          threadId: params.threadId ? String(params.threadId) : undefined,
        };
        const result = await submitPrompt(body);
        if (result.error) return { ok: false, error: result.error, status: 400 };
        return { ok: true, data: result, httpStatus: 202 };
      }

      case "bankr-job": {
        if (!bankrConfig.configured) {
          return {
            ok: false,
            error: "Bankr not configured. Set BANKR_API_KEY (bk_...) in API .env.",
            status: 503,
          };
        }
        const jobId = params.jobId || params.job_id;
        if (!jobId) return { ok: false, error: "jobId is required", status: 400 };
        const result = await getJob(String(jobId));
        if (result.error) return { ok: false, error: result.error, status: 404 };
        return { ok: true, data: result };
      }

      case "bankr-job-cancel": {
        if (!bankrConfig.configured) {
          return {
            ok: false,
            error: "Bankr not configured. Set BANKR_API_KEY (bk_...) in API .env.",
            status: 503,
          };
        }
        const jobId = params.jobId || params.job_id;
        if (!jobId) return { ok: false, error: "jobId is required", status: 400 };
        const result = await cancelJob(String(jobId));
        if (result.error) return { ok: false, error: result.error, status: 400 };
        return { ok: true, data: result };
      }

      case "neynar-user": {
        if (!neynarConfig.configured) {
          return {
            ok: false,
            error: "Neynar not configured. Set NEYNAR_API_KEY in API .env.",
            status: 503,
          };
        }
        if (params.fids) {
          const out = await getUsersByFids(params.fids.split(",").map(Number));
          if (out.error) return { ok: false, error: out.error, status: 502 };
          return { ok: true, data: out };
        }
        if (params.username) {
          const out = await getUserByUsername(params.username);
          if (out.error) return { ok: false, error: out.error, status: 502 };
          return { ok: true, data: out };
        }
        return { ok: false, error: "username or fids required", status: 400 };
      }

      case "neynar-feed": {
        if (!neynarConfig.configured) {
          return {
            ok: false,
            error: "Neynar not configured. Set NEYNAR_API_KEY in API .env.",
            status: 503,
          };
        }
        const out = await getFeed({
          feedType: params.feed_type || params.feedType,
          filterType: params.filter_type || params.filterType,
          fid: params.fid != null ? Number(params.fid) : undefined,
          channelId: params.channel_id || params.channelId,
          limit: params.limit != null ? Number(params.limit) : 25,
          cursor: params.cursor,
        });
        if (out.error) return { ok: false, error: out.error, status: 502 };
        return { ok: true, data: out };
      }

      case "neynar-cast": {
        if (!neynarConfig.configured) {
          return {
            ok: false,
            error: "Neynar not configured. Set NEYNAR_API_KEY in API .env.",
            status: 503,
          };
        }
        const id = params.identifier || params.hash;
        if (!id) return { ok: false, error: "identifier or hash required", status: 400 };
        const out = await getCast(id);
        if (out.error) return { ok: false, error: out.error, status: 502 };
        return { ok: true, data: out };
      }

      case "neynar-search": {
        if (!neynarConfig.configured) {
          return {
            ok: false,
            error: "Neynar not configured. Set NEYNAR_API_KEY in API .env.",
            status: 503,
          };
        }
        const q = params.q || params.query;
        if (!q) return { ok: false, error: "q required", status: 400 };
        const out = await searchCasts(q, {
          limit: params.limit != null ? Number(params.limit) : 20,
          channelId: params.channel_id || params.channelId,
          cursor: params.cursor,
        });
        if (out.error) return { ok: false, error: out.error, status: 502 };
        return { ok: true, data: out };
      }

      case "siwa-nonce":
        return runSiwaNonce(params);

      case "siwa-verify":
        return runSiwaVerify(params, host);

      default:
        return { ok: false, error: `Unknown agent-direct tool: ${toolId}`, status: 400 };
    }
  } catch (err) {
    return {
      ok: false,
      error: err?.message || "Partner direct tool failed",
      status: 502,
    };
  }
}
