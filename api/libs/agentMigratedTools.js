/**
 * Migrated agent-direct tool handlers. These replace the self-loop x402 HTTP routes
 * (formerly /exa-search, /crawl, /browser-use, /jupiter/swap/order, /quicknode/*, /8004scan/*,
 * /smart-money, /token-god-mode, /trending-jupiter, /bubblemaps/*, /squid/*, /heylol/*, /pumpfun/*) by running the underlying
 * clients directly in-process. The caller (runAgentPartnerDirectTool) performs the on-chain
 * USDC charge via chargeAgentForInternalTool; upstream API secrets stay server-side.
 *
 * Shape contract (matches runAgentPartnerDirectTool):
 *   { ok: true, data: unknown, httpStatus?: number } |
 *   { ok: false, error: string, status?: number }
 */
import axios from "axios";
import bs58 from "bs58";
import Exa from "exa-js";
import { getAgentKeypair } from "./agentWallet.js";
import {
  getCloudflareCrawlConfig,
  startCrawl,
  pollCrawlUntilComplete,
} from "./cloudflareCrawl.js";
import {
  getSolanaBalance,
  getSolanaTransactionStatus,
  getEvmBalance,
  getEvmTransactionStatus,
  rawRpc,
  quicknodeConfig,
} from "./quicknodeClient.js";
import {
  listAgents as scanListAgents,
  getAgent as scanGetAgent,
  searchAgents as scanSearchAgents,
  getAgentsByOwner as scanGetAgentsByOwner,
  getStats as scanGetStats,
  listFeedbacks as scanListFeedbacks,
  listChains as scanListChains,
} from "./8004scanClient.js";
import { payer, getSentinelPayerFetch, getNansenPaymentFetch } from "./sentinelPayer.js";
import { smartMoneyRequests } from "../request/nansen/smart-money.request.js";
import { tokenGodModeRequests } from "../request/nansen/token-god-mode.js";
import { createHeyLolClient, createHeyLolPaymentFetch } from "./heylol.js";
import {
  BUILD_ACCEPT_PREFLIGHT_PREFIX,
  buildAcceptPaymentTransactionBase64,
  verifyInvoicePaymentOnChain,
} from "./pumpfunAgentPaymentsSdk.js";
import { runBrowserTask } from "./browserUseClient.js";
import { run8004Stats, run8004Leaderboard, run8004AgentsSearch } from "./8004ReadApi.js";

const JUPITER_TRENDING_URL = "https://jupiter.api.corbits.dev/tokens/v2/content/cooking";
const JUPITER_ULTRA_ORDER_URL = "https://jupiter.api.corbits.dev/ultra/v1/order";
const BUBBLEMAPS_BASE = "https://api.bubblemaps.io";
const SQUID_ROUTE_URL = "https://v2.api.squidrouter.com/v2/route";
const SQUID_STATUS_URL = "https://v2.api.squidrouter.com/v2/status";
const FUN_BLOCK_BASE = (process.env.PUMP_FUN_BLOCK_URL || "https://fun-block.pump.fun").replace(/\/$/, "");
const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || "https://frontend-api-v3.pump.fun").replace(/\/$/, "");

const MAX_CRAWL_CONTENT_CHARS = 80_000;
const MAX_RECORDS_RESPONSE = 50;

function isLikelySolanaPubkey(s) {
  const t = String(s || "").trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

function parseUrlStrict(s) {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  try {
    new URL(t);
    return t;
  } catch {
    return null;
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "upstream_non_json", message: text.slice(0, 500) };
    }
  }
  return { ok: res.ok, status: res.status, data };
}

function getExaClient() {
  const key = (process.env.EXA_API_KEY || "").trim();
  if (!key) {
    throw new Error("EXA_API_KEY is not set");
  }
  return new Exa(key);
}

const EXA_SEARCH_OPTIONS = {
  numResults: 10,
  type: "auto",
  contents: { highlights: { maxCharacters: 4000 } },
};

async function handleExaSearch(params) {
  const query = (params.query ?? "").toString().trim();
  if (!query) return { ok: false, error: "query is required", status: 400 };
  try {
    const exa = getExaClient();
    const result = await exa.search(query, EXA_SEARCH_OPTIONS);
    return {
      ok: true,
      data: {
        query,
        results: result.results ?? [],
        autopromptString: result.autopromptString ?? null,
      },
    };
  } catch (err) {
    const message = err?.message ?? String(err);
    if (message.includes("EXA_API_KEY")) {
      return { ok: false, error: `EXA search is not configured: ${message}`, status: 503 };
    }
    return { ok: false, error: `EXA search failed: ${message}`, status: 502 };
  }
}

async function handleWebsiteCrawl(params) {
  const url = parseUrlStrict(params.url);
  if (!url) return { ok: false, error: "url is required (valid http(s) URL)", status: 400 };
  const config = getCloudflareCrawlConfig();
  if (!config) {
    return {
      ok: false,
      error: "Crawl is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.",
      status: 503,
    };
  }
  const limit = params.limit != null ? Number(params.limit) : undefined;
  const depth = params.depth != null ? Number(params.depth) : undefined;
  const renderRaw = params.render;
  const render = renderRaw === false || renderRaw === "false" ? false : true;
  try {
    const jobId = await startCrawl(config.accountId, config.apiToken, {
      url,
      limit,
      depth,
      formats: ["markdown"],
      render,
    });
    const result = await pollCrawlUntilComplete(config.accountId, config.apiToken, jobId, {
      maxAttempts: 24,
      delayMs: 5000,
    });
    if (result.status !== "completed") {
      return {
        ok: true,
        data: {
          jobId,
          status: result.status,
          total: result.total,
          finished: result.finished,
          records: [],
          message: `Crawl ended with status: ${result.status}`,
        },
      };
    }
    const records = Array.isArray(result.records) ? result.records : [];
    const limited = records.slice(0, MAX_RECORDS_RESPONSE);
    let totalChars = 0;
    const truncated = limited.map((r) => {
      const markdown = r.markdown ?? r.html ?? "";
      const title = r.metadata?.title ?? r.url ?? "";
      const allowed = Math.max(
        0,
        Math.floor((MAX_CRAWL_CONTENT_CHARS - totalChars) / Math.max(limited.length, 1)) - title.length - 50,
      );
      totalChars += title.length + 50;
      let content = markdown;
      if (allowed > 0 && content.length > allowed) {
        content = content.slice(0, allowed) + "\n\n[... truncated]";
      }
      totalChars += content.length;
      return { url: r.url, status: r.status, title, markdown: content };
    });
    return {
      ok: true,
      data: {
        jobId,
        status: result.status,
        total: result.total,
        finished: result.finished,
        records: truncated,
        truncated: records.length > MAX_RECORDS_RESPONSE,
      },
    };
  } catch (err) {
    const message = err?.message ?? String(err);
    if (message.includes("not configured") || message.includes("CLOUDFLARE")) {
      return { ok: false, error: `Crawl is not configured: ${message}`, status: 503 };
    }
    return { ok: false, error: `Crawl failed: ${message}`, status: 502 };
  }
}

function quicknodeMissing(chain) {
  return {
    ok: false,
    error: `Quicknode not configured for chain: ${chain}. Set QUICKNODE_SOLANA_RPC_URL and/or QUICKNODE_BASE_RPC_URL in API .env.`,
    status: 503,
  };
}

async function handleQuicknodeBalance(params) {
  const chain = String(params.chain || "").toLowerCase();
  const address = params.address && String(params.address).trim();
  if (!chain || !address) return { ok: false, error: "chain and address are required", status: 400 };
  if (chain !== "solana" && chain !== "base") {
    return { ok: false, error: "chain must be solana or base", status: 400 };
  }
  if (chain === "solana" && !quicknodeConfig.solana) return quicknodeMissing(chain);
  if (chain === "base" && !quicknodeConfig.base) return quicknodeMissing(chain);
  const result = chain === "solana" ? await getSolanaBalance(address) : await getEvmBalance(address);
  if (result.error) return { ok: false, error: result.error, status: 502 };
  return { ok: true, data: { chain, address, ...result } };
}

async function handleQuicknodeTransaction(params) {
  const chain = String(params.chain || "").toLowerCase();
  const signature = params.signature && String(params.signature).trim();
  const txHash = params.txHash && String(params.txHash).trim();
  if (!chain) return { ok: false, error: "chain is required", status: 400 };
  if (chain !== "solana" && chain !== "base") {
    return { ok: false, error: "chain must be solana or base", status: 400 };
  }
  if (chain === "solana" && !signature) return { ok: false, error: "signature is required for chain=solana", status: 400 };
  if (chain === "base" && !txHash) return { ok: false, error: "txHash is required for chain=base", status: 400 };
  if (chain === "solana" && !quicknodeConfig.solana) return quicknodeMissing(chain);
  if (chain === "base" && !quicknodeConfig.base) return quicknodeMissing(chain);
  const result = chain === "solana" ? await getSolanaTransactionStatus(signature) : await getEvmTransactionStatus(txHash);
  if (result.error) return { ok: false, error: result.error, status: 502 };
  return {
    ok: true,
    data: { chain, ...(chain === "solana" ? { signature } : { txHash }), ...result },
  };
}

async function handleQuicknodeRpc(params) {
  const chain = String(params.chain || "").toLowerCase();
  const method = params.method && String(params.method).trim();
  if (!chain || !method) return { ok: false, error: "chain and method are required", status: 400 };
  if (chain !== "solana" && chain !== "base") {
    return { ok: false, error: "chain must be solana or base", status: 400 };
  }
  if (chain === "solana" && !quicknodeConfig.solana) return quicknodeMissing(chain);
  if (chain === "base" && !quicknodeConfig.base) return quicknodeMissing(chain);
  let rpcParams;
  if (params.params == null) rpcParams = [];
  else if (Array.isArray(params.params)) rpcParams = params.params;
  else if (typeof params.params === "string") {
    try {
      const parsed = JSON.parse(params.params);
      rpcParams = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      rpcParams = [];
    }
  } else rpcParams = [params.params];
  const body = {
    jsonrpc: "2.0",
    id: params.id != null ? Number(params.id) || 1 : 1,
    method,
    params: rpcParams,
  };
  const data = await rawRpc(chain, body);
  if (data.error && !data.result) {
    return { ok: false, error: data.error.message || "RPC error", status: 502 };
  }
  return { ok: true, data };
}

function toNumber(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function handle8004scan(toolId, params) {
  try {
    if (toolId === "8004scan-stats") return { ok: true, data: await scanGetStats() };
    if (toolId === "8004scan-chains") return { ok: true, data: await scanListChains() };
    if (toolId === "8004scan-agents") {
      return {
        ok: true,
        data: await scanListAgents({
          page: toNumber(params.page),
          limit: toNumber(params.limit),
          chainId: toNumber(params.chainId),
          ownerAddress: params.ownerAddress || undefined,
          search: params.search || undefined,
          protocol: params.protocol || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
          isTestnet:
            params.isTestnet === "true" || params.isTestnet === true
              ? true
              : params.isTestnet === "false" || params.isTestnet === false
                ? false
                : undefined,
        }),
      };
    }
    if (toolId === "8004scan-agents-search") {
      const q = params.q || params.query;
      if (!q) return { ok: false, error: "q is required", status: 400 };
      return {
        ok: true,
        data: await scanSearchAgents({
          q: String(q).trim(),
          limit: toNumber(params.limit),
          chainId: toNumber(params.chainId),
          semanticWeight: toNumber(params.semanticWeight),
        }),
      };
    }
    if (toolId === "8004scan-agent") {
      const chainId = toNumber(params.chainId);
      const tokenId = toNumber(params.tokenId);
      if (chainId == null || tokenId == null) {
        return { ok: false, error: "chainId and tokenId are required", status: 400 };
      }
      return { ok: true, data: await scanGetAgent(chainId, tokenId) };
    }
    if (toolId === "8004scan-account-agents") {
      const address = (params.address || params.ownerAddress || "").toString().trim();
      if (!address) return { ok: false, error: "address is required", status: 400 };
      return {
        ok: true,
        data: await scanGetAgentsByOwner(address, {
          page: toNumber(params.page),
          limit: toNumber(params.limit),
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
        }),
      };
    }
    if (toolId === "8004scan-feedbacks") {
      return {
        ok: true,
        data: await scanListFeedbacks({
          page: toNumber(params.page),
          limit: toNumber(params.limit),
          chainId: toNumber(params.chainId),
          tokenId: toNumber(params.tokenId),
          minScore: toNumber(params.minScore),
          maxScore: toNumber(params.maxScore),
        }),
      };
    }
    return { ok: false, error: `Unknown 8004scan tool: ${toolId}`, status: 400 };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "8004scan call failed",
      status: e?.status || 502,
    };
  }
}

async function ensureSentinelPayer() {
  const key = (process.env.PAYER_KEYPAIR || "").trim();
  if (!key) throw new Error("PAYER_KEYPAIR must be set for Sentinel-paid upstream APIs");
  await payer.addLocalWallet(key);
}

async function handleTrendingJupiter() {
  try {
    await ensureSentinelPayer();
    const response = await getSentinelPayerFetch()(JUPITER_TRENDING_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Jupiter trending HTTP ${response.status}: ${text || response.statusText}`,
        status: 502,
      };
    }
    const data = await response.json();
    const contractAddresses = data?.data?.map((item) => item.mint);
    const content = data?.data?.map((item) => item.contents?.map((i) => i.content));
    const tokenSummary = data?.data?.map((item) => item.tokenSummary);
    const newsSummary = data?.data?.map((item) => item.newsSummary);
    return {
      ok: true,
      data: { contractAddresses, content, tokenSummary, newsSummary },
    };
  } catch (err) {
    return { ok: false, error: err?.message || "Jupiter trending failed", status: 502 };
  }
}

async function handleBubblemapsMaps(params) {
  const address = (params.address || "").toString().trim();
  if (!address) return { ok: false, error: "address is required (Solana token mint)", status: 400 };
  const key = (process.env.BUBBLEMAPS_API_KEY || "").trim();
  if (!key) return { ok: false, error: "BUBBLEMAPS_API_KEY is not set", status: 503 };
  try {
    const url = `${BUBBLEMAPS_BASE}/maps/solana/${encodeURIComponent(address)}?use_magic_nodes=true&return_clusters=true&return_decentralization_score=true`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-ApiKey": key },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Bubblemaps HTTP ${response.status}: ${text || response.statusText}`,
        status: 502,
      };
    }
    const data = await response.json();
    return { ok: true, data: { data } };
  } catch (err) {
    return { ok: false, error: err?.message || "Bubblemaps fetch failed", status: 502 };
  }
}

async function handleSquidRoute(params) {
  const integratorId = (process.env.SQUID_INTEGRATOR_ID || "").trim();
  if (!integratorId) return { ok: false, error: "SQUID_INTEGRATOR_ID is not set", status: 503 };
  const required = ["fromAddress", "fromChain", "fromToken", "fromAmount", "toChain", "toToken", "toAddress"];
  for (const k of required) {
    if (params[k] == null || params[k] === "") {
      return { ok: false, error: `Missing required field: ${k}`, status: 400 };
    }
  }
  const body = {
    fromAddress: String(params.fromAddress),
    fromChain: String(params.fromChain),
    fromToken: String(params.fromToken),
    fromAmount: String(params.fromAmount),
    toChain: String(params.toChain),
    toToken: String(params.toToken),
    toAddress: String(params.toAddress),
    slippage: params.slippage != null ? Number(params.slippage) : 1,
  };
  if (params.slippageConfig) {
    try {
      body.slippageConfig =
        typeof params.slippageConfig === "string"
          ? JSON.parse(params.slippageConfig)
          : params.slippageConfig;
    } catch {}
  }
  try {
    const response = await axios.post(SQUID_ROUTE_URL, body, {
      headers: { "x-integrator-id": integratorId, "Content-Type": "application/json" },
      timeout: 20000,
      validateStatus: () => true,
    });
    if (response.status !== 200) {
      const msg =
        response.data?.message ||
        response.data?.error ||
        response.statusText ||
        String(response.status);
      return { ok: false, error: `Squid route failed: ${msg}`, status: 502 };
    }
    const requestId = response.headers["x-request-id"] || null;
    return { ok: true, data: { ...response.data, requestId } };
  } catch (err) {
    return { ok: false, error: err?.message || "Squid route failed", status: 502 };
  }
}

async function handleSquidStatus(params) {
  const integratorId = (process.env.SQUID_INTEGRATOR_ID || "").trim();
  if (!integratorId) return { ok: false, error: "SQUID_INTEGRATOR_ID is not set", status: 503 };
  const { transactionId, requestId, fromChainId, toChainId, quoteId } = params;
  if (!transactionId || !requestId || !fromChainId || !toChainId) {
    return {
      ok: false,
      error: "Missing required query: transactionId, requestId, fromChainId, toChainId",
      status: 400,
    };
  }
  try {
    const response = await axios.get(SQUID_STATUS_URL, {
      params: {
        transactionId: String(transactionId),
        requestId: String(requestId),
        fromChainId: String(fromChainId),
        toChainId: String(toChainId),
        ...(quoteId && { quoteId: String(quoteId) }),
      },
      headers: { "x-integrator-id": integratorId },
      timeout: 10000,
      validateStatus: () => true,
    });
    if (response.status !== 200) {
      const msg =
        response.data?.message ||
        response.data?.error ||
        response.statusText ||
        String(response.status);
      return { ok: false, error: `Squid status failed: ${msg}`, status: 502 };
    }
    return { ok: true, data: response.data };
  } catch (err) {
    return { ok: false, error: err?.message || "Squid status failed", status: 502 };
  }
}

async function handleNansenSmartMoney() {
  try {
    const nansenFetch = await getNansenPaymentFetch();
    const responses = await Promise.all(
      smartMoneyRequests.map(({ url, payload }) =>
        nansenFetch(url, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ),
    );
    for (const response of responses) {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
          ok: false,
          error: `Nansen smart-money HTTP ${response.status}: ${text || response.statusText}`,
          status: 502,
        };
      }
    }
    const allData = await Promise.all(responses.map((r) => r.json()));
    return {
      ok: true,
      data: {
        "smart-money/netflow": allData[0],
        "smart-money/holdings": allData[1],
        "smart-money/historical-holdings": allData[2],
        "smart-money/dex-trades": allData[3],
        "smart-money/dcas": allData[4],
      },
    };
  } catch (err) {
    return { ok: false, error: err?.message || "Nansen smart-money failed", status: 502 };
  }
}

async function handleNansenTokenGodMode(params) {
  const tokenAddress = (params.tokenAddress || "").toString().trim();
  if (!tokenAddress) return { ok: false, error: "tokenAddress is required", status: 400 };
  try {
    const nansenFetch = await getNansenPaymentFetch();
    const responses = await Promise.all(
      tokenGodModeRequests.map(({ url, payload }) =>
        nansenFetch(url, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ token_address: tokenAddress, ...payload }),
        }),
      ),
    );
    for (const response of responses) {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
          ok: false,
          error: `Nansen token-god-mode HTTP ${response.status}: ${text || response.statusText}`,
          status: 502,
        };
      }
    }
    const allData = await Promise.all(responses.map((r) => r.json()));
    return {
      ok: true,
      data: {
        "flow-intelligence": allData[0],
        holders: allData[1],
        "flow-history": allData[2],
        "bought-and-sold-tokens": allData[3],
        "dex-trades": allData[4],
        transfers: allData[5],
        "jup-dcas": allData[6],
        "pnl-leaderboard": allData[7],
      },
    };
  } catch (err) {
    return { ok: false, error: err?.message || "Nansen token-god-mode failed", status: 502 };
  }
}

/**
 * Resolve a hey.lol paymentFetch: prefer env private key (shared Syra hey.lol agent) else agent wallet.
 * @param {string | undefined} anonymousId
 */
async function resolveHeyLolPaymentFetch(anonymousId) {
  const envKey = (process.env.HEYLOL_SOLANA_PRIVATE_KEY || "").trim();
  if (envKey) return createHeyLolPaymentFetch(envKey);
  if (anonymousId && typeof anonymousId === "string") {
    const keypair = await getAgentKeypair(anonymousId.trim());
    if (keypair && keypair.secretKey && keypair.secretKey.length === 64) {
      return createHeyLolPaymentFetch(bs58.encode(keypair.secretKey));
    }
  }
  return null;
}

function heylolResult(result) {
  if (!result) return { ok: false, error: "hey.lol returned empty result", status: 502 };
  const { ok, status, data } = result;
  if (status === 402) {
    return { ok: false, error: "hey.lol requires payment (upstream 402)", status: 402 };
  }
  if (!ok) {
    const msg = data?.error || data?.message || `hey.lol HTTP ${status}`;
    return { ok: false, error: msg, status: status && status >= 400 ? status : 502 };
  }
  return { ok: true, data };
}

async function handleHeylol(toolId, params) {
  const anonymousId = params.anonymousId ? String(params.anonymousId).trim() : undefined;
  const paymentFetch = await resolveHeyLolPaymentFetch(anonymousId);
  if (!paymentFetch) {
    return {
      ok: false,
      error:
        "hey.lol is not configured. Set HEYLOL_SOLANA_PRIVATE_KEY or ensure the user has a Solana agent wallet.",
      status: 503,
    };
  }
  const client = createHeyLolClient(paymentFetch);
  try {
    switch (toolId) {
      case "heylol-profile-me":
        return heylolResult(await client.getMe());
      case "heylol-feed":
        return heylolResult(await client.getFeed({ limit: params.limit, offset: params.offset }));
      case "heylol-feed-following":
        return heylolResult(
          await client.getFeedFollowing({ limit: params.limit, offset: params.offset }),
        );
      case "heylol-posts":
        return heylolResult(
          await client.getMyPosts({ limit: params.limit, offset: params.offset }),
        );
      case "heylol-search":
        if (!params.q) return { ok: false, error: "q is required", status: 400 };
        return heylolResult(
          await client.search({ q: params.q, type: params.type, limit: params.limit }),
        );
      case "heylol-suggestions":
        return heylolResult(await client.getSuggestions({ limit: params.limit }));
      case "heylol-notifications":
        return heylolResult(
          await client.getNotifications({
            limit: params.limit,
            cursor: params.cursor,
            unread_only: params.unread_only,
          }),
        );
      case "heylol-create-post": {
        const content = params.content && String(params.content).trim();
        if (!content) return { ok: false, error: "content is required", status: 400 };
        const body = {
          content,
          ...(params.media_urls ? { media_urls: params.media_urls } : {}),
          ...(params.gif_url ? { gif_url: params.gif_url } : {}),
          ...(params.video_url ? { video_url: params.video_url } : {}),
          ...(params.is_paywalled != null ? { is_paywalled: params.is_paywalled === true || params.is_paywalled === "true" } : {}),
          ...(params.paywall_price != null ? { paywall_price: Number(params.paywall_price) } : {}),
          ...(params.teaser ? { teaser: params.teaser } : {}),
          ...(params.quoted_post_id ? { quoted_post_id: params.quoted_post_id } : {}),
          ...(params.parent_id ? { parent_id: params.parent_id } : {}),
        };
        return heylolResult(await client.createPost(body));
      }
      default:
        return { ok: false, error: `Unknown hey.lol tool: ${toolId}`, status: 400 };
    }
  } catch (err) {
    return { ok: false, error: err?.message || "hey.lol call failed", status: 502 };
  }
}

function validateSwapBody(params) {
  const { inputMint, outputMint, amount, user } = params;
  if (!inputMint || !outputMint || amount == null || amount === "" || !user) {
    return { ok: false, error: "Missing required fields: inputMint, outputMint, amount, user" };
  }
  return { ok: true };
}

function validateCreateBody(params) {
  const { user, name, symbol, uri, solLamports } = params;
  if (!user || !name || !symbol || !uri || solLamports == null || solLamports === "") {
    return { ok: false, error: "Missing required fields: user, name, symbol, uri, solLamports" };
  }
  return { ok: true };
}

function validateCollectFeesBody(params) {
  const { mint, user } = params;
  if (!mint || !user) return { ok: false, error: "Missing required fields: mint, user" };
  if (!isLikelySolanaPubkey(mint) || !isLikelySolanaPubkey(user)) {
    return { ok: false, error: "mint and user must be valid base58 public keys" };
  }
  return { ok: true };
}

function validateSharingConfigBody(params) {
  const { mint, user } = params;
  let shareholders = params.shareholders;
  if (typeof shareholders === "string") {
    try {
      shareholders = JSON.parse(shareholders);
    } catch {
      return { ok: false, error: "shareholders must be JSON array of { address, bps }" };
    }
  }
  if (!mint || !user) return { ok: false, error: "Missing required fields: mint, user" };
  if (!isLikelySolanaPubkey(mint) || !isLikelySolanaPubkey(user)) {
    return { ok: false, error: "mint and user must be valid base58 public keys" };
  }
  if (!Array.isArray(shareholders) || shareholders.length === 0) {
    return { ok: false, error: "shareholders must be a non-empty array of { address, bps }" };
  }
  if (shareholders.length > 10) return { ok: false, error: "At most 10 shareholders" };
  let total = 0;
  const seen = new Set();
  for (const row of shareholders) {
    if (!row || typeof row !== "object") return { ok: false, error: "Invalid shareholder entry" };
    const addr = String(row.address || "").trim();
    const bps = Number(row.bps);
    if (!isLikelySolanaPubkey(addr)) return { ok: false, error: `Invalid shareholder address: ${addr}` };
    if (!Number.isFinite(bps) || bps < 0) return { ok: false, error: "Each shareholder needs integer bps >= 0" };
    if (seen.has(addr)) return { ok: false, error: "Duplicate shareholder address" };
    seen.add(addr);
    total += bps;
  }
  if (total !== 10000) return { ok: false, error: "Shareholder bps must sum exactly to 10000 (100%)" };
  return { ok: true, body: { ...params, shareholders } };
}

function validateBuildAcceptBody(params) {
  const { agentMint, user, currencyMint, amount, memo, startTime, endTime } = params;
  if (!agentMint || !user || !currencyMint || amount == null || memo == null || startTime == null || endTime == null) {
    return {
      ok: false,
      error: "Missing required fields: agentMint, user, currencyMint, amount, memo, startTime, endTime",
    };
  }
  if (!isLikelySolanaPubkey(agentMint) || !isLikelySolanaPubkey(user) || !isLikelySolanaPubkey(currencyMint)) {
    return { ok: false, error: "agentMint, user, and currencyMint must be valid base58 public keys" };
  }
  return { ok: true };
}

function validateVerifyInvoiceBody(params) {
  const { agentMint, user, currencyMint, amount, memo, startTime, endTime } = params;
  if (!agentMint || !user || !currencyMint) {
    return { ok: false, error: "Missing agentMint, user, or currencyMint" };
  }
  if (
    !Number.isFinite(Number(amount)) ||
    !Number.isFinite(Number(memo)) ||
    !Number.isFinite(Number(startTime)) ||
    !Number.isFinite(Number(endTime))
  ) {
    return { ok: false, error: "amount, memo, startTime, endTime must be numbers" };
  }
  if (!isLikelySolanaPubkey(agentMint) || !isLikelySolanaPubkey(user) || !isLikelySolanaPubkey(currencyMint)) {
    return { ok: false, error: "Invalid base58 public key in agentMint, user, or currencyMint" };
  }
  return {
    ok: true,
    body: {
      agentMint: String(agentMint).trim(),
      user: String(user).trim(),
      currencyMint: String(currencyMint).trim(),
      amount: Number(amount),
      memo: Number(memo),
      startTime: Number(startTime),
      endTime: Number(endTime),
    },
  };
}

async function proxyPumpfun(url, init) {
  const { ok, status, data } = await fetchJson(url, init);
  if (!ok) {
    const errMsg =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `pump.fun upstream error (HTTP ${status})`;
    return { ok: false, error: String(errMsg), status: status >= 400 ? status : 502 };
  }
  return { ok: true, data };
}

async function handlePumpfun(toolId, params) {
  try {
    if (toolId === "pumpfun-agents-swap") {
      const v = validateSwapBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      return proxyPumpfun(`${FUN_BLOCK_BASE}/agents/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(params),
      });
    }
    if (toolId === "pumpfun-agents-create-coin") {
      const v = validateCreateBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      return proxyPumpfun(`${FUN_BLOCK_BASE}/agents/create-coin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(params),
      });
    }
    if (toolId === "pumpfun-collect-fees") {
      const v = validateCollectFeesBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      return proxyPumpfun(`${FUN_BLOCK_BASE}/agents/collect-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(params),
      });
    }
    if (toolId === "pumpfun-sharing-config") {
      const v = validateSharingConfigBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      return proxyPumpfun(`${FUN_BLOCK_BASE}/agents/sharing-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
    }
    if (toolId === "pumpfun-coin" || toolId === "pumpfun-coin-query") {
      const mint = (params.mint || "").toString().trim();
      if (!mint || !isLikelySolanaPubkey(mint)) {
        return { ok: false, error: "Invalid or missing mint (base58)", status: 400 };
      }
      return proxyPumpfun(`${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    }
    if (toolId === "pumpfun-sol-price") {
      return proxyPumpfun(`${FRONTEND_API_BASE}/sol-price`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    }
    if (toolId === "pumpfun-agent-payments-build") {
      const v = validateBuildAcceptBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      try {
        const out = await buildAcceptPaymentTransactionBase64(params);
        return { ok: true, data: out };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.startsWith(BUILD_ACCEPT_PREFLIGHT_PREFIX)) {
          return { ok: false, error: msg.slice(BUILD_ACCEPT_PREFLIGHT_PREFIX.length), status: 400 };
        }
        if (/unavailable/i.test(msg)) return { ok: false, error: msg, status: 503 };
        return { ok: false, error: msg, status: 500 };
      }
    }
    if (toolId === "pumpfun-agent-payments-verify") {
      const v = validateVerifyInvoiceBody(params);
      if (!v.ok) return { ok: false, error: v.error, status: 400 };
      try {
        const out = await verifyInvoicePaymentOnChain(v.body);
        return { ok: true, data: out };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (/unavailable/i.test(msg)) return { ok: false, error: msg, status: 503 };
        return { ok: false, error: msg, status: 500 };
      }
    }
    return { ok: false, error: `Unknown pump.fun tool: ${toolId}`, status: 400 };
  } catch (err) {
    return { ok: false, error: err?.message || "pump.fun call failed", status: 502 };
  }
}

async function fetchJupiterUltraOrderJson(inputMint, outputMint, amount, taker) {
  await ensureSentinelPayer();
  const params = new URLSearchParams();
  params.set("inputMint", String(inputMint));
  params.set("outputMint", String(outputMint));
  params.set("amount", String(amount));
  params.set("taker", String(taker));
  const url = `${JUPITER_ULTRA_ORDER_URL}?${params}`;
  const response = await getSentinelPayerFetch()(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Jupiter order failed: HTTP ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

async function handleBrowserUse(params) {
  const apiKey = (process.env.BROWSER_USE_API_KEY || "").trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "Browser Use is not configured (BROWSER_USE_API_KEY)",
      status: 503,
    };
  }
  const task = (params.task ?? "").toString().trim();
  if (!task) return { ok: false, error: "task is required", status: 400 };
  const model = params.model === "bu-max" || params.model === "bu_max" ? "bu-max" : "bu-mini";
  let maxCostUsd;
  if (params.maxCostUsd != null && params.maxCostUsd !== "") {
    const n = Number(params.maxCostUsd);
    if (Number.isFinite(n)) maxCostUsd = n;
  }
  try {
    const result = await runBrowserTask(apiKey, { task, model, maxCostUsd });
    return {
      ok: true,
      data: {
        success: true,
        output: result.output,
        id: result.id,
        status: result.status,
        ...(result.liveUrl && { liveUrl: result.liveUrl }),
        ...(result.totalCostUsd != null && { totalCostUsd: result.totalCostUsd }),
        ...(result.error && { error: result.error }),
      },
    };
  } catch (err) {
    const message = err?.message ?? String(err);
    if (message.includes("not configured") || message.includes("API key")) {
      return { ok: false, error: `Browser Use is not configured: ${message}`, status: 503 };
    }
    if (message.includes("timed out")) {
      return { ok: false, error: `Task timed out: ${message}`, status: 504 };
    }
    return { ok: false, error: `Browser Use task failed: ${message}`, status: 500 };
  }
}

async function handleJupiterSwapOrder(params) {
  const inputMint = (params.inputMint ?? "").toString().trim();
  const outputMint = (params.outputMint ?? "").toString().trim();
  const amount = params.amount != null && params.amount !== "" ? String(params.amount) : "";
  const taker = (params.taker ?? "").toString().trim();
  if (!inputMint || !outputMint || !amount || !taker) {
    return {
      ok: false,
      error: "inputMint, outputMint, amount, and taker are required",
      status: 400,
    };
  }
  if (!(process.env.PAYER_KEYPAIR || "").trim()) {
    return { ok: false, error: "PAYER_KEYPAIR must be set for Jupiter Ultra (Sentinel payer)", status: 503 };
  }
  try {
    const data = await fetchJupiterUltraOrderJson(inputMint, outputMint, amount, taker);
    const out = { ...data };
    if (typeof out.transaction !== "string" && typeof out.swapTransaction === "string") {
      out.transaction = out.swapTransaction;
    }
    return { ok: true, data: out };
  } catch (err) {
    return { ok: false, error: err?.message || "Jupiter order failed", status: 502 };
  }
}

async function handle8004Tool(toolId, params) {
  const flat = /** @type {Record<string, string | number | boolean | undefined>} */ (params);
  try {
    if (toolId === "8004-stats") {
      const data = await run8004Stats();
      return { ok: true, data };
    }
    if (toolId === "8004-leaderboard") {
      const data = await run8004Leaderboard(flat);
      return { ok: true, data };
    }
    if (toolId === "8004-agents-search") {
      const data = await run8004AgentsSearch(flat);
      return { ok: true, data };
    }
    return { ok: false, error: `Unknown 8004 tool: ${toolId}`, status: 400 };
  } catch (e) {
    const st = typeof e?.status === "number" ? e.status : 502;
    return { ok: false, error: e?.message || "8004 read failed", status: st };
  }
}

/**
 * Set of tool IDs handled by this module. Used by agentPartnerDirectTools.js to delegate.
 */
export const MIGRATED_TOOL_IDS = new Set([
  "browser-use",
  "jupiter-swap-order",
  "8004-stats",
  "8004-leaderboard",
  "8004-agents-search",
  "exa-search",
  "website-crawl",
  "quicknode-balance",
  "quicknode-transaction",
  "quicknode-rpc",
  "8004scan-stats",
  "8004scan-chains",
  "8004scan-agents",
  "8004scan-agents-search",
  "8004scan-agent",
  "8004scan-account-agents",
  "8004scan-feedbacks",
  "trending-jupiter",
  "bubblemaps-maps",
  "squid-route",
  "squid-status",
  "smart-money",
  "token-god-mode",
  "heylol-profile-me",
  "heylol-feed",
  "heylol-feed-following",
  "heylol-posts",
  "heylol-search",
  "heylol-suggestions",
  "heylol-notifications",
  "heylol-create-post",
  "pumpfun-agents-swap",
  "pumpfun-agents-create-coin",
  "pumpfun-coin",
  "pumpfun-coin-query",
  "pumpfun-sol-price",
  "pumpfun-collect-fees",
  "pumpfun-sharing-config",
  "pumpfun-agent-payments-build",
  "pumpfun-agent-payments-verify",
]);

/**
 * Dispatch a migrated tool by id.
 * @param {string} toolId
 * @param {Record<string, unknown>} params
 * @returns {Promise<{ ok: true, data: unknown, httpStatus?: number } | { ok: false, error: string, status?: number }>}
 */
export async function runMigratedTool(toolId, params) {
  if (toolId === "browser-use") return handleBrowserUse(params);
  if (toolId === "jupiter-swap-order") return handleJupiterSwapOrder(params);
  if (toolId === "8004-stats" || toolId === "8004-leaderboard" || toolId === "8004-agents-search") {
    return handle8004Tool(toolId, params);
  }
  if (toolId === "exa-search") return handleExaSearch(params);
  if (toolId === "website-crawl") return handleWebsiteCrawl(params);
  if (toolId === "quicknode-balance") return handleQuicknodeBalance(params);
  if (toolId === "quicknode-transaction") return handleQuicknodeTransaction(params);
  if (toolId === "quicknode-rpc") return handleQuicknodeRpc(params);
  if (toolId.startsWith("8004scan-")) return handle8004scan(toolId, params);
  if (toolId === "trending-jupiter") return handleTrendingJupiter();
  if (toolId === "bubblemaps-maps") return handleBubblemapsMaps(params);
  if (toolId === "squid-route") return handleSquidRoute(params);
  if (toolId === "squid-status") return handleSquidStatus(params);
  if (toolId === "smart-money") return handleNansenSmartMoney();
  if (toolId === "token-god-mode") return handleNansenTokenGodMode(params);
  if (toolId.startsWith("heylol-")) return handleHeylol(toolId, params);
  if (toolId.startsWith("pumpfun-")) return handlePumpfun(toolId, params);
  return { ok: false, error: `Unknown migrated tool: ${toolId}`, status: 400 };
}
