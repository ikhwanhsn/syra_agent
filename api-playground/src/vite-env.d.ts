/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_X402_FACILITATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Polyfill for Buffer in browser
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
