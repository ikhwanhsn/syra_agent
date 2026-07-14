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
  getEnabledAlgorandNetworks,
  getGoplausibleFacilitatorUrl,
  isAlgorandEnabled,
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

  resourceServerInstance = {
    resourceServer: server,
    config: {
      networks: getEnabledAlgorandNetworks(),
    },
  };
  return resourceServerInstance;
}

/**
 * Initialize AVM resource server (fetch supported kinds from GoPlausible).
 */
export async function ensureX402AvmResourceServerInitialized() {
  if (!isAlgorandEnabled()) return;
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
