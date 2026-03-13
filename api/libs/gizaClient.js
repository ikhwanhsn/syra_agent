/**
 * Giza Agent SDK client for DeFi yield optimization (Base, Arbitrum).
 * Requires GIZA_API_KEY, GIZA_API_URL, GIZA_PARTNER_NAME. Optional GIZA_CHAIN=base|arbitrum (default base).
 */
let gizaInstance = null;
let gizaInitPromise = null;

function getChainFromEnv() {
  const chain = (process.env.GIZA_CHAIN || 'base').toLowerCase();
  // Chain enum from @gizatech/agent-sdk: BASE = 8453, ARBITRUM = 42161
  if (chain === 'arbitrum') return 42161;
  return 8453; // BASE
}

/**
 * @returns {Promise<import('@gizatech/agent-sdk').Giza | null>} Giza instance or null if env not configured
 */
export async function getGiza() {
  if (gizaInstance) return gizaInstance;
  const apiKey = process.env.GIZA_API_KEY;
  const apiUrl = process.env.GIZA_API_URL;
  const partner = process.env.GIZA_PARTNER_NAME;
  if (!apiKey || !apiUrl || !partner) return null;
  if (!gizaInitPromise) {
    gizaInitPromise = (async () => {
      try {
        const { Giza, Chain } = await import('@gizatech/agent-sdk');
        const chainId = getChainFromEnv();
        const chain = chainId === 42161 ? Chain.ARBITRUM : Chain.BASE;
        gizaInstance = new Giza({
          chain,
          apiKey,
          apiUrl,
          partner,
          timeout: 60000,
          enableRetry: true,
        });
        return gizaInstance;
      } catch (err) {
        gizaInitPromise = null;
        return null;
      }
    })();
  }
  return gizaInitPromise;
}

export function hasGizaCredentials() {
  return !!(process.env.GIZA_API_KEY && process.env.GIZA_API_URL && process.env.GIZA_PARTNER_NAME);
}

/**
 * Get agent by owner EOA (0x...). Uses getAgent if available, else createAgent for get-or-create.
 * @param {string} owner - EOA address (0x...)
 * @returns {Promise<import('@gizatech/agent-sdk').Agent | null>}
 */
export async function getAgentByOwner(owner) {
  const giza = await getGiza();
  if (!giza || !owner || typeof owner !== 'string') return null;
  const o = owner.trim();
  if (!o.startsWith('0x') || o.length < 40) return null;
  try {
    const agent = await giza.getAgent(/** @type {`0x${string}`} */ (o));
    return agent;
  } catch {
    try {
      const agent = await giza.createAgent(/** @type {`0x${string}`} */ (o));
      return agent;
    } catch {
      return null;
    }
  }
}
