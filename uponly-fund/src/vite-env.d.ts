/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYRA_API_URL?: string;
  readonly VITE_PUBLIC_SITE_ORIGIN?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
