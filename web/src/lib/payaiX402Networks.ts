/**
 * PayAI facilitator mainnet networks for the playground UI.
 * @see https://docs.payai.network/x402/supported-networks
 * @see api/config/payaiX402Networks.js
 */

export type PaymentChainId =
  | 'solana'
  | 'base'
  | 'polygon'
  | 'arbitrum'
  | 'avalanche'
  | 'sei'
  | 'skale'
  | 'xlayer'
  | 'binance';

export interface PayaiMainnetNetwork {
  id: PaymentChainId;
  label: string;
  caip2: string;
  kind: 'solana' | 'evm';
}

/** PayAI-documented mainnets only (no testnets). */
export const PAYAI_MAINNET_NETWORKS: ReadonlyArray<PayaiMainnetNetwork> = [
  {
    id: 'solana',
    label: 'Solana',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    kind: 'solana',
  },
  {
    id: 'base',
    label: 'Base',
    caip2: 'eip155:8453',
    kind: 'evm',
  },
  {
    id: 'polygon',
    label: 'Polygon',
    caip2: 'eip155:137',
    kind: 'evm',
  },
  {
    id: 'arbitrum',
    label: 'Arbitrum',
    caip2: 'eip155:42161',
    kind: 'evm',
  },
  {
    id: 'avalanche',
    label: 'Avalanche',
    caip2: 'eip155:43114',
    kind: 'evm',
  },
  {
    id: 'sei',
    label: 'Sei',
    caip2: 'eip155:1329',
    kind: 'evm',
  },
  {
    id: 'skale',
    label: 'SKALE',
    caip2: 'eip155:1187947933',
    kind: 'evm',
  },
  {
    id: 'xlayer',
    label: 'X Layer',
    caip2: 'eip155:196',
    kind: 'evm',
  },
] as const;

/** BSC B402 — Syra lane alongside PayAI (not on PayAI facilitator). */
export const BSC_MAINNET_PLAYGROUND: PayaiMainnetNetwork = {
  id: 'binance',
  label: 'Binance',
  caip2: 'eip155:56',
  kind: 'evm',
};

/** Playground network picker: all PayAI mainnets + Binance B402. Solana first (default). */
export const PLAYGROUND_PAYMENT_CHAINS: ReadonlyArray<{ id: PaymentChainId; label: string }> = [
  ...PAYAI_MAINNET_NETWORKS.map((n) => ({ id: n.id, label: n.label })),
  { id: BSC_MAINNET_PLAYGROUND.id, label: BSC_MAINNET_PLAYGROUND.label },
];

const CAIP2_TO_CHAIN_ID = new Map<string, PaymentChainId>(
  [...PAYAI_MAINNET_NETWORKS, BSC_MAINNET_PLAYGROUND].map((n) => [n.caip2, n.id]),
);

const CHAIN_ID_TO_NETWORK = new Map<PaymentChainId, PayaiMainnetNetwork>(
  [...PAYAI_MAINNET_NETWORKS, BSC_MAINNET_PLAYGROUND].map((n) => [n.id, n]),
);

export function getPayaiChainIdByCaip2(caip2: string): PaymentChainId | null {
  return CAIP2_TO_CHAIN_ID.get(String(caip2 || '').trim()) ?? null;
}

export function getPlaygroundNetwork(chainId: PaymentChainId): PayaiMainnetNetwork | undefined {
  return CHAIN_ID_TO_NETWORK.get(chainId);
}

export function isEvmPaymentChain(chainId: PaymentChainId): boolean {
  return chainId !== 'solana';
}

export const PAYMENT_CHAIN_IDS: readonly PaymentChainId[] = PLAYGROUND_PAYMENT_CHAINS.map(
  (c) => c.id,
);
