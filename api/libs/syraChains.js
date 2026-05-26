/**
 * Supported Syra agent execution chains.
 * @typedef {'solana'|'base'|'bsc'} SyraAgentChain
 */

/** @type {readonly SyraAgentChain[]} */
export const SYRA_AGENT_CHAINS = ['solana', 'base', 'bsc'];

/**
 * @param {unknown} raw
 * @returns {SyraAgentChain}
 */
export function normalizeAgentChain(raw) {
  const c = String(raw || 'solana').toLowerCase().trim();
  if (c === 'base') return 'base';
  if (c === 'bsc' || c === 'bnb' || c === 'bsc-testnet') return 'bsc';
  return 'solana';
}

/**
 * @param {SyraAgentChain} chain
 * @returns {boolean}
 */
export function isEvmAgentChain(chain) {
  return chain === 'base' || chain === 'bsc';
}

/**
 * @param {SyraAgentChain} chain
 * @returns {string}
 */
export function chainDisplayName(chain) {
  if (chain === 'base') return 'Base';
  if (chain === 'bsc') return 'BNB Chain';
  return 'Solana';
}

/**
 * @param {SyraAgentChain} chain
 * @returns {number | null} EVM chain id when applicable
 */
export function evmChainId(chain) {
  if (chain === 'base') return 8453;
  if (chain === 'bsc') {
    const net = String(process.env.BNB_AGENT_NETWORK || process.env.NETWORK || 'bsc-testnet').toLowerCase();
    return net.includes('mainnet') && !net.includes('test') ? 56 : 97;
  }
  return null;
}

/**
 * Public status for GET /agent/chains
 */
export function getSyraChainsStatus() {
  const bnbAgentUrl = (process.env.BNB_AGENT_PUBLIC_URL || process.env.ERC8183_AGENT_URL || '').trim();
  const bnbEnabled = Boolean(
    (process.env.ERC8183_INTERNAL_SECRET || '').trim() &&
      (bnbAgentUrl || (process.env.BNB_AGENT_ENABLED || '').toLowerCase() === 'true'),
  );
  return {
    chains: [
      {
        id: 'solana',
        name: 'Solana',
        caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'active',
        features: ['chat', 'x402', 'agent_wallet', 'erc8004'],
      },
      {
        id: 'base',
        name: 'Base',
        caip2: 'eip155:8453',
        status: 'limited',
        features: ['x402', 'portfolio'],
        note: 'User custodial Base agent wallets are disabled; x402 and Zerion portfolio supported.',
      },
      {
        id: 'bsc',
        name: 'BNB Chain',
        caip2: `eip155:${evmChainId('bsc')}`,
        status: bnbEnabled ? 'active' : 'configure',
        features: bnbEnabled
          ? ['erc8004', 'erc8183', 'gmgn', 'portfolio']
          : ['gmgn', 'portfolio'],
        erc8183: bnbEnabled
          ? {
              statusUrl: bnbAgentUrl ? `${bnbAgentUrl.replace(/\/$/, '')}/erc8183/status` : null,
              negotiateUrl: bnbAgentUrl ? `${bnbAgentUrl.replace(/\/$/, '')}/erc8183/negotiate` : null,
            }
          : null,
        note: bnbEnabled
          ? 'BNB agent commerce via ERC-8183 sidecar; intelligence executed by Syra API.'
          : 'Set BNB_AGENT_ENABLED=true, ERC8183_INTERNAL_SECRET, and deploy services/bnb-agent.',
      },
    ],
  };
}
