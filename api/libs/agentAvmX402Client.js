/**
 * Agent x402 client for Algorand (AVM) — pay via GoPlausible facilitator.
 * Uses @x402-avm/fetch + registerExactAvmScheme so clients select Algorand accepts.
 */
import { toClientAvmSigner } from "@x402-avm/avm";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import { isAlgorandNetwork } from "../config/algorandX402Networks.js";

function trimEnv(name) {
  return String(process.env[name] || "").trim();
}

const DEFAULT_ALGOD_MAINNET = "https://mainnet-api.algonode.cloud";
const DEFAULT_ALGOD_TESTNET = "https://testnet-api.algonode.cloud";

/**
 * @x402-avm defaults to testnet Algod when algodUrl is omitted (library bug).
 * Pass explicit mainnet/testnet URL so signed tx genesis hash matches CAIP-2 network.
 * @returns {{ algodUrl: string, algodToken?: string }}
 */
function getAlgorandClientAlgodConfig() {
  const mainnetUrl = trimEnv("ALGOD_MAINNET_URL") || DEFAULT_ALGOD_MAINNET;
  const testnetUrl = trimEnv("ALGOD_TESTNET_URL") || DEFAULT_ALGOD_TESTNET;
  const token = trimEnv("ALGOD_TOKEN") || undefined;
  const preferred = trimEnv("X402_PREFERRED_NETWORK").toLowerCase();
  const networksFilter = trimEnv("X402_ALGORAND_NETWORKS").toLowerCase();

  const useTestnet =
    preferred === "algorand-testnet" ||
    networksFilter === "algorand-testnet" ||
    (networksFilter.includes("testnet") && !networksFilter.includes("mainnet"));

  return {
    algodUrl: useTestnet ? testnetUrl : mainnetUrl,
    ...(token ? { algodToken: token } : {}),
  };
}

/**
 * Base64 64-byte Algorand private key for paying agent (client side).
 * @returns {string | null}
 */
export function getAlgorandAgentPrivateKey() {
  return (
    trimEnv("ALGORAND_AGENT_PRIVATE_KEY") ||
    trimEnv("AVM_PRIVATE_KEY") ||
    trimEnv("ALGORAND_PRIVATE_KEY") ||
    null
  );
}

/**
 * Prefer Algorand payment requirement when server offers multiple networks.
 * @type {import('@x402-avm/core/client').SelectPaymentRequirements}
 */
export function selectAlgorandPaymentRequirements(_x402Version, paymentRequirements) {
  const list = Array.isArray(paymentRequirements) ? paymentRequirements : [];
  const algo = list.find((r) => r && isAlgorandNetwork(r.network));
  return algo || list[0];
}

/**
 * @param {typeof globalThis.fetch} fetchFn
 * @param {string} [privateKeyBase64]
 */
export async function createAlgorandX402WrapFetch(fetchFn, privateKeyBase64) {
  const key = privateKeyBase64 || getAlgorandAgentPrivateKey();
  if (!key) {
    throw new Error(
      "ALGORAND_AGENT_PRIVATE_KEY (or AVM_PRIVATE_KEY) must be set for Algorand x402 payments"
    );
  }

  const { wrapFetchWithPayment } = await import("@x402-avm/fetch");
  const { x402Client } = await import("@x402-avm/core/client");

  const signer = toClientAvmSigner(key);
  const client = new x402Client(selectAlgorandPaymentRequirements);
  registerExactAvmScheme(client, { signer, algodConfig: getAlgorandClientAlgodConfig() });

  return wrapFetchWithPayment(fetchFn, client);
}

/**
 * Call x402 v2 API paying on Algorand USDC (selects algorand:* accept).
 * @param {import('@solana/web3.js').Keypair | null} _keypair - unused; Algorand uses AVM key
 * @param {{ url: string; method?: string; query?: Record<string, string>; body?: object; connectedWalletAddress?: string; extraHeaders?: Record<string, string> }} opts
 * @param {typeof globalThis.fetch} [fetchFn]
 */
export async function callX402AlgorandWithOpts(opts, fetchFn = globalThis.fetch) {
  const { url, method = "GET", query = {}, body, connectedWalletAddress, extraHeaders } = opts;

  const buildUrl = () => {
    const u = new URL(url);
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== "") u.searchParams.set(k, String(v));
    });
    return u.toString();
  };

  const initialUrl = buildUrl();
  const headers = { Accept: "application/json" };
  if (method === "POST" || (body && method !== "GET" && method !== "HEAD")) {
    headers["Content-Type"] = "application/json";
  }
  if (connectedWalletAddress && typeof connectedWalletAddress === "string" && connectedWalletAddress.trim()) {
    headers["X-Connected-Wallet"] = connectedWalletAddress.trim();
  }
  if (extraHeaders && typeof extraHeaders === "object") {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (typeof k === "string" && typeof v === "string" && v.trim()) {
        headers[k] = v.trim();
      }
    }
  }

  const initOpts = {
    method,
    headers,
    redirect: "manual",
    ...(body && method === "POST" ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const paymentFetch = await createAlgorandX402WrapFetch(fetchFn);
    const res = await paymentFetch(initialUrl, initOpts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        data?.error ||
        data?.message ||
        (typeof data?.detail === "string" ? data.detail : "") ||
        res.statusText ||
        `Request failed: ${res.status}`;
      return {
        success: false,
        error: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg),
      };
    }
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e?.message || String(e) };
  }
}
