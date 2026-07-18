/**
 * Public Invest opportunities catalog — onchain Solana protocols only.
 * Single source of truth for the Invest page board + deposit adapters.
 */

/** @typedef {'liquid_staking' | 'lending' | 'lp'} InvestKind */

/**
 * @typedef {Object} InvestCatalogEntry
 * @property {string} id
 * @property {string} label
 * @property {string} protocol
 * @property {'solana'} chain
 * @property {InvestKind} kind
 * @property {boolean} executable — true when Syra can build + broker-sign a deposit tx
 * @property {string | null} deepLinkUrl — external dApp for non-executable cards
 * @property {string} defillamaProject — yields.llama.fi pool `project` slug
 * @property {string} defillamaProtocol — api.llama.fi/protocol slug for TVL fallback
 * @property {string} toolId
 * @property {string} description
 * @property {string} riskNote
 */

/** @type {InvestCatalogEntry[]} */
export const INVEST_CATALOG = Object.freeze([
  {
    id: 'marinade',
    label: 'Marinade',
    protocol: 'Marinade Finance',
    chain: 'solana',
    kind: 'liquid_staking',
    executable: true,
    deepLinkUrl: null,
    defillamaProject: 'marinade-liquid-staking',
    defillamaProtocol: 'marinade-liquid-staking',
    toolId: 'invest-marinade-deposit',
    description:
      'Stake SOL for mSOL — liquid staking with native yield. Deposit from your invest agent wallet.',
    riskNote: 'Liquid staking risk: smart-contract and validator set risk. mSOL can trade at a discount to SOL.',
  },
  {
    id: 'jito',
    label: 'Jito',
    protocol: 'Jito',
    chain: 'solana',
    kind: 'liquid_staking',
    executable: true,
    deepLinkUrl: null,
    defillamaProject: 'jito-liquid-staking',
    defillamaProtocol: 'jito-liquid-staking',
    toolId: 'invest-jito-deposit',
    description:
      'Stake SOL for JitoSOL — liquid staking plus MEV tips. Deposit from your invest agent wallet.',
    riskNote: 'Liquid staking + MEV risk: smart-contract risk; JitoSOL can trade at a discount to SOL.',
  },
  {
    id: 'kamino',
    label: 'Kamino',
    protocol: 'Kamino Finance',
    chain: 'solana',
    kind: 'lending',
    executable: false,
    deepLinkUrl: 'https://app.kamino.finance/',
    defillamaProject: 'kamino-lend',
    defillamaProtocol: 'kamino-lend',
    toolId: 'invest-kamino-link',
    description: 'Solana lending and automated vaults. Browse live APY here, deposit on Kamino.',
    riskNote: 'Lending risk: smart-contract, liquidation, and oracle risk. Not executed inside Syra yet.',
  },
  {
    id: 'marginfi',
    label: 'marginfi',
    protocol: 'marginfi',
    chain: 'solana',
    kind: 'lending',
    executable: false,
    deepLinkUrl: 'https://app.marginfi.com/',
    defillamaProject: 'marginfi-lst',
    defillamaProtocol: 'marginfi',
    toolId: 'invest-marginfi-link',
    description: 'Deposit to earn lending APY on Solana. Browse live APY here, deposit on marginfi.',
    riskNote: 'Lending risk: smart-contract, liquidation, and oracle risk. Not executed inside Syra yet.',
  },
  {
    id: 'meteora',
    label: 'Meteora',
    protocol: 'Meteora',
    chain: 'solana',
    kind: 'lp',
    executable: false,
    deepLinkUrl: 'https://app.meteora.ag/dlmm',
    defillamaProject: 'meteora',
    defillamaProtocol: 'meteora',
    toolId: 'invest-meteora-link',
    description: 'DLMM liquidity pools on Solana. Browse live APY here, provide liquidity on Meteora.',
    riskNote: 'LP risk: impermanent loss and smart-contract risk. Not executed from this Invest board.',
  },
]);

/** @type {ReadonlySet<string>} */
export const PUBLIC_INVEST_ADAPTERS = new Set(INVEST_CATALOG.map((e) => e.id));

/** @type {ReadonlySet<string>} */
export const EXECUTABLE_INVEST_ADAPTERS = new Set(
  INVEST_CATALOG.filter((e) => e.executable).map((e) => e.id),
);

/**
 * @param {string} id
 * @returns {InvestCatalogEntry | undefined}
 */
export function getInvestCatalogEntry(id) {
  const key = String(id || '')
    .trim()
    .toLowerCase();
  return INVEST_CATALOG.find((e) => e.id === key);
}
