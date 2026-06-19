/**
 * Injected EVM wallet (MetaMask, Rabby) for x402 EIP-3009 on BSC and Base (API Playground).
 * Uses the MetaMask provider explicitly — not Phantom's shared window.ethereum facade.
 */
import { useEffect, useState } from 'react';
import {
  createWalletClient,
  custom,
  getAddress,
  type Address,
  type Chain,
  type Hex,
} from 'viem';
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  polygon,
  sei,
  skaleBase,
  xLayer,
} from 'viem/chains';
import type { EvmSigner } from '@/lib/x402Client';
import type { PaymentChainId } from '@/lib/payaiX402Networks';
import { isEvmPaymentChain } from '@/lib/payaiX402Networks';

type EvmChainKey =
  | 'bsc'
  | 'base'
  | 'polygon'
  | 'arbitrum'
  | 'avalanche'
  | 'sei'
  | 'skale'
  | 'xlayer';

function buildAddParams(chain: Chain): Record<string, unknown> {
  const rpc = chain.rpcUrls.default.http[0];
  const explorer = chain.blockExplorers?.default?.url;
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: rpc ? [rpc] : [],
    blockExplorerUrls: explorer ? [explorer] : [],
  };
}

const CHAIN_CONFIG: Record<
  EvmChainKey,
  { chain: Chain; chainId: number; addParams: Record<string, unknown> }
> = {
  bsc: {
    chain: bsc,
    chainId: bsc.id,
    addParams: buildAddParams(bsc),
  },
  base: {
    chain: base,
    chainId: base.id,
    addParams: buildAddParams(base),
  },
  polygon: {
    chain: polygon,
    chainId: polygon.id,
    addParams: buildAddParams(polygon),
  },
  arbitrum: {
    chain: arbitrum,
    chainId: arbitrum.id,
    addParams: buildAddParams(arbitrum),
  },
  avalanche: {
    chain: avalanche,
    chainId: avalanche.id,
    addParams: buildAddParams(avalanche),
  },
  sei: {
    chain: sei,
    chainId: sei.id,
    addParams: buildAddParams(sei),
  },
  skale: {
    chain: skaleBase,
    chainId: skaleBase.id,
    addParams: buildAddParams(skaleBase),
  },
  xlayer: {
    chain: xLayer,
    chainId: xLayer.id,
    addParams: buildAddParams(xLayer),
  },
};

export type InjectedEip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isRabby?: boolean;
  providers?: InjectedEip1193Provider[];
  /** MetaMask: currently highlighted account in the extension (may differ from eth_accounts[0]). */
  selectedAddress?: string | null;
};

export interface BscWalletState {
  address: string | null;
  shortAddress: string | null;
  connected: boolean;
  /** Human label for the injected wallet used for signing (MetaMask, Rabby, …). */
  providerLabel: string | null;
  /** Bumped on every manual sync so React re-renders even if the address is unchanged. */
  syncGeneration: number;
}

let cachedAddress: string | null = null;
/** Provider used for eth_requestAccounts / signing — pinned on connect so UI matches MetaMask. */
let activeProvider: InjectedEip1193Provider | null = null;
let boundEventProvider: InjectedEip1193Provider | null = null;
const evmWalletListeners = new Set<() => void>();

function normalizeEvmAddress(value: string | null | undefined): string | null {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return null;
  try {
    return getAddress(value);
  } catch {
    return null;
  }
}

/**
 * MetaMask can return an old linked account as eth_accounts[0] while the extension UI
 * shows a different selected account — prefer selectedAddress, then requestAccounts order.
 */
function resolveActiveAccount(
  accounts: string[],
  provider: InjectedEip1193Provider
): string | null {
  const selected = normalizeEvmAddress(provider.selectedAddress ?? undefined);
  if (selected) {
    const inList = accounts
      .map((a) => normalizeEvmAddress(a))
      .find((a) => a && a.toLowerCase() === selected.toLowerCase());
    if (inList) return inList;
    return selected;
  }
  for (const raw of accounts) {
    const normalized = normalizeEvmAddress(raw);
    if (normalized) return normalized;
  }
  return null;
}

async function fetchMetaMaskAccounts(
  provider: InjectedEip1193Provider,
  requestPermission: boolean
): Promise<string[]> {
  const method = requestPermission ? 'eth_requestAccounts' : 'eth_accounts';
  const result = (await provider.request({ method })) as string[];
  return Array.isArray(result) ? result : [];
}

/** Opens MetaMask account permission UI when the user needs to switch linked accounts. */
async function requestMetaMaskAccountAccess(
  provider: InjectedEip1193Provider
): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    // Already pending or already authorized — continue with eth_requestAccounts
    if (code === 4001) {
      throw new Error('MetaMask connection cancelled.');
    }
  }
}

let walletSyncGeneration = 0;

let walletSnapshot: BscWalletState = {
  address: null,
  shortAddress: null,
  connected: false,
  providerLabel: null,
  syncGeneration: 0,
};

function providerLabel(provider: InjectedEip1193Provider | null): string | null {
  if (!provider) return null;
  if (provider.isRabby) return 'Rabby';
  if (provider.isMetaMask) return 'MetaMask';
  return 'EVM wallet';
}

function rebuildWalletSnapshot(): BscWalletState {
  const address = cachedAddress;
  const label = providerLabel(activeProvider ?? findMetaMaskProvider());
  walletSnapshot = {
    address,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    connected: Boolean(address),
    providerLabel: address ? label : null,
    syncGeneration: walletSyncGeneration,
  };
  return walletSnapshot;
}

function notifyEvmWalletListeners(force = false): void {
  if (force) walletSyncGeneration += 1;
  rebuildWalletSnapshot();
  evmWalletListeners.forEach((fn) => fn());
}

function listInjectedProviders(): InjectedEip1193Provider[] {
  if (typeof window === 'undefined') return [];
  const eth = (window as Window & { ethereum?: InjectedEip1193Provider }).ethereum;
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers;
  }
  return [eth];
}

/** Prefer real MetaMask (or Rabby) — avoid Phantom's ethereum when both are installed. */
export function findMetaMaskProvider(): InjectedEip1193Provider | null {
  const providers = listInjectedProviders();
  const metamask = providers.find((p) => p.isMetaMask === true && p.isPhantom !== true);
  if (metamask) return metamask;
  const rabby = providers.find((p) => p.isRabby === true);
  if (rabby) return rabby;
  const solo = providers[0];
  if (solo?.isMetaMask && !solo?.isPhantom) return solo;
  return null;
}

function getEthereumProvider(): InjectedEip1193Provider | null {
  return activeProvider ?? findMetaMaskProvider();
}

function bindEthereumWalletEvents(): void {
  if (typeof window === 'undefined') return;
  const provider = getEthereumProvider();
  if (!provider?.on || provider === boundEventProvider) return;
  boundEventProvider = provider;
  provider.on('accountsChanged', (accounts: unknown) => {
    const list = accounts as string[] | undefined;
    cachedAddress = resolveActiveAccount(list ?? [], provider);
    if (!cachedAddress) activeProvider = null;
    notifyEvmWalletListeners();
  });
}

async function applyProviderAccount(
  provider: InjectedEip1193Provider,
  requestPermission: boolean
): Promise<string | null> {
  activeProvider = provider;
  bindEthereumWalletEvents();
  const accounts = await fetchMetaMaskAccounts(provider, requestPermission);
  const address = resolveActiveAccount(accounts, provider);
  cachedAddress = address;
  if (!address) activeProvider = null;
  notifyEvmWalletListeners();
  return address;
}

export function getBscWalletState(): BscWalletState {
  return rebuildWalletSnapshot();
}

export function useEvmWalletState(enabled = true): BscWalletState {
  const [state, setState] = useState<BscWalletState>(getBscWalletState);

  useEffect(() => {
    if (!enabled) return;
    const listener = () => {
      const next = getBscWalletState();
      setState((prev) =>
        prev.address === next.address &&
        prev.connected === next.connected &&
        prev.syncGeneration === next.syncGeneration
          ? prev
          : next,
      );
    };
    evmWalletListeners.add(listener);
    bindEthereumWalletEvents();
    void syncEvmWalletFromProvider();
    const onFocus = () => void syncEvmWalletFromProvider();
    window.addEventListener('focus', onFocus);
    return () => {
      evmWalletListeners.delete(listener);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled]);

  return enabled ? state : getBscWalletState();
}

export async function ensureEvmChain(chain: EvmChainKey): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error(
      'MetaMask not detected. Install MetaMask for EVM payments (Solana wallets like Phantom cannot sign EVM payments).',
    );
  }
  const cfg = CHAIN_CONFIG[chain];
  const chainIdHex = `0x${cfg.chainId.toString(16)}`;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [cfg.addParams],
      });
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } else {
      throw err;
    }
  }
}

/** @deprecated use ensureEvmChain('bsc') */
export const ensureBscChain = () => ensureEvmChain('bsc');

function evmChainKey(chain: PaymentChainId): EvmChainKey {
  if (chain === 'binance') return 'bsc';
  if (chain === 'solana') {
    throw new Error('Solana is not an EVM chain');
  }
  return chain;
}

export function isPlaygroundEvmPaymentChain(chain: PaymentChainId): boolean {
  return isEvmPaymentChain(chain);
}

/**
 * Sync the connected EVM address with MetaMask's currently selected account.
 * @param requestPermission When true, uses eth_requestAccounts (no popup if already linked).
 */
export async function syncEvmWalletFromProvider(
  requestPermission = true,
  options?: { forceNotify?: boolean }
): Promise<string | null> {
  const provider = findMetaMaskProvider();
  if (!provider) {
    if (cachedAddress) {
      cachedAddress = null;
      activeProvider = null;
      boundEventProvider = null;
      notifyEvmWalletListeners(true);
    }
    return null;
  }
  const address = await applyProviderAccount(provider, requestPermission);
  notifyEvmWalletListeners(options?.forceNotify ?? false);
  return address;
}

/**
 * Re-link MetaMask for the playground: prompts account picker when needed,
 * switches chain, and forces UI + balance refresh.
 */
export async function refreshMetaMaskWallet(chain: PaymentChainId): Promise<string> {
  activeProvider = null;
  boundEventProvider = null;

  const provider = findMetaMaskProvider();
  if (!provider) {
    notifyEvmWalletListeners(true);
    throw new Error(
      'MetaMask not detected. Install MetaMask for EVM payments.',
    );
  }

  await requestMetaMaskAccountAccess(provider);
  const address = await applyProviderAccount(provider, true);
  if (!address) {
    notifyEvmWalletListeners(true);
    throw new Error('No MetaMask account returned. Unlock MetaMask and try again.');
  }

  await ensureEvmChain(evmChainKey(chain));
  const refreshed = await applyProviderAccount(provider, true);
  const finalAddress = refreshed ?? address;
  notifyEvmWalletListeners(true);
  return finalAddress;
}

export async function connectEvmWallet(chain: PaymentChainId): Promise<string> {
  const evmChain = evmChainKey(chain);
  const provider = findMetaMaskProvider();
  if (!provider) {
    throw new Error(
      'MetaMask not detected. Install MetaMask for EVM payments. If you use Phantom for Solana, connect MetaMask separately for EVM chains.',
    );
  }
  const address = await applyProviderAccount(provider, true);
  if (!address) throw new Error('No EVM account returned from MetaMask');
  await ensureEvmChain(evmChain);
  await syncEvmWalletFromProvider(true);
  return cachedAddress ?? address;
}

/** @deprecated use connectEvmWallet */
export const connectBscWallet = () => connectEvmWallet('binance');

export function disconnectBscWallet(): void {
  cachedAddress = null;
  activeProvider = null;
  boundEventProvider = null;
  notifyEvmWalletListeners(true);
}

export async function getEvmSigner(chain: PaymentChainId): Promise<EvmSigner> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask not detected. Connect MetaMask before paying on EVM networks.');
  }
  const evmChain = evmChainKey(chain);
  await syncEvmWalletFromProvider();
  if (!cachedAddress) {
    await connectEvmWallet(chain);
  }
  await ensureEvmChain(evmChain);
  await syncEvmWalletFromProvider();
  const address = cachedAddress as Address;
  const viemChain = CHAIN_CONFIG[evmChain].chain;
  const client = createWalletClient({
    account: address,
    chain: viemChain,
    transport: custom(provider),
  });

  return {
    address,
    signTypedData: async (args) => {
      const sig = await client.signTypedData({
        account: address,
        domain: args.domain as Parameters<typeof client.signTypedData>[0]['domain'],
        types: args.types as Parameters<typeof client.signTypedData>[0]['types'],
        primaryType: args.primaryType as Parameters<typeof client.signTypedData>[0]['primaryType'],
        message: args.message as Parameters<typeof client.signTypedData>[0]['message'],
      });
      return sig as Hex;
    },
  };
}

/** @deprecated use getEvmSigner('bsc') */
export const getBscEvmSigner = () => getEvmSigner('binance');
