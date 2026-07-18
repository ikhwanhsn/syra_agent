/**
 * x402 V2 AVM Resource Server (GoPlausible facilitator).
 *
 * Algorand verify/settle for the Global x402 Challenge leaderboard.
 * @see https://facilitator.goplausible.xyz/docs
 */
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402-avm/core/server";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/server";
import dotenv from "dotenv";
import {
  ALGORAND_X402_NETWORKS,
  getEnabledAlgorandNetworks,
  getGoplausibleFacilitatorUrl,
} from "../config/algorandX402Networks.js";

dotenv.config({ quiet: true });

/** @type {{ resourceServer: import('@x402-avm/core/server').x402ResourceServer, config: { networks: import('../config/algorandX402Networks.js').AlgorandX402Network[] } } | null} */
let resourceServerInstance = null;
let initPromise = null;

/**
 * Singleton AVM x402 resource server (GoPlausible facilitator).
 * @returns {{ resourceServer: import('@x402-avm/core/server').x402ResourceServer, config: { networks: import('../config/algorandX402Networks.js').AlgorandX402Network[] } }}
 */
export function getX402AvmResourceServer() {
  if (resourceServerInstance) {
    return resourceServerInstance;
  }

  const facilitatorUrl = getGoplausibleFacilitatorUrl();
  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const server = new x402ResourceServer(facilitatorClient);
  registerExactAvmScheme(server, {});

  const enabled = getEnabledAlgorandNetworks();
  resourceServerInstance = {
    resourceServer: server,
    config: {
      // Labs may run with Mongo PayTo and no ALGORAND_PAYTO — still need mainnet defaults.
      networks:
        enabled.length > 0
          ? enabled
          : ALGORAND_X402_NETWORKS.filter((n) => n.defaultEnabled),
    },
  };
  return resourceServerInstance;
}

/**
 * Initialize AVM resource server (fetch supported kinds from GoPlausible).
 *
 * Always initialize when called — do not gate on env ALGORAND_PAYTO.
 * Labs Algorand PayTo lives in Mongo and can pay without merchant env; callers only
 * invoke this when an Algorand accept/verify/settle is in flight. Skipping init left
 * the server unregistered and broke both manual and scheduler Labs runs with
 * "No facilitator registered for x402 version".
 */
export async function ensureX402AvmResourceServerInitialized() {
  const { resourceServer } = getX402AvmResourceServer();
  if (!initPromise) {
    initPromise = resourceServer.initialize().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  await initPromise;
}

export {
  getEnabledAlgorandNetworks,
  getAlgorandPayTo,
  isAlgorandEnabled,
  getAlgorandPublicStatus,
} from "../config/algorandX402Networks.js";
