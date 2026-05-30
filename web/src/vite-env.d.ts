/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYRA_API_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_PRIVY_CLIENT_ID?: string;
  readonly VITE_USE_PROXY?: string;
  /** Dev only: proxy /api to localhost:3000 instead of calling api.syraa.fun */
  readonly VITE_USE_LOCAL_API?: string;
  readonly VITE_NANSEN_API_BASE_URL?: string;
  readonly VITE_PURCH_VAULT_API_BASE_URL?: string;
  readonly VITE_SOLANA_NETWORK?: string;
  readonly VITE_STAKING_PROGRAM_ID?: string;
  readonly VITE_STAKING_MINT?: string;
  readonly VITE_REWARD_MINT?: string;
  readonly VITE_REWARD_PER_SECOND?: string;
  readonly VITE_REWARD_DECIMALS?: string;
  readonly VITE_STAKING_DECIMALS?: string;
  readonly VITE_STAKING_TOKEN_SYMBOL?: string;
  readonly VITE_REWARD_TOKEN_PRICE_USD?: string;
  readonly VITE_STAKING_TOKEN_PRICE_USD?: string;
  readonly VITE_STREAMFLOW_STAKING_MINT?: string;
  readonly VITE_ADMIN_DASHBOARD_WALLET?: string;
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

export {};
