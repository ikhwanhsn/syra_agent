/**
 * x402 V2 OKX facilitator resource server — X Layer verify/settle for Agentic Wallets.
 * @see https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk
 */
import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { x402ResourceServer } from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import dotenv from "dotenv";
import {
  getEnabledOkxX402Networks,
  getOkxNetworkByCaip2,
  isOkxX402Enabled,
} from "../config/okxX402Networks.js";

dotenv.config();

function env(name) {
  return String(process.env[name] || "").trim();
}

function atomicUsdcFromUsd(usd) {
  return String(Math.round(usd * 1_000_000));
}

/** @type {{ resourceServer: import('@okxweb3/x402-core/server').x402ResourceServer, config: { networks: import('../config/okxX402Networks.js').OkxX402Network[] } } | null} */
let resourceServerInstance = null;
let initPromise = null;
let initFailed = false;

/**
 * @returns {boolean}
 */
export function isOkxX402FacilitatorReady() {
  return isOkxX402Enabled() && Boolean(initPromise) && !initFailed;
}

function createOkxFacilitatorClient() {
  const syncSettleRaw = env("OKX_X402_SYNC_SETTLE").toLowerCase();
  const syncSettle = syncSettleRaw === "true" || syncSettleRaw === "1";
  const baseUrl = env("OKX_X402_BASE_URL") || env("OKX_BASE_URL") || undefined;

  return new OKXFacilitatorClient({
    apiKey: env("OKX_API_KEY") || env("OKX_ACCESS_KEY"),
    secretKey: env("OKX_SECRET_KEY"),
    passphrase: env("OKX_PASSPHRASE"),
    ...(baseUrl ? { baseUrl } : {}),
    syncSettle,
  });
}

/**
 * Singleton OKX x402 resource server (X Layer EVM exact scheme).
 */
export function getOkxX402ResourceServer() {
  if (resourceServerInstance) {
    return resourceServerInstance;
  }

  const facilitatorClient = createOkxFacilitatorClient();
  const server = new x402ResourceServer(facilitatorClient);

  const evmScheme = new ExactEvmScheme().registerMoneyParser(async (amount, net) => {
    const row = getOkxNetworkByCaip2(net);
    if (!row) return null;
    return { asset: row.stablecoin, amount: atomicUsdcFromUsd(amount) };
  });

  for (const net of getEnabledOkxX402Networks()) {
    server.register(net.caip2, evmScheme);
  }

  resourceServerInstance = {
    resourceServer: server,
    config: {
      networks: getEnabledOkxX402Networks(),
    },
  };
  return resourceServerInstance;
}

/**
 * Initialize OKX resource server (fetch /supported kinds from OKX facilitator).
 * @returns {Promise<boolean>} true when facilitator is ready for verify/settle
 */
export async function ensureOkxX402ResourceServerInitialized() {
  if (!isOkxX402Enabled()) return false;
  if (initFailed) return false;
  const { resourceServer } = getOkxX402ResourceServer();
  if (!initPromise) {
    initPromise = resourceServer
      .initialize()
      .then(() => true)
      .catch((e) => {
        initFailed = true;
        initPromise = null;
        console.warn(
          "[okx-x402] facilitator initialize failed — 402 may still list X Layer; verify/settle need Payments API keys:",
          e?.message || e,
        );
        return false;
      });
  }
  return initPromise;
}

export {
  getEnabledOkxX402Networks,
  getOkxX402PayTo,
  getOkxX402PublicStatus,
  isOkxX402Enabled,
  isOkxX402Network,
} from "../config/okxX402Networks.js";
