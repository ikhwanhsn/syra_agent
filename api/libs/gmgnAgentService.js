/**
 * GMGN OpenAPI for the Syra agent (https://github.com/GMGNAI/gmgn-skills, npm: gmgn-cli).
 * Uses OpenApiClient with env from the API server — do not import gmgn-cli `config.js` (it calls process.exit).
 */
import { OpenApiClient } from "gmgn-cli/dist/client/OpenApiClient.js";
import { enrichGmgnToolParams } from "./gmgnToolParams.js";

/** @type {import("gmgn-cli/dist/client/OpenApiClient.js").OpenApiClient | null} */
let cachedClient = null;
let cachedKeySig = "";

/**
 * @returns {OpenApiClient | null}
 */
function getGmgnClient() {
  const apiKey = process.env.GMGN_API_KEY?.trim();
  if (!apiKey) return null;
  const privateKey = process.env.GMGN_PRIVATE_KEY;
  const privateKeyPem = privateKey ? String(privateKey).replace(/\\n/g, "\n") : undefined;
  const host = (process.env.GMGN_HOST || "https://openapi.gmgn.ai").replace(/\/$/, "");
  const sig = `${apiKey.slice(0, 8)}|${privateKeyPem ? "1" : "0"}|${host}`;
  if (cachedClient && sig === cachedKeySig) {
    return cachedClient;
  }
  cachedKeySig = sig;
  cachedClient = new OpenApiClient({ apiKey, privateKeyPem, host });
  return cachedClient;
}

function notConfigured() {
  return {
    ok: false,
    error:
      "GMGN is not configured. Set GMGN_API_KEY in the API environment. Create a key at https://gmgn.ai/ai (see https://github.com/GMGNAI/gmgn-skills).",
    status: 503,
  };
}

/**
 * Kline `from`/`to` may be Unix seconds (API expects ms) or already ms.
 * @param {string | undefined} raw
 * @returns {number | undefined}
 */
function parseKlineTimeMs(raw) {
  if (raw == null || String(raw).trim() === "") return undefined;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return undefined;
  if (n > 1_000_000_000_000) return Math.floor(n);
  return Math.floor(n * 1000);
}

/**
 * @param {string | undefined} s
 * @param {string} [sep]
 * @returns {string[]}
 */
function splitList(s, sep = ",") {
  if (s == null || String(s).trim() === "") return [];
  return String(s)
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Same keys as gmgn-cli trenches presets (server-side filter names). */
const TRENCHES_FILTER_PRESETS = {
  safe: {
    max_rug_ratio: 0.3,
    max_bundler_rate: 0.3,
    max_insider_ratio: 0.3,
  },
  "smart-money": {
    min_smart_degen_count: 1,
  },
  strict: {
    max_rug_ratio: 0.3,
    max_bundler_rate: 0.3,
    max_insider_ratio: 0.3,
    min_smart_degen_count: 1,
    min_volume_24h: 1000,
  },
};

const TRENCHES_STRING_NUMERIC_FIELDS = new Set([
  "usd_market_cap",
  "liquidity",
  "volume_1h",
  "volume_24h",
]);
const TRENCHES_SORT_ASC_DEFAULTS = new Set(["rug_ratio"]);

/**
 * @param {unknown[]} items
 * @param {string} sortBy
 * @param {string} [direction]
 */
function sortTrenchesCategory(items, sortBy, direction) {
  const dir = direction || (TRENCHES_SORT_ASC_DEFAULTS.has(sortBy) ? "asc" : "desc");
  return [...items].sort((a, b) => {
    const aVal = TRENCHES_STRING_NUMERIC_FIELDS.has(sortBy)
      ? parseFloat(String(a[sortBy] ?? 0))
      : Number(a[sortBy] ?? 0);
    const bVal = TRENCHES_STRING_NUMERIC_FIELDS.has(sortBy)
      ? parseFloat(String(b[sortBy] ?? 0))
      : Number(b[sortBy] ?? 0);
    return dir === "asc" ? aVal - bVal : bVal - aVal;
  });
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} sortBy
 * @param {string} [direction]
 */
function sortTrenchesResult(data, sortBy, direction) {
  const result = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = Array.isArray(val) ? sortTrenchesCategory(val, sortBy, direction ?? "") : val;
  }
  return result;
}

/**
 * @param {string} toolId
 * @param {Record<string, string>} p
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: string, status?: number, httpStatus?: number }>}
 */
export async function runGmgnAgentTool(toolId, p) {
  const client = getGmgnClient();
  if (!client) {
    return notConfigured();
  }

  const params = enrichGmgnToolParams(toolId, p);

  try {
    switch (toolId) {
      case "gmgn-token-info": {
        if (!params.chain || !params.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenInfo(String(params.chain), String(params.address));
        return { ok: true, data };
      }
      case "gmgn-token-security": {
        if (!params.chain || !params.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenSecurity(String(params.chain), String(params.address));
        return { ok: true, data };
      }
      case "gmgn-token-pool": {
        if (!params.chain || !params.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenPoolInfo(String(params.chain), String(params.address));
        return { ok: true, data };
      }
      case "gmgn-token-holders": {
        if (!params.chain || !params.address) return { ok: false, error: "chain and address are required", status: 400 };
        const extra = {};
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.order_by || params.orderBy) extra.order_by = params.order_by || params.orderBy;
        if (params.direction) extra.direction = params.direction;
        if (params.tag) extra.tag = params.tag;
        const data = await client.getTokenTopHolders(String(params.chain), String(params.address), extra);
        return { ok: true, data };
      }
      case "gmgn-token-traders": {
        if (!params.chain || !params.address) return { ok: false, error: "chain and address are required", status: 400 };
        const extra = {};
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.order_by || params.orderBy) extra.order_by = params.order_by || params.orderBy;
        if (params.direction) extra.direction = params.direction;
        if (params.tag) extra.tag = params.tag;
        const data = await client.getTokenTopTraders(String(params.chain), String(params.address), extra);
        return { ok: true, data };
      }
      case "gmgn-market-trending": {
        if (!params.chain || !params.interval) return { ok: false, error: "chain and interval are required", status: 400 };
        const extra = {};
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.order_by || params.orderBy) extra.order_by = params.order_by || params.orderBy;
        if (params.direction) extra.direction = params.direction;
        const filters = splitList(params.filters);
        if (filters.length) extra.filters = filters;
        const plats = splitList(params.platforms);
        if (plats.length) extra.platforms = plats;
        const data = await client.getTrendingSwaps(String(params.chain), String(params.interval), extra);
        return { ok: true, data };
      }
      case "gmgn-market-kline": {
        if (!params.chain || !params.address || !params.resolution) {
          return { ok: false, error: "chain, address, and resolution are required", status: 400 };
        }
        const from = parseKlineTimeMs(params.from);
        const to = parseKlineTimeMs(params.to);
        const data = await client.getTokenKline(
          String(params.chain),
          String(params.address),
          String(params.resolution),
          from,
          to
        );
        return { ok: true, data };
      }
      case "gmgn-market-trenches": {
        if (!params.chain) return { ok: false, error: "chain is required", status: 400 };
        const types = params.type || params.types ? splitList(String(params.type || params.types)) : [];
        const launchpadPlatform = params.launchpad_platform
          ? splitList(params.launchpad_platform)
          : splitList(params.launchpadPlatform);
        const limit = params.limit != null && params.limit !== "" ? parseInt(String(params.limit), 10) : undefined;
        const presetKey = params.filterPreset || params.filter_preset;
        /** @type {Record<string, unknown>} */
        let filters = {};
        if (presetKey) {
          const pr = TRENCHES_FILTER_PRESETS[String(presetKey)];
          if (!pr) {
            return { ok: false, error: `filterPreset must be one of: safe, smart-money, strict`, status: 400 };
          }
          Object.assign(filters, pr);
        }
        if (params.filters) {
          try {
            const parsed = JSON.parse(String(params.filters));
            if (parsed && typeof parsed === "object") {
              Object.assign(filters, parsed);
            }
          } catch {
            return { ok: false, error: "filters must be valid JSON object (optional extra server-side keys)", status: 400 };
          }
        }
        const data = await client.getTrenches(
          String(params.chain),
          types,
          launchpadPlatform,
          limit,
          Object.keys(filters).length ? filters : undefined
        );
        const sortBy = params.sortBy || params.sort_by;
        const sortDir = params.sortDirection || params.sort_direction;
        const result = sortBy ? sortTrenchesResult(data, String(sortBy), String(sortDir || "")) : data;
        return { ok: true, data: result };
      }
      case "gmgn-market-signal": {
        if (!params.chain) return { ok: false, error: "chain is required", status: 400 };
        const c = String(params.chain);
        if (c !== "sol" && c !== "bsc") {
          return { ok: false, error: "chain must be sol or bsc for token signals", status: 400 };
        }
        let groups;
        if (params.groups) {
          try {
            groups = JSON.parse(String(params.groups));
            if (!Array.isArray(groups)) throw new Error("not array");
          } catch {
            return { ok: false, error: "groups must be a JSON array (see GMGN token_signal API)", status: 400 };
          }
        } else {
          const st = params.signal_type || params.signalType;
          const types = st ? splitList(String(st), ",") : [];
          const group = {};
          if (types.length) {
            group.signal_type = types.map((x) => parseInt(x, 10));
          }
          if (params.mcMin != null) group.mc_min = parseFloat(String(params.mcMin));
          if (params.mcMax != null) group.mc_max = parseFloat(String(params.mcMax));
          groups = [group];
        }
        const data = await client.getTokenSignalV2(c, groups);
        return { ok: true, data };
      }
      case "gmgn-portfolio-holdings": {
        if (!params.chain || !params.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.cursor) extra.cursor = params.cursor;
        if (params.order_by || params.orderBy) extra.order_by = params.order_by || params.orderBy;
        if (params.direction) extra.direction = params.direction;
        if (params.interval) extra.interval = params.interval;
        if (params.hide_abnormal != null) extra.hide_abnormal = params.hide_abnormal;
        if (params.hide_airdrop != null) extra.hide_airdrop = params.hide_airdrop;
        if (params.hide_closed != null) extra.hide_closed = params.hide_closed;
        if (params.hide_open) extra.hide_open = "true";
        if (params.tx30d) extra.tx30d = "true";
        const data = await client.getWalletHoldings(String(params.chain), String(params.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-portfolio-activity": {
        if (!params.chain || !params.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (params.token) extra.token_address = params.token;
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.cursor) extra.cursor = params.cursor;
        const t = params.type;
        if (t) {
          const types = splitList(String(t), ",");
          if (types.length) extra.type = types;
        }
        const data = await client.getWalletActivity(String(params.chain), String(params.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-portfolio-stats": {
        if (!params.chain || !params.wallet) return { ok: false, error: "chain and wallet are required (comma-separate for multiple)", status: 400 };
        const chain = String(params.chain);
        const parts = splitList(params.wallet, ",");
        const period = params.period && String(params.period).trim() !== "" ? String(params.period) : "7d";
        const walletParam = parts.length > 1 ? parts : String(params.wallet).trim();
        const data = await client.getWalletStats(chain, walletParam, period);
        return { ok: true, data };
      }
      case "gmgn-portfolio-info": {
        const data = await client.getUserInfo();
        return { ok: true, data };
      }
      case "gmgn-portfolio-token-balance": {
        if (!params.chain || !params.wallet || !params.token) {
          return { ok: false, error: "chain, wallet, and token are required", status: 400 };
        }
        const data = await client.getWalletTokenBalance(String(params.chain), String(params.wallet), String(params.token));
        return { ok: true, data };
      }
      case "gmgn-portfolio-created-tokens": {
        if (!params.chain || !params.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (params.order_by || params.orderBy) extra.order_by = params.order_by || params.orderBy;
        if (params.direction) extra.direction = params.direction;
        if (params.migrate_state || params.migrateState) extra.migrate_state = params.migrate_state || params.migrateState;
        const data = await client.getCreatedTokens(String(params.chain), String(params.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-track-kol": {
        const chain = params.chain && String(params.chain).trim() !== "" ? String(params.chain) : undefined;
        const limit = params.limit != null && params.limit !== "" ? parseInt(String(params.limit), 10) : undefined;
        const data = await client.getKol(chain, limit);
        if (params.side && data && typeof data === "object" && "list" in data && Array.isArray(data.list)) {
          return {
            ok: true,
            data: { ...data, list: data.list.filter((item) => item && item.side === params.side) },
          };
        }
        return { ok: true, data };
      }
      case "gmgn-track-smartmoney": {
        const chain = params.chain && String(params.chain).trim() !== "" ? String(params.chain) : undefined;
        const limit = params.limit != null && params.limit !== "" ? parseInt(String(params.limit), 10) : undefined;
        const data = await client.getSmartMoney(chain, limit);
        if (params.side && data && typeof data === "object" && "list" in data && Array.isArray(data.list)) {
          return {
            ok: true,
            data: { ...data, list: data.list.filter((item) => item && item.side === params.side) },
          };
        }
        return { ok: true, data };
      }
      case "gmgn-track-follow-wallet": {
        if (!params.chain) return { ok: false, error: "chain is required", status: 400 };
        if (!process.env.GMGN_PRIVATE_KEY) {
          return {
            ok: false,
            error: "GMGN_PRIVATE_KEY is required for follow-wallet (critical auth). See https://github.com/GMGNAI/gmgn-skills",
            status: 403,
          };
        }
        const extra = {};
        if (params.wallet) extra.wallet_address = params.wallet;
        if (params.limit != null && params.limit !== "") extra.limit = parseInt(String(params.limit), 10);
        if (params.side) extra.side = params.side;
        const filters = params.filters ? splitList(params.filters) : [];
        if (filters.length) extra.filters = filters;
        if (params.min_amount_usd != null) extra.min_amount_usd = parseFloat(String(params.min_amount_usd));
        if (params.max_amount_usd != null) extra.max_amount_usd = parseFloat(String(params.max_amount_usd));
        const data = await client.getFollowWallet(String(params.chain), extra);
        return { ok: true, data };
      }
      default:
        return { ok: false, error: `Unknown GMGN tool: ${toolId}`, status: 400 };
    }
  } catch (err) {
    const o = err && typeof err === "object" ? err : null;
    const fromApi = o && "apiMessage" in o && typeof o.apiMessage === "string" && o.apiMessage.trim() ? o.apiMessage.trim() : "";
    const text = fromApi || (err instanceof Error ? err.message : "GMGN request failed");
    return { ok: false, error: text, status: 502 };
  }
}
