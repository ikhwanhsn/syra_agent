/**
 * GMGN OpenAPI for the Syra agent (https://github.com/GMGNAI/gmgn-skills, npm: gmgn-cli).
 * Uses OpenApiClient with env from the API server — do not import gmgn-cli `config.js` (it calls process.exit).
 */
import { OpenApiClient } from "gmgn-cli/dist/client/OpenApiClient.js";

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

  try {
    switch (toolId) {
      case "gmgn-token-info": {
        if (!p.chain || !p.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenInfo(String(p.chain), String(p.address));
        return { ok: true, data };
      }
      case "gmgn-token-security": {
        if (!p.chain || !p.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenSecurity(String(p.chain), String(p.address));
        return { ok: true, data };
      }
      case "gmgn-token-pool": {
        if (!p.chain || !p.address) return { ok: false, error: "chain and address are required", status: 400 };
        const data = await client.getTokenPoolInfo(String(p.chain), String(p.address));
        return { ok: true, data };
      }
      case "gmgn-token-holders": {
        if (!p.chain || !p.address) return { ok: false, error: "chain and address are required", status: 400 };
        const extra = {};
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.order_by || p.orderBy) extra.order_by = p.order_by || p.orderBy;
        if (p.direction) extra.direction = p.direction;
        if (p.tag) extra.tag = p.tag;
        const data = await client.getTokenTopHolders(String(p.chain), String(p.address), extra);
        return { ok: true, data };
      }
      case "gmgn-token-traders": {
        if (!p.chain || !p.address) return { ok: false, error: "chain and address are required", status: 400 };
        const extra = {};
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.order_by || p.orderBy) extra.order_by = p.order_by || p.orderBy;
        if (p.direction) extra.direction = p.direction;
        if (p.tag) extra.tag = p.tag;
        const data = await client.getTokenTopTraders(String(p.chain), String(p.address), extra);
        return { ok: true, data };
      }
      case "gmgn-market-trending": {
        if (!p.chain || !p.interval) return { ok: false, error: "chain and interval are required", status: 400 };
        const extra = {};
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.order_by || p.orderBy) extra.order_by = p.order_by || p.orderBy;
        if (p.direction) extra.direction = p.direction;
        const filters = splitList(p.filters);
        if (filters.length) extra.filters = filters;
        const plats = splitList(p.platforms);
        if (plats.length) extra.platforms = plats;
        const data = await client.getTrendingSwaps(String(p.chain), String(p.interval), extra);
        return { ok: true, data };
      }
      case "gmgn-market-kline": {
        if (!p.chain || !p.address || !p.resolution) {
          return { ok: false, error: "chain, address, and resolution are required", status: 400 };
        }
        const from = p.from != null && p.from !== "" ? parseInt(String(p.from), 10) * 1000 : undefined;
        const to = p.to != null && p.to !== "" ? parseInt(String(p.to), 10) * 1000 : undefined;
        const data = await client.getTokenKline(String(p.chain), String(p.address), String(p.resolution), from, to);
        return { ok: true, data };
      }
      case "gmgn-market-trenches": {
        if (!p.chain) return { ok: false, error: "chain is required", status: 400 };
        const types = p.type || p.types ? splitList(String(p.type || p.types)) : [];
        const launchpadPlatform = p.launchpad_platform
          ? splitList(p.launchpad_platform)
          : splitList(p.launchpadPlatform);
        const limit = p.limit != null && p.limit !== "" ? parseInt(String(p.limit), 10) : undefined;
        const presetKey = p.filterPreset || p.filter_preset;
        /** @type {Record<string, unknown>} */
        let filters = {};
        if (presetKey) {
          const pr = TRENCHES_FILTER_PRESETS[String(presetKey)];
          if (!pr) {
            return { ok: false, error: `filterPreset must be one of: safe, smart-money, strict`, status: 400 };
          }
          Object.assign(filters, pr);
        }
        if (p.filters) {
          try {
            const parsed = JSON.parse(String(p.filters));
            if (parsed && typeof parsed === "object") {
              Object.assign(filters, parsed);
            }
          } catch {
            return { ok: false, error: "filters must be valid JSON object (optional extra server-side keys)", status: 400 };
          }
        }
        const data = await client.getTrenches(
          String(p.chain),
          types,
          launchpadPlatform,
          limit,
          Object.keys(filters).length ? filters : undefined
        );
        const sortBy = p.sortBy || p.sort_by;
        const sortDir = p.sortDirection || p.sort_direction;
        const result = sortBy ? sortTrenchesResult(data, String(sortBy), String(sortDir || "")) : data;
        return { ok: true, data: result };
      }
      case "gmgn-market-signal": {
        if (!p.chain) return { ok: false, error: "chain is required", status: 400 };
        const c = String(p.chain);
        if (c !== "sol" && c !== "bsc") {
          return { ok: false, error: "chain must be sol or bsc for token signals", status: 400 };
        }
        let groups;
        if (p.groups) {
          try {
            groups = JSON.parse(String(p.groups));
            if (!Array.isArray(groups)) throw new Error("not array");
          } catch {
            return { ok: false, error: "groups must be a JSON array (see GMGN token_signal API)", status: 400 };
          }
        } else {
          const st = p.signal_type || p.signalType;
          const types = st ? splitList(String(st), ",") : [];
          const group = {};
          if (types.length) {
            group.signal_type = types.map((x) => parseInt(x, 10));
          }
          if (p.mcMin != null) group.mc_min = parseFloat(String(p.mcMin));
          if (p.mcMax != null) group.mc_max = parseFloat(String(p.mcMax));
          groups = [group];
        }
        const data = await client.getTokenSignalV2(c, groups);
        return { ok: true, data };
      }
      case "gmgn-portfolio-holdings": {
        if (!p.chain || !p.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.cursor) extra.cursor = p.cursor;
        if (p.order_by || p.orderBy) extra.order_by = p.order_by || p.orderBy;
        if (p.direction) extra.direction = p.direction;
        if (p.interval) extra.interval = p.interval;
        if (p.hide_abnormal != null) extra.hide_abnormal = p.hide_abnormal;
        if (p.hide_airdrop != null) extra.hide_airdrop = p.hide_airdrop;
        if (p.hide_closed != null) extra.hide_closed = p.hide_closed;
        if (p.hide_open) extra.hide_open = "true";
        if (p.tx30d) extra.tx30d = "true";
        const data = await client.getWalletHoldings(String(p.chain), String(p.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-portfolio-activity": {
        if (!p.chain || !p.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (p.token) extra.token_address = p.token;
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.cursor) extra.cursor = p.cursor;
        const t = p.type;
        if (t) {
          const types = splitList(String(t), ",");
          if (types.length) extra.type = types;
        }
        const data = await client.getWalletActivity(String(p.chain), String(p.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-portfolio-stats": {
        if (!p.chain || !p.wallet) return { ok: false, error: "chain and wallet are required (comma-separate for multiple)", status: 400 };
        const chain = String(p.chain);
        const parts = splitList(p.wallet, ",");
        const period = p.period && String(p.period).trim() !== "" ? String(p.period) : "7d";
        const walletParam = parts.length > 1 ? parts : String(p.wallet).trim();
        const data = await client.getWalletStats(chain, walletParam, period);
        return { ok: true, data };
      }
      case "gmgn-portfolio-info": {
        const data = await client.getUserInfo();
        return { ok: true, data };
      }
      case "gmgn-portfolio-token-balance": {
        if (!p.chain || !p.wallet || !p.token) {
          return { ok: false, error: "chain, wallet, and token are required", status: 400 };
        }
        const data = await client.getWalletTokenBalance(String(p.chain), String(p.wallet), String(p.token));
        return { ok: true, data };
      }
      case "gmgn-portfolio-created-tokens": {
        if (!p.chain || !p.wallet) return { ok: false, error: "chain and wallet are required", status: 400 };
        const extra = {};
        if (p.order_by || p.orderBy) extra.order_by = p.order_by || p.orderBy;
        if (p.direction) extra.direction = p.direction;
        if (p.migrate_state || p.migrateState) extra.migrate_state = p.migrate_state || p.migrateState;
        const data = await client.getCreatedTokens(String(p.chain), String(p.wallet), extra);
        return { ok: true, data };
      }
      case "gmgn-track-kol": {
        const chain = p.chain && String(p.chain).trim() !== "" ? String(p.chain) : undefined;
        const limit = p.limit != null && p.limit !== "" ? parseInt(String(p.limit), 10) : undefined;
        const data = await client.getKol(chain, limit);
        if (p.side && data && typeof data === "object" && "list" in data && Array.isArray(data.list)) {
          return {
            ok: true,
            data: { ...data, list: data.list.filter((item) => item && item.side === p.side) },
          };
        }
        return { ok: true, data };
      }
      case "gmgn-track-smartmoney": {
        const chain = p.chain && String(p.chain).trim() !== "" ? String(p.chain) : undefined;
        const limit = p.limit != null && p.limit !== "" ? parseInt(String(p.limit), 10) : undefined;
        const data = await client.getSmartMoney(chain, limit);
        if (p.side && data && typeof data === "object" && "list" in data && Array.isArray(data.list)) {
          return {
            ok: true,
            data: { ...data, list: data.list.filter((item) => item && item.side === p.side) },
          };
        }
        return { ok: true, data };
      }
      case "gmgn-track-follow-wallet": {
        if (!p.chain) return { ok: false, error: "chain is required", status: 400 };
        if (!process.env.GMGN_PRIVATE_KEY) {
          return {
            ok: false,
            error: "GMGN_PRIVATE_KEY is required for follow-wallet (critical auth). See https://github.com/GMGNAI/gmgn-skills",
            status: 403,
          };
        }
        const extra = {};
        if (p.wallet) extra.wallet_address = p.wallet;
        if (p.limit != null && p.limit !== "") extra.limit = parseInt(String(p.limit), 10);
        if (p.side) extra.side = p.side;
        const filters = p.filters ? splitList(p.filters) : [];
        if (filters.length) extra.filters = filters;
        if (p.min_amount_usd != null) extra.min_amount_usd = parseFloat(String(p.min_amount_usd));
        if (p.max_amount_usd != null) extra.max_amount_usd = parseFloat(String(p.max_amount_usd));
        const data = await client.getFollowWallet(String(p.chain), extra);
        return { ok: true, data };
      }
      default:
        return { ok: false, error: `Unknown GMGN tool: ${toolId}`, status: 400 };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GMGN request failed",
      status: 502,
    };
  }
}
