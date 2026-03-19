/**
 * Public Tempo reference data for the AI agent (no auth, no payouts).
 * Sources: https://docs.tempo.xyz/quickstart/connection-details and https://docs.tempo.xyz/quickstart/tokenlist
 */

const TOKENLIST_BASE = "https://tokenlist.tempo.xyz";
const FETCH_TIMEOUT_MS = 15_000;

/** Allowed chain IDs for official token list JSON. */
export const TEMPO_TOKENLIST_CHAIN_IDS = ["4217", "42431"];

/**
 * Static network + docs URLs (for agent tool `tempo-network-info`).
 * @type {{
 *   mainnet: Record<string, string | number>;
 *   testnet: Record<string, string | number>;
 *   tokenList: Record<string, string>;
 *   documentation: Record<string, string>;
 * }}
 */
export const TEMPO_PUBLIC_REFERENCE = {
  mainnet: {
    name: "Tempo Mainnet (Presto)",
    chainId: 4217,
    httpRpc: "https://rpc.tempo.xyz",
    wsRpc: "wss://rpc.tempo.xyz",
    explorer: "https://explore.tempo.xyz",
  },
  testnet: {
    name: "Tempo Testnet (Moderato)",
    chainId: 42431,
    httpRpc: "https://rpc.moderato.tempo.xyz",
    wsRpc: "wss://rpc.moderato.tempo.xyz",
    explorer: "https://explore.testnet.tempo.xyz",
  },
  tokenList: {
    mainnetJson: `${TOKENLIST_BASE}/list/4217`,
    testnetJson: `${TOKENLIST_BASE}/list/42431`,
    docs: "https://docs.tempo.xyz/quickstart/tokenlist",
    openApi: `${TOKENLIST_BASE}/docs`,
    assetExample: `${TOKENLIST_BASE}/asset/4217/pathUSD`,
    iconExample: `${TOKENLIST_BASE}/icon/4217/0x20c0000000000000000000000000000000000000`,
  },
  documentation: {
    home: "https://docs.tempo.xyz",
    connectionDetails: "https://docs.tempo.xyz/quickstart/connection-details",
    payments: "https://docs.tempo.xyz/guide/payments",
    tip20: "https://docs.tempo.xyz/learn/tempo/native-stablecoins",
  },
};

/**
 * Fetch Uniswap Token Lists JSON from Tempo’s public registry.
 * @param {string} chainId - "4217" | "42431"
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: string, status?: number }>}
 */
export async function fetchTempoTokenList(chainId) {
  const id = String(chainId || "").trim();
  if (!TEMPO_TOKENLIST_CHAIN_IDS.includes(id)) {
    return {
      ok: false,
      error: `Invalid chainId. Use one of: ${TEMPO_TOKENLIST_CHAIN_IDS.join(", ")}`,
    };
  }
  const url = `${TOKENLIST_BASE}/list/${id}`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Syra-API/1.0" },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) {
      return {
        ok: false,
        error: `Token list HTTP ${res.status}`,
        status: res.status,
      };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    const msg = e?.name === "AbortError" ? "Request timed out" : e?.message || String(e);
    return { ok: false, error: msg };
  }
}
